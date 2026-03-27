package analytics

import (
	"context"
	"math"
	"sort"
	"strings"
	"unicode"

	"github.com/ahanyamariam/echo/internal/conversations"
)

// ConversationAnalytics is the full analytics response for a conversation.
type ConversationAnalytics struct {
	ConversationID      string             `json:"conversation_id"`
	TotalMessages       int                `json:"total_messages"`
	MessagesByType      map[string]int     `json:"messages_by_type"`
	AvgMessageLength    float64            `json:"avg_message_length"`
	StdDevMessageLength float64            `json:"std_dev_message_length"`
	TopWords            []WordFrequency    `json:"top_words"`
	HourlyActivity      map[string]float64 `json:"hourly_activity"`
	MessagesPerUser     map[string]int     `json:"messages_per_user"`
}

// WordFrequency represents a word and how often it appears.
type WordFrequency struct {
	Word  string `json:"word"`
	Count int    `json:"count"`
}

// Service contains the business logic for computing analytics.
// It demonstrates advanced string manipulation (word parsing, normalization,
// stop-word filtering) and mathematical computations (mean, standard deviation,
// percentage distributions).
type Service struct {
	repo     *Repository
	convRepo *conversations.Repository
}

// NewService creates a new analytics service.
func NewService(repo *Repository, convRepo *conversations.Repository) *Service {
	return &Service{repo: repo, convRepo: convRepo}
}

// stopWords is a set of common English words to exclude from word frequency analysis.
// Filtering these out surfaces the meaningful, content-bearing words in conversations.
var stopWords = map[string]bool{
	"the": true, "a": true, "an": true, "and": true, "or": true, "but": true,
	"in": true, "on": true, "at": true, "to": true, "for": true, "of": true,
	"is": true, "it": true, "this": true, "that": true, "was": true, "are": true,
	"be": true, "has": true, "have": true, "had": true, "do": true, "does": true,
	"did": true, "will": true, "would": true, "could": true, "should": true,
	"not": true, "no": true, "so": true, "if": true, "with": true, "as": true,
	"by": true, "from": true, "up": true, "about": true, "into": true, "just": true,
	"i": true, "me": true, "my": true, "we": true, "you": true, "your": true,
	"he": true, "she": true, "they": true, "them": true, "what": true, "which": true,
	"who": true, "when": true, "where": true, "how": true, "all": true, "can": true,
	"its": true, "than": true, "am": true, "been": true, "im": true, "dont": true,
}

// GetConversationAnalytics computes analytics for a conversation.
// The caller must verify membership before calling this.
func (s *Service) GetConversationAnalytics(ctx context.Context, conversationID, userID string) (*ConversationAnalytics, error) {
	// Verify membership
	isMember, err := s.convRepo.IsMember(ctx, conversationID, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, ErrNotMember
	}

	// Fetch raw messages for in-memory processing
	rawMessages, err := s.repo.GetMessagesByConversation(ctx, conversationID)
	if err != nil {
		return nil, err
	}

	// Fetch pre-aggregated counts from database
	typeCounts, err := s.repo.GetMessageCountsByType(ctx, conversationID)
	if err != nil {
		return nil, err
	}

	userCounts, err := s.repo.GetMessageCountsByUser(ctx, conversationID)
	if err != nil {
		return nil, err
	}

	// Build messagesByType map
	messagesByType := make(map[string]int)
	totalMessages := 0
	for _, tc := range typeCounts {
		messagesByType[tc.MessageType] = tc.Count
		totalMessages += tc.Count
	}

	// Build messagesPerUser map
	messagesPerUser := make(map[string]int)
	for _, uc := range userCounts {
		messagesPerUser[uc.UserID] = uc.Count
	}

	// --- String Manipulation & Mathematical Computations ---

	// Extract text messages for analysis
	var textLengths []float64
	wordFreq := make(map[string]int)
	hourlyCounts := make(map[int]int) // hour (0-23) -> count

	for _, msg := range rawMessages {
		// Hourly activity distribution
		hour := msg.CreatedAt.Hour()
		hourlyCounts[hour]++

		// Only analyze text messages for word/length stats
		if msg.Text != nil && *msg.Text != "" {
			text := *msg.Text

			// --- String Manipulation ---
			// 1. Calculate message length (in characters)
			textLengths = append(textLengths, float64(len([]rune(text))))

			// 2. Word frequency analysis with string parsing & normalization
			words := extractWords(text)
			for _, word := range words {
				wordFreq[word]++
			}
		}
	}

	// --- Mathematical Computations ---
	avgLength, stdDev := computeLengthStats(textLengths)
	hourlyActivity := computeHourlyDistribution(hourlyCounts, totalMessages)
	topWords := computeTopWords(wordFreq, 10)

	return &ConversationAnalytics{
		ConversationID:      conversationID,
		TotalMessages:       totalMessages,
		MessagesByType:      messagesByType,
		AvgMessageLength:    roundTo(avgLength, 1),
		StdDevMessageLength: roundTo(stdDev, 1),
		TopWords:            topWords,
		HourlyActivity:      hourlyActivity,
		MessagesPerUser:     messagesPerUser,
	}, nil
}

// extractWords performs advanced string manipulation:
//  1. Converts text to lowercase for case-insensitive analysis
//  2. Uses unicode-aware rune iteration to strip non-letter/non-space characters
//  3. Splits into individual words by whitespace
//  4. Filters out stop words and single-character tokens
//
// This demonstrates string parsing, validation, and transformation in Go.
func extractWords(text string) []string {
	// Step 1: Lowercase the entire string
	text = strings.ToLower(text)

	// Step 2: Strip non-letter, non-space characters using rune-level processing
	var cleaned strings.Builder
	for _, r := range text {
		if unicode.IsLetter(r) || unicode.IsSpace(r) {
			cleaned.WriteRune(r)
		}
	}

	// Step 3: Split by whitespace into tokens
	tokens := strings.Fields(cleaned.String())

	// Step 4: Filter out stop words and short tokens
	var words []string
	for _, token := range tokens {
		if len(token) > 1 && !stopWords[token] {
			words = append(words, token)
		}
	}
	return words
}

// computeLengthStats calculates the mean and population standard deviation
// of message lengths.
//
// Mathematical formulas:
//   - Mean:    μ = Σxᵢ / n
//   - Std Dev: σ = √(Σ(xᵢ - μ)² / n)
//
// Returns (0, 0) if the input slice is empty.
func computeLengthStats(lengths []float64) (mean float64, stdDev float64) {
	n := float64(len(lengths))
	if n == 0 {
		return 0, 0
	}

	// Calculate mean: μ = Σxᵢ / n
	sum := 0.0
	for _, l := range lengths {
		sum += l
	}
	mean = sum / n

	// Calculate variance: σ² = Σ(xᵢ - μ)² / n
	varianceSum := 0.0
	for _, l := range lengths {
		diff := l - mean
		varianceSum += diff * diff
	}
	stdDev = math.Sqrt(varianceSum / n)

	return mean, stdDev
}

// computeHourlyDistribution calculates what percentage of messages were sent
// in each hour of the day (0-23).
//
// Formula: percentage = (messagesInHour / totalMessages) × 100
//
// Returns a map with string keys "0" through "23", each containing a
// percentage value rounded to 1 decimal place.
func computeHourlyDistribution(hourlyCounts map[int]int, total int) map[string]float64 {
	distribution := make(map[string]float64)
	for hour := 0; hour < 24; hour++ {
		count := hourlyCounts[hour]
		percentage := 0.0
		if total > 0 {
			percentage = (float64(count) / float64(total)) * 100.0
		}
		// Convert hour int to string manually (demonstrating numeric processing)
		hourStr := intToString(hour)
		distribution[hourStr] = roundTo(percentage, 1)
	}
	return distribution
}

// computeTopWords sorts words by frequency and returns the top N.
// Uses Go's sort.Slice with a custom comparator for descending frequency order.
func computeTopWords(freq map[string]int, topN int) []WordFrequency {
	words := make([]WordFrequency, 0, len(freq))
	for word, count := range freq {
		words = append(words, WordFrequency{Word: word, Count: count})
	}

	// Sort descending by count, then alphabetically for ties
	sort.Slice(words, func(i, j int) bool {
		if words[i].Count != words[j].Count {
			return words[i].Count > words[j].Count
		}
		return words[i].Word < words[j].Word
	})

	if len(words) > topN {
		words = words[:topN]
	}
	return words
}

// roundTo rounds a float64 to the specified number of decimal places.
// Uses the formula: round(value × 10^places) / 10^places
func roundTo(val float64, places int) float64 {
	pow := math.Pow(10, float64(places))
	return math.Round(val*pow) / pow
}

// intToString converts a non-negative integer to its string representation
// using mathematical division and modulo operations.
func intToString(n int) string {
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
