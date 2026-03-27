package analytics

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// RawMessage holds the raw data needed for analytics computation.
type RawMessage struct {
	SenderID    string
	MessageType string
	Text        *string
	CreatedAt   time.Time
}

// TypeCount holds the count of messages by type.
type TypeCount struct {
	MessageType string
	Count       int
}

// UserCount holds the count of messages per user.
type UserCount struct {
	UserID string
	Count  int
}

// Repository handles database queries for analytics data aggregation.
type Repository struct {
	db *pgxpool.Pool
}

// NewRepository creates a new analytics repository.
func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// GetMessagesByConversation retrieves all messages for a conversation
// to perform in-memory analytics (word frequency, length stats).
func (r *Repository) GetMessagesByConversation(ctx context.Context, conversationID string) ([]RawMessage, error) {
	rows, err := r.db.Query(ctx, `
		SELECT sender_id, message_type, text, created_at
		FROM messages
		WHERE conversation_id = $1
		ORDER BY created_at ASC
	`, conversationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []RawMessage
	for rows.Next() {
		var msg RawMessage
		if err := rows.Scan(&msg.SenderID, &msg.MessageType, &msg.Text, &msg.CreatedAt); err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}
	return messages, rows.Err()
}

// GetMessageCountsByType returns counters grouped by message_type.
func (r *Repository) GetMessageCountsByType(ctx context.Context, conversationID string) ([]TypeCount, error) {
	rows, err := r.db.Query(ctx, `
		SELECT message_type, COUNT(*) as count
		FROM messages
		WHERE conversation_id = $1
		GROUP BY message_type
	`, conversationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var counts []TypeCount
	for rows.Next() {
		var tc TypeCount
		if err := rows.Scan(&tc.MessageType, &tc.Count); err != nil {
			return nil, err
		}
		counts = append(counts, tc)
	}
	return counts, rows.Err()
}

// GetMessageCountsByUser returns counters grouped by sender_id.
func (r *Repository) GetMessageCountsByUser(ctx context.Context, conversationID string) ([]UserCount, error) {
	rows, err := r.db.Query(ctx, `
		SELECT sender_id, COUNT(*) as count
		FROM messages
		WHERE conversation_id = $1
		GROUP BY sender_id
	`, conversationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var counts []UserCount
	for rows.Next() {
		var uc UserCount
		if err := rows.Scan(&uc.UserID, &uc.Count); err != nil {
			return nil, err
		}
		counts = append(counts, uc)
	}
	return counts, rows.Err()
}
