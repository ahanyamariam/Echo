package profile

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"
)

var (
	ErrProfileNotFound = errors.New("profile not found")
	ErrInvalidFileType = errors.New("invalid file type")
	ErrFileTooLarge    = errors.New("file too large")
)

type Service struct {
	repo      *Repository
	uploadDir string
}

func NewService(repo *Repository, uploadDir string) *Service {
	return &Service{
		repo:      repo,
		uploadDir: uploadDir,
	}
}

func (s *Service) GetMyProfile(ctx context.Context, userID string) (*ProfileWithSettings, error) {
	profile, err := s.repo.GetProfile(ctx, userID)
	if err != nil {
		return nil, ErrProfileNotFound
	}

	settings, err := s.repo.GetSettings(ctx, userID)
	if err != nil {
		// If they don't exist, create them
		settings, err = s.repo.CreateDefaultSettings(ctx, userID)
		if err != nil {
			log.Printf("Failed to create default settings for user %s: %v", userID, err)
			// Return dummy settings if creation fails, or return error
			return nil, err
		}
	}

	return &ProfileWithSettings{
		Profile:  profile,
		Settings: settings,
	}, nil
}

func (s *Service) UpdateProfile(ctx context.Context, userID string, displayName, bio *string) (*Profile, error) {
	// Validate display name length
	if displayName != nil && len(*displayName) > 100 {
		return nil, errors.New("display name too long (max 100 characters)")
	}

	// Validate bio length
	if bio != nil && len(*bio) > 500 {
		return nil, errors.New("bio too long (max 500 characters)")
	}

	err := s.repo.UpdateProfile(ctx, userID, displayName, bio)
	if err != nil {
		return nil, err
	}

	return s.repo.GetProfile(ctx, userID)
}

func (s *Service) UploadAvatar(ctx context.Context, userID string, file multipart.File, header *multipart.FileHeader) (string, error) {
	// Validate file type
	contentType := header.Header.Get("Content-Type")
	if !isValidImageType(contentType) {
		ext := strings.ToLower(filepath.Ext(header.Filename))
		if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
			return "", ErrInvalidFileType
		}
	}

	// Validate file size (max 2MB for avatars)
	if header.Size > 2*1024*1024 {
		return "", ErrFileTooLarge
	}

	// Create avatars directory
	avatarDir := filepath.Join(s.uploadDir, "avatars")
	if err := os.MkdirAll(avatarDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create avatar directory: %w", err)
	}

	// Generate unique filename
	ext := filepath.Ext(header.Filename)
	filename := fmt.Sprintf("%s_%d%s", userID, time.Now().UnixNano(), ext)
	filePath := filepath.Join(avatarDir, filename)

	// Delete old avatar if exists
	oldProfile, _ := s.repo.GetProfile(ctx, userID)
	if oldProfile != nil && oldProfile.AvatarURL != nil {
		oldPath := filepath.Join(s.uploadDir, strings.TrimPrefix(*oldProfile.AvatarURL, "/uploads/"))
		if _, err := os.Stat(oldPath); err == nil {
			os.Remove(oldPath)
		}
	}

	// Create file
	dst, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()

	// Copy content
	if _, err := io.Copy(dst, file); err != nil {
		os.Remove(filePath)
		return "", fmt.Errorf("failed to save file: %w", err)
	}

	// Generate URL
	avatarURL := "/uploads/avatars/" + filename

	// Update database
	if err := s.repo.UpdateAvatar(ctx, userID, avatarURL); err != nil {
		os.Remove(filePath)
		return "", err
	}

	return avatarURL, nil
}

func (s *Service) RemoveAvatar(ctx context.Context, userID string) error {
	// Get current avatar URL
	profile, err := s.repo.GetProfile(ctx, userID)
	if err != nil {
		return err
	}

	// Delete file if exists
	if profile.AvatarURL != nil {
		filePath := filepath.Join(s.uploadDir, strings.TrimPrefix(*profile.AvatarURL, "/uploads/"))
		if _, err := os.Stat(filePath); err == nil {
			os.Remove(filePath)
		}
	}

	return s.repo.RemoveAvatar(ctx, userID)
}

func (s *Service) UpdateSettings(ctx context.Context, userID string, showEmail, showAvatar, showOnlineStatus *bool) (*Settings, error) {
	err := s.repo.UpdateSettings(ctx, userID, showEmail, showAvatar, showOnlineStatus)
	if err != nil {
		return nil, err
	}

	return s.repo.GetSettings(ctx, userID)
}

func (s *Service) GetPublicProfile(ctx context.Context, userID, viewerID string) (*PublicProfile, error) {
	return s.repo.GetPublicProfile(ctx, userID, viewerID)
}

func isValidImageType(contentType string) bool {
	validTypes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/webp": true,
	}
	return validTypes[contentType]
}
