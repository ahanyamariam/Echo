package messages

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

type Message struct {
	ID             string
	ConversationID string
	SenderID       string
	MessageType    string
	Text           *string
	MediaURL       *string
	CreatedAt      time.Time
}

func (r *Repository) List(ctx context.Context, conversationID string, limit int, before string) ([]*Message, bool, error) {
	var args []interface{}
	args = append(args, conversationID)

	query := `
		SELECT id, conversation_id, sender_id, message_type, text, media_url, created_at
		FROM messages
		WHERE conversation_id = $1
	`

	if before != "" {
		query += ` AND created_at < (SELECT created_at FROM messages WHERE id = $2)`
		args = append(args, before)
	}

	query += ` ORDER BY created_at DESC LIMIT $` + string(rune('0'+len(args)+1))
	args = append(args, limit+1)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, false, err
	}
	defer rows.Close()

	var messages []*Message
	for rows.Next() {
		var msg Message
		if err := rows.Scan(
			&msg.ID,
			&msg.ConversationID,
			&msg.SenderID,
			&msg.MessageType,
			&msg.Text,
			&msg.MediaURL,
			&msg.CreatedAt,
		); err != nil {
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

	// Reverse to get chronological order (oldest first)
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, hasMore, nil
}

func (r *Repository) Create(ctx context.Context, conversationID, senderID, messageType string, text, mediaURL *string) (*Message, error) {
	var msg Message

	err := r.db.QueryRow(ctx, `
		INSERT INTO messages (conversation_id, sender_id, message_type, text, media_url)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, conversation_id, sender_id, message_type, text, media_url, created_at
	`, conversationID, senderID, messageType, text, mediaURL).Scan(
		&msg.ID,
		&msg.ConversationID,
		&msg.SenderID,
		&msg.MessageType,
		&msg.Text,
		&msg.MediaURL,
		&msg.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &msg, nil
}

func (r *Repository) GetByID(ctx context.Context, id string) (*Message, error) {
	var msg Message

	err := r.db.QueryRow(ctx, `
		SELECT id, conversation_id, sender_id, message_type, text, media_url, created_at
		FROM messages WHERE id = $1
	`, id).Scan(
		&msg.ID,
		&msg.ConversationID,
		&msg.SenderID,
		&msg.MessageType,
		&msg.Text,
		&msg.MediaURL,
		&msg.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &msg, nil
}