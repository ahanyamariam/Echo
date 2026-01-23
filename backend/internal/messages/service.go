package messages

import (
	"context"
	"errors"

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

func (s *Service) Create(ctx context.Context, conversationID, senderID, messageType string, text, mediaURL *string) (*Message, error) {
	// Verify membership
	isMember, err := s.convRepo.IsMember(ctx, conversationID, senderID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, errors.New("not a member")
	}

	return s.repo.Create(ctx, conversationID, senderID, messageType, text, mediaURL)
}

func (s *Service) GetByID(ctx context.Context, id string) (*Message, error) {
	return s.repo.GetByID(ctx, id)
}
