package middleware

import (
	"math"
	"net/http"
	"sync"
	"time"

	"github.com/ahanyamariam/echo/internal/common"
)

// tokenBucket implements the Token Bucket rate limiting algorithm.
// Each client (identified by IP) gets a bucket with a fixed capacity.
// Tokens are consumed on each request and refilled at a constant rate.
// When no tokens remain, requests are rejected with HTTP 429.
//
// Design rationale:
//   - Token Bucket allows short bursts (e.g. sending several messages quickly)
//     while enforcing a sustained average rate, making it ideal for chat apps.
//   - Unlike a fixed-window counter, it doesn't suffer from boundary burst issues.
//
// Mathematical model:
//   tokens = min(capacity, tokens + elapsed_seconds * refill_rate)
//   Each request consumes 1 token.
type tokenBucket struct {
	tokens     float64
	capacity   float64
	refillRate float64    // tokens per second
	lastRefill time.Time
	mu         sync.Mutex
}

// allow checks if a request is permitted by attempting to consume one token.
// It first refills tokens based on elapsed time using the formula:
//
//	newTokens = min(capacity, currentTokens + elapsedSeconds * refillRate)
//
// Returns true if a token was available and consumed, false otherwise.
func (b *tokenBucket) allow() bool {
	b.mu.Lock()
	defer b.mu.Unlock()

	now := time.Now()
	elapsed := now.Sub(b.lastRefill).Seconds()

	// Refill tokens: mathematical computation using elapsed time * rate, clamped to capacity
	b.tokens = math.Min(b.capacity, b.tokens+elapsed*b.refillRate)
	b.lastRefill = now

	if b.tokens >= 1 {
		b.tokens--
		return true
	}
	return false
}

// RateLimiter manages per-IP token buckets with automatic cleanup.
// It uses sync.RWMutex for concurrent access to the bucket map,
// demonstrating Go concurrency primitives for thread-safe state management.
type RateLimiter struct {
	buckets    map[string]*tokenBucket
	mu         sync.RWMutex
	capacity   float64
	refillRate float64
	stopCh     chan struct{}
}

// NewRateLimiter creates a rate limiter with the given capacity and refill rate.
//
// Parameters:
//   - capacity: maximum burst size (e.g. 10 means a client can make 10 rapid requests)
//   - refillRate: tokens restored per second (e.g. 2.0 means 2 new requests allowed per second)
//
// It also spawns a background goroutine that cleans up stale buckets every 60 seconds
// to prevent unbounded memory growth from inactive clients.
func NewRateLimiter(capacity float64, refillRate float64) *RateLimiter {
	rl := &RateLimiter{
		buckets:    make(map[string]*tokenBucket),
		capacity:   capacity,
		refillRate: refillRate,
		stopCh:     make(chan struct{}),
	}

	// Background cleanup goroutine — removes buckets that have been inactive
	// for over 5 minutes to reclaim memory. Uses a ticker for periodic execution.
	go func() {
		ticker := time.NewTicker(60 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				rl.cleanup()
			case <-rl.stopCh:
				return
			}
		}
	}()

	return rl
}

// Stop halts the background cleanup goroutine.
func (rl *RateLimiter) Stop() {
	close(rl.stopCh)
}

// getBucket retrieves or creates a token bucket for the given IP address.
// Uses double-check locking: first attempts a read lock, then upgrades to
// a write lock only if the bucket doesn't exist — optimizing for the common case.
func (rl *RateLimiter) getBucket(ip string) *tokenBucket {
	// Fast path: read lock
	rl.mu.RLock()
	bucket, exists := rl.buckets[ip]
	rl.mu.RUnlock()

	if exists {
		return bucket
	}

	// Slow path: write lock to create new bucket
	rl.mu.Lock()
	defer rl.mu.Unlock()

	// Double-check after acquiring write lock
	if bucket, exists = rl.buckets[ip]; exists {
		return bucket
	}

	bucket = &tokenBucket{
		tokens:     rl.capacity,
		capacity:   rl.capacity,
		refillRate: rl.refillRate,
		lastRefill: time.Now(),
	}
	rl.buckets[ip] = bucket
	return bucket
}

// cleanup removes token buckets that have been idle for more than 5 minutes.
// This prevents memory leaks when many unique IPs hit the server briefly.
func (rl *RateLimiter) cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	threshold := time.Now().Add(-5 * time.Minute)
	for ip, bucket := range rl.buckets {
		bucket.mu.Lock()
		lastRefill := bucket.lastRefill
		bucket.mu.Unlock()

		if lastRefill.Before(threshold) {
			delete(rl.buckets, ip)
		}
	}
}

// Middleware returns an http.Handler middleware that enforces rate limiting.
// It extracts the client IP from chi's RealIP middleware (via r.RemoteAddr)
// and either allows the request through or responds with 429 Too Many Requests.
//
// The response includes a Retry-After header indicating when the client
// should retry (calculated as 1/refillRate seconds).
func (rl *RateLimiter) Middleware() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := r.RemoteAddr

			bucket := rl.getBucket(ip)

			if !bucket.allow() {
				// Calculate retry delay: time to get 1 token = 1 / refillRate
				retryAfter := math.Ceil(1.0 / rl.refillRate)
				w.Header().Set("Retry-After", formatFloat(retryAfter))
				common.Error(w, http.StatusTooManyRequests, "Rate limit exceeded. Please slow down.")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// formatFloat converts a float64 to its string representation as an integer.
func formatFloat(f float64) string {
	n := int(math.Ceil(f))
	if n <= 0 {
		return "1"
	}
	// Manual int-to-string conversion using mathematical division
	if n == 0 {
		return "0"
	}
	result := ""
	for n > 0 {
		digit := n % 10
		result = string(rune('0'+digit)) + result
		n /= 10
	}
	return result
}
