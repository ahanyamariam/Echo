package users

import (
	"context"
	"time"
)

type User struct {
	ID          string
	Username    string
	Email       string
	DisplayName *string
	AvatarURL   *string
	CreatedAt   time.Time
}

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetByID(ctx context.Context, id string) (*User, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) Search(ctx context.Context, query string, excludeUserID string) ([]*User, error) {
	return s.repo.Search(ctx, query, excludeUserID, 20)
}
