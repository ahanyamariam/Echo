package messages

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Message represents a chat message
type Message struct {
	ID             string
	ConversationID string
	SenderID       string
	MessageType    string
	Text           *string
	MediaURL       *string
	CreatedAt      time.Time
	ExpiresAt      *time.Time
}

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// List returns messages for a conversation with pagination
func (r *Repository) List(ctx context.Context, conversationID string, limit int, before string) ([]*Message, bool, error) {
	var query string
	var args []interface{}

	if before == "" {
		query = `
			SELECT id, conversation_id, sender_id, message_type, text, media_url, created_at, expires_at
			FROM messages
			WHERE conversation_id = $1 AND (expires_at IS NULL OR expires_at > NOW())
			ORDER BY created_at DESC
			LIMIT $2
		`
		args = []interface{}{conversationID, limit + 1}
	} else {
		query = `
			SELECT id, conversation_id, sender_id, message_type, text, media_url, created_at, expires_at
			FROM messages
			WHERE conversation_id = $1 
			  AND (expires_at IS NULL OR expires_at > NOW())
			  AND created_at < (SELECT created_at FROM messages WHERE id = $2)
			ORDER BY created_at DESC
			LIMIT $3
		`
		args = []interface{}{conversationID, before, limit + 1}
	}

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, false, err
	}
	defer rows.Close()

	var messages []*Message
	for rows.Next() {
		var msg Message
		err := rows.Scan(
			&msg.ID,
			&msg.ConversationID,
			&msg.SenderID,
			&msg.MessageType,
			&msg.Text,
			&msg.MediaURL,
			&msg.CreatedAt,
			&msg.ExpiresAt,
		)
		if err != nil {
			return nil, false, err
		}
		messages = append(messages, &msg)
	}

	if err := rows.Err(); err != nil {
		return nil, false, err
	}

	hasMore := len(messages) > limit
	if hasMore {
		messages = messages[:limit]
	}

	// Reverse to get chronological order
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, hasMore, nil
}

// Create creates a new message
func (r *Repository) Create(ctx context.Context, conversationID, senderID, messageType string, text, mediaURL *string, expiresAt *time.Time) (*Message, error) {
	var msg Message
	err := r.db.QueryRow(ctx, `
		INSERT INTO messages (conversation_id, sender_id, message_type, text, media_url, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, conversation_id, sender_id, message_type, text, media_url, created_at, expires_at
	`, conversationID, senderID, messageType, text, mediaURL, expiresAt).Scan(
		&msg.ID,
		&msg.ConversationID,
		&msg.SenderID,
		&msg.MessageType,
		&msg.Text,
		&msg.MediaURL,
		&msg.CreatedAt,
		&msg.ExpiresAt,
	)
	if err != nil {
		return nil, err
	}
	return &msg, nil
}

// GetByID retrieves a message by ID
func (r *Repository) GetByID(ctx context.Context, id string) (*Message, error) {
	var msg Message
	err := r.db.QueryRow(ctx, `
		SELECT id, conversation_id, sender_id, message_type, text, media_url, created_at, expires_at
		FROM messages WHERE id = $1
	`, id).Scan(
		&msg.ID,
		&msg.ConversationID,
		&msg.SenderID,
		&msg.MessageType,
		&msg.Text,
		&msg.MediaURL,
		&msg.CreatedAt,
		&msg.ExpiresAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("message not found")
		}
		return nil, err
	}
	return &msg, nil
}

// DeleteExpiredMessages removes messages that have expired
func (r *Repository) DeleteExpiredMessages(ctx context.Context) (int64, error) {
	result, err := r.db.Exec(ctx, `
		DELETE FROM messages WHERE expires_at IS NOT NULL AND expires_at <= NOW()
	`)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected(), nil
}
