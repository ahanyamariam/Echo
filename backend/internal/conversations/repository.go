package conversations

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

type ConversationWithDetails struct {
	ID                  string
	Type                string
	CreatedAt           time.Time
	OtherUserID         string
	OtherUsername       string
	LastMessageID       *string
	LastMessageType     *string
	LastMessageText     *string
	LastMessageSenderID *string
	LastMessageAt       *time.Time
	UnreadCount         int
}

func (r *Repository) ListForUser(ctx context.Context, userID string) ([]*ConversationWithDetails, error) {
	query := `
		WITH user_conversations AS (
			SELECT c.id, c.type, c.created_at
			FROM conversations c
			JOIN conversation_members cm ON c.id = cm.conversation_id
			WHERE cm.user_id = $1 AND c.type = 'dm'
		),
		other_users AS (
			SELECT uc.id as conversation_id, u.id as user_id, u.username
			FROM user_conversations uc
			JOIN conversation_members cm ON uc.id = cm.conversation_id
			JOIN users u ON cm.user_id = u.id
			WHERE cm.user_id != $1
		),
		last_messages AS (
			SELECT DISTINCT ON (m.conversation_id)
				m.conversation_id,
				m.id,
				m.message_type,
				m.text,
				m.sender_id,
				m.created_at
			FROM messages m
			JOIN user_conversations uc ON m.conversation_id = uc.id
			ORDER BY m.conversation_id, m.created_at DESC
		),
		unread_counts AS (
			SELECT 
				m.conversation_id,
				COUNT(*)::int as unread_count
			FROM messages m
			JOIN user_conversations uc ON m.conversation_id = uc.id
			LEFT JOIN conversation_reads cr ON cr.conversation_id = m.conversation_id AND cr.user_id = $1
			WHERE m.sender_id != $1
			AND (
				cr.last_read_message_id IS NULL
				OR m.created_at > (
					SELECT created_at FROM messages WHERE id = cr.last_read_message_id
				)
			)
			GROUP BY m.conversation_id
		)
		SELECT 
			uc.id,
			uc.type,
			uc.created_at,
			ou.user_id,
			ou.username,
			lm.id,
			lm.message_type,
			lm.text,
			lm.sender_id,
			lm.created_at,
			COALESCE(urc.unread_count, 0)
		FROM user_conversations uc
		JOIN other_users ou ON uc.id = ou.conversation_id
		LEFT JOIN last_messages lm ON uc.id = lm.conversation_id
		LEFT JOIN unread_counts urc ON uc.id = urc.conversation_id
		ORDER BY COALESCE(lm.created_at, uc.created_at) DESC
	`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var conversations []*ConversationWithDetails
	for rows.Next() {
		var conv ConversationWithDetails
		err := rows.Scan(
			&conv.ID,
			&conv.Type,
			&conv.CreatedAt,
			&conv.OtherUserID,
			&conv.OtherUsername,
			&conv.LastMessageID,
			&conv.LastMessageType,
			&conv.LastMessageText,
			&conv.LastMessageSenderID,
			&conv.LastMessageAt,
			&conv.UnreadCount,
		)
		if err != nil {
			return nil, err
		}
		conversations = append(conversations, &conv)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return conversations, nil
}

func (r *Repository) FindDMBetweenUsers(ctx context.Context, userID1, userID2 string) (*ConversationWithDetails, error) {
	query := `
		SELECT c.id, c.type, c.created_at, u.id, u.username
		FROM conversations c
		JOIN conversation_members cm1 ON c.id = cm1.conversation_id AND cm1.user_id = $1
		JOIN conversation_members cm2 ON c.id = cm2.conversation_id AND cm2.user_id = $2
		JOIN users u ON u.id = $2
		WHERE c.type = 'dm'
		LIMIT 1
	`

	var conv ConversationWithDetails
	err := r.db.QueryRow(ctx, query, userID1, userID2).Scan(
		&conv.ID,
		&conv.Type,
		&conv.CreatedAt,
		&conv.OtherUserID,
		&conv.OtherUsername,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return &conv, nil
}

func (r *Repository) CreateDM(ctx context.Context, userID, otherUserID string) (*ConversationWithDetails, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// Verify other user exists
	var otherUsername string
	err = tx.QueryRow(ctx, "SELECT username FROM users WHERE id = $1", otherUserID).Scan(&otherUsername)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	// Create conversation
	var conv ConversationWithDetails
	err = tx.QueryRow(ctx, `
		INSERT INTO conversations (type) VALUES ('dm')
		RETURNING id, type, created_at
	`).Scan(&conv.ID, &conv.Type, &conv.CreatedAt)
	if err != nil {
		return nil, err
	}

	// Add members
	_, err = tx.Exec(ctx, `
		INSERT INTO conversation_members (conversation_id, user_id)
		VALUES ($1, $2), ($1, $3)
	`, conv.ID, userID, otherUserID)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	conv.OtherUserID = otherUserID
	conv.OtherUsername = otherUsername

	return &conv, nil
}

func (r *Repository) IsMember(ctx context.Context, conversationID, userID string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM conversation_members
			WHERE conversation_id = $1 AND user_id = $2
		)
	`, conversationID, userID).Scan(&exists)
	return exists, err
}

func (r *Repository) GetMemberIDs(ctx context.Context, conversationID string) ([]string, error) {
	rows, err := r.db.Query(ctx, `
		SELECT user_id FROM conversation_members WHERE conversation_id = $1
	`, conversationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}

	return ids, rows.Err()
}

func (r *Repository) GetByID(ctx context.Context, conversationID string) (*ConversationWithDetails, error) {
	var conv ConversationWithDetails
	err := r.db.QueryRow(ctx, `
		SELECT id, type, created_at FROM conversations WHERE id = $1
	`, conversationID).Scan(&conv.ID, &conv.Type, &conv.CreatedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("conversation not found")
		}
		return nil, err
	}

	return &conv, nil
}