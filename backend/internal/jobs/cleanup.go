package jobs

import (
	"context"
	"log"
	"time"

	"github.com/ahanyamariam/echo/internal/messages"
)

type CleanupJob struct {
	msgService *messages.Service
	interval   time.Duration
	stopChan   chan struct{}
}

func NewCleanupJob(msgService *messages.Service, interval time.Duration) *CleanupJob {
	return &CleanupJob{
		msgService: msgService,
		interval:   interval,
		stopChan:   make(chan struct{}),
	}
}

func (j *CleanupJob) Start() {
	go func() {
		ticker := time.NewTicker(j.interval)
		defer ticker.Stop()

		log.Printf("Cleanup job started (interval: %v)", j.interval)

		// Run immediately on start
		j.cleanup()

		for {
			select {
			case <-ticker.C:
				j.cleanup()
			case <-j.stopChan:
				log.Println("Cleanup job stopped")
				return
			}
		}
	}()
}

func (j *CleanupJob) Stop() {
	close(j.stopChan)
}

func (j *CleanupJob) cleanup() {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	deleted, err := j.msgService.CleanupExpiredMessages(ctx)
	if err != nil {
		log.Printf("Cleanup job error: %v", err)
		return
	}

	if deleted > 0 {
		log.Printf("Cleanup job: deleted %d expired messages", deleted)
	}
}