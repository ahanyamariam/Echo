package profile

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetProfile(ctx context.Context, userID string) (*Profile, error) {
	query := `
		SELECT id, username, email, display_name, avatar_url, bio, created_at, updated_at
		FROM users
		WHERE id = $1
	`

	var profile Profile
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&profile.ID,
		&profile.Username,
		&profile.Email,
		&profile.DisplayName,
		&profile.AvatarURL,
		&profile.Bio,
		&profile.CreatedAt,
		&profile.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &profile, nil
}

func (r *Repository) UpdateProfile(ctx context.Context, userID string, displayName, bio *string) error {
	query := `
		UPDATE users
		SET display_name = COALESCE($2, display_name),
		    bio = COALESCE($3, bio),
		    updated_at = NOW()
		WHERE id = $1
	`

	_, err := r.db.Exec(ctx, query, userID, displayName, bio)
	return err
}

func (r *Repository) UpdateAvatar(ctx context.Context, userID string, avatarURL string) error {
	query := `
		UPDATE users
		SET avatar_url = $2, updated_at = NOW()
		WHERE id = $1
	`

	_, err := r.db.Exec(ctx, query, userID, avatarURL)
	return err
}

func (r *Repository) RemoveAvatar(ctx context.Context, userID string) error {
	query := `
		UPDATE users
		SET avatar_url = NULL, updated_at = NOW()
		WHERE id = $1
	`

	_, err := r.db.Exec(ctx, query, userID)
	return err
}

func (r *Repository) GetSettings(ctx context.Context, userID string) (*Settings, error) {
	query := `
		SELECT user_id, show_email, show_avatar, show_online_status, created_at, updated_at
		FROM user_settings
		WHERE user_id = $1
	`

	var settings Settings
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&settings.UserID,
		&settings.ShowEmail,
		&settings.ShowAvatar,
		&settings.ShowOnlineStatus,
		&settings.CreatedAt,
		&settings.UpdatedAt,
	)

	return &settings, err
}

func (r *Repository) CreateDefaultSettings(ctx context.Context, userID string) (*Settings, error) {
	query := `
		INSERT INTO user_settings (user_id, show_email, show_avatar, show_online_status)
		VALUES ($1, false, true, true)
		ON CONFLICT (user_id) DO NOTHING
	`
	_, err := r.db.Exec(ctx, query, userID)
	if err != nil {
		return nil, err
	}

	return r.GetSettings(ctx, userID)
}

func (r *Repository) UpdateSettings(ctx context.Context, userID string, showEmail, showAvatar, showOnlineStatus *bool) error {
	// First ensure settings exist
	_, err := r.GetSettings(ctx, userID)
	if err != nil {
		_, err = r.CreateDefaultSettings(ctx, userID)
		if err != nil {
			return err
		}
	}

	query := `
		UPDATE user_settings
		SET show_email = COALESCE($2, show_email),
		    show_avatar = COALESCE($3, show_avatar),
		    show_online_status = COALESCE($4, show_online_status),
		    updated_at = NOW()
		WHERE user_id = $1
	`

	_, err = r.db.Exec(ctx, query, userID, showEmail, showAvatar, showOnlineStatus)
	return err
}

func (r *Repository) GetPublicProfile(ctx context.Context, userID, viewerID string) (*PublicProfile, error) {
	// Get the target user's profile and settings
	query := `
		SELECT 
			u.id, 
			u.username, 
			u.display_name, 
			CASE WHEN COALESCE(s.show_avatar, true) THEN u.avatar_url ELSE NULL END as avatar_url,
			u.bio
		FROM users u
		LEFT JOIN user_settings s ON u.id = s.user_id
		WHERE u.id = $1
	`

	var profile PublicProfile
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&profile.ID,
		&profile.Username,
		&profile.DisplayName,
		&profile.AvatarURL,
		&profile.Bio,
	)

	if err != nil {
		return nil, err
	}

	return &profile, nil
}
