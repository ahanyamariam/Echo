package auth

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) CreateUser(ctx context.Context, username, email, passwordHash string) (*User, error) {
	var user User
	err := r.db.QueryRow(ctx,
		`INSERT INTO users (username, email, password_hash)
		 VALUES ($1, $2, $3)
		 RETURNING id, username, email, password_hash, display_name, avatar_url, created_at`,
		username, email, passwordHash,
	).Scan(&user.ID, &user.Username, &user.Email, &user.PasswordHash, &user.DisplayName, &user.AvatarURL, &user.CreatedAt)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *Repository) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	var user User
	err := r.db.QueryRow(ctx,
		`SELECT id, username, email, password_hash, display_name, avatar_url, created_at
		 FROM users WHERE email = $1`,
		email,
	).Scan(&user.ID, &user.Username, &user.Email, &user.PasswordHash, &user.DisplayName, &user.AvatarURL, &user.CreatedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	return &user, nil
}

func (r *Repository) GetUserByID(ctx context.Context, id string) (*User, error) {
	var user User
	err := r.db.QueryRow(ctx,
		`SELECT id, username, email, password_hash, display_name, avatar_url, created_at
		 FROM users WHERE id = $1`,
		id,
	).Scan(&user.ID, &user.Username, &user.Email, &user.PasswordHash, &user.DisplayName, &user.AvatarURL, &user.CreatedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	return &user, nil
}

func (r *Repository) UserExistsByEmailOrUsername(ctx context.Context, email, username string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM users WHERE email = $1 OR username = $2)`,
		email, username,
	).Scan(&exists)

	return exists, err
}
