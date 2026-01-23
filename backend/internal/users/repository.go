package users

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

func (r *Repository) GetByID(ctx context.Context, id string) (*User, error) {
	var user User
	err := r.db.QueryRow(ctx,
		`SELECT id, username, email, created_at
		 FROM users WHERE id = $1`,
		id,
	).Scan(&user.ID, &user.Username, &user.Email, &user.CreatedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	return &user, nil
}

func (r *Repository) Search(ctx context.Context, query string, excludeUserID string, limit int) ([]*User, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, username, email, created_at
		 FROM users
		 WHERE id != $1
		 AND username ILIKE $2
		 ORDER BY 
		   CASE WHEN username ILIKE $3 THEN 0 ELSE 1 END,
		   username
		 LIMIT $4`,
		excludeUserID,
		"%"+query+"%",
		query+"%",
		limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*User
	for rows.Next() {
		var user User
		if err := rows.Scan(&user.ID, &user.Username, &user.Email, &user.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, &user)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}