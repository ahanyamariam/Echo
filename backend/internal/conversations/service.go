package conversations

import (
	"context"
	"errors"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListForUser(ctx context.Context, userID string) ([]*ConversationWithDetails, error) {
	return s.repo.ListForUser(ctx, userID)
}

func (s *Service) CreateOrGetDM(ctx context.Context, userID, otherUserID string) (*ConversationWithDetails, bool, error) {
	if userID == otherUserID {
		return nil, false, errors.New("cannot create conversation with yourself")
	}

	// Check if DM already exists
	existing, err := s.repo.FindDMBetweenUsers(ctx, userID, otherUserID)
	if err != nil {
		return nil, false, err
	}
	if existing != nil {
		return existing, false, nil
	}

	// Create new DM conversation
	conv, err := s.repo.CreateDM(ctx, userID, otherUserID)
	if err != nil {
		return nil, false, err
	}

	return conv, true, nil
}

func (s *Service) IsMember(ctx context.Context, conversationID, userID string) (bool, error) {
	return s.repo.IsMember(ctx, conversationID, userID)
}

func (s *Service) GetMemberIDs(ctx context.Context, conversationID string) ([]string, error) {
	return s.repo.GetMemberIDs(ctx, conversationID)
}

func (s *Service) GetByID(ctx context.Context, conversationID string) (*ConversationWithDetails, error) {
	return s.repo.GetByID(ctx, conversationID)
}