package messages

import (
	"context"
	"errors"
	"time"

	"github.com/ahanyamariam/echo/internal/conversations"
)

type Service struct {
	repo     *Repository
	convRepo *conversations.Repository
}

func NewService(repo *Repository, convRepo *conversations.Repository) *Service {
	return &Service{
		repo:     repo,
		convRepo: convRepo,
	}
}

func (s *Service) List(ctx context.Context, conversationID, userID string, limit int, before string) ([]*Message, bool, error) {
	// Verify membership
	isMember, err := s.convRepo.IsMember(ctx, conversationID, userID)
	if err != nil {
		return nil, false, err
	}
	if !isMember {
		return nil, false, errors.New("not a member")
	}

	return s.repo.List(ctx, conversationID, limit, before)
}

func (s *Service) Create(ctx context.Context, conversationID, senderID, messageType string, text, mediaURL *string, expiresAt *time.Time, isOneTime bool, audioDuration *int) (*Message, error) {
	// Verify membership
	isMember, err := s.convRepo.IsMember(ctx, conversationID, senderID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, errors.New("not a member")
	}

	// Check if conversation has disappearing messages enabled
	// If expiresAt is passed from arg (e.g. from frontend), use it.
	// Otherwise check conversation settings.
	if expiresAt == nil {
		conv, err := s.convRepo.GetByID(ctx, conversationID)
		if err == nil && conv.DisappearingMessagesEnabled {
			expiry := time.Now().Add(time.Duration(conv.DisappearingMessagesDuration) * time.Second)
			expiresAt = &expiry
		}
	}

	return s.repo.Create(ctx, conversationID, senderID, messageType, text, mediaURL, expiresAt, isOneTime, audioDuration)
}

func (s *Service) GetByID(ctx context.Context, id string) (*Message, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) MarkAsViewed(ctx context.Context, messageID, userID string) error {
	msg, err := s.repo.GetByID(ctx, messageID)
	if err != nil {
		return err
	}

	// Verify membership
	isMember, err := s.convRepo.IsMember(ctx, msg.ConversationID, userID)
	if err != nil {
		return err
	}
	if !isMember {
		return errors.New("not a member")
	}

	return s.repo.MarkAsViewed(ctx, messageID)
}

// IncrementPlayCount increments the play count for a one-time audio message
// Returns the new play count and an error if the message is not found or user is not a member
func (s *Service) IncrementPlayCount(ctx context.Context, messageID, userID string) (int, error) {
	msg, err := s.repo.GetByID(ctx, messageID)
	if err != nil {
		return 0, err
	}

	// Verify membership
	isMember, err := s.convRepo.IsMember(ctx, msg.ConversationID, userID)
	if err != nil {
		return 0, err
	}
	if !isMember {
		return 0, errors.New("not a member")
	}

	// Only allow incrementing play count for one-time audio messages
	if msg.MessageType != "audio" {
		return 0, errors.New("not an audio message")
	}

	return s.repo.IncrementPlayCount(ctx, messageID)
}

func (s *Service) CleanupExpiredMessages(ctx context.Context) (int64, error) {
	return s.repo.DeleteExpiredMessages(ctx)
}
