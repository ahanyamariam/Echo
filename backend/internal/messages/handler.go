package messages

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/ahanyamariam/echo/internal/common"
	"github.com/ahanyamariam/echo/internal/conversations"
	"github.com/ahanyamariam/echo/internal/middleware"
)

type Broadcaster interface {
	BroadcastToUsers(userIDs []string, data interface{}) error
}

type Handler struct {
	service     *Service
	convService *conversations.Service
	hub         Broadcaster
}

func NewHandler(service *Service, convService *conversations.Service, hub Broadcaster) *Handler {
	return &Handler{
		service:     service,
		convService: convService,
		hub:         hub,
	}
}

type MessageResponse struct {
	ID             string  `json:"id"`
	ConversationID string  `json:"conversation_id"`
	SenderID       string  `json:"sender_id"`
	MessageType    string  `json:"message_type"`
	Text           *string `json:"text,omitempty"`
	MediaURL       *string `json:"media_url,omitempty"`
	CreatedAt      string  `json:"created_at"`
	ExpiresAt      *string `json:"expires_at,omitempty"`
	IsOneTime      bool    `json:"is_one_time"`
	ViewedAt       *string `json:"viewed_at,omitempty"`
}

type ListResponse struct {
	Messages []MessageResponse `json:"messages"`
	HasMore  bool              `json:"has_more"`
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		common.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	conversationID := r.URL.Query().Get("conversation_id")
	if conversationID == "" {
		common.Error(w, http.StatusBadRequest, "conversation_id is required")
		return
	}

	limit := 50
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	before := r.URL.Query().Get("before")

	messages, hasMore, err := h.service.List(r.Context(), conversationID, userID, limit, before)
	if err != nil {
		if err.Error() == "not a member" {
			common.Error(w, http.StatusForbidden, "Not a member of this conversation")
			return
		}
		common.Error(w, http.StatusInternalServerError, "Failed to list messages")
		return
	}

	response := make([]MessageResponse, 0, len(messages))
	for _, msg := range messages {
		mr := MessageResponse{
			ID:             msg.ID,
			ConversationID: msg.ConversationID,
			SenderID:       msg.SenderID,
			MessageType:    msg.MessageType,
			CreatedAt:      msg.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			IsOneTime:      msg.IsOneTime,
		}

		if msg.Text != nil {
			mr.Text = msg.Text
		}
		if msg.MediaURL != nil {
			mr.MediaURL = msg.MediaURL
		}
		if msg.ExpiresAt != nil {
			expiresAtStr := msg.ExpiresAt.Format("2006-01-02T15:04:05Z07:00")
			mr.ExpiresAt = &expiresAtStr
		}

		if msg.ViewedAt != nil {
			viewedAtStr := msg.ViewedAt.Format("2006-01-02T15:04:05Z07:00")
			mr.ViewedAt = &viewedAtStr
		}

		response = append(response, mr)
	}

	common.Success(w, http.StatusOK, ListResponse{
		Messages: response,
		HasMore:  hasMore,
	})
}

func (h *Handler) MarkAsViewed(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		common.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	messageID := chi.URLParam(r, "id")
	if messageID == "" {
		common.Error(w, http.StatusBadRequest, "message_id is required")
		return
	}

	if err := h.service.MarkAsViewed(r.Context(), messageID, userID); err != nil {
		if err.Error() == "not a member" {
			common.Error(w, http.StatusForbidden, "Not a member of this conversation")
			return
		}
		if err.Error() == "message not found or already viewed" {
			common.Error(w, http.StatusNotFound, "Message not found or already viewed")
			return
		}
		common.Error(w, http.StatusInternalServerError, "Failed to mark message as viewed")
		return
	}

	// Broadcast update via WebSocket
	msg, _ := h.service.GetByID(r.Context(), messageID)
	if msg != nil {
		memberIDs, _ := h.convService.GetMemberIDs(r.Context(), msg.ConversationID)
		if len(memberIDs) > 0 {
			var viewedAtStr *string
			if msg.ViewedAt != nil {
				formatted := msg.ViewedAt.Format("2006-01-02T15:04:05Z07:00")
				viewedAtStr = &formatted
			}

			update := map[string]interface{}{
				"type": "message_update",
				"message": map[string]interface{}{
					"id":              msg.ID,
					"conversation_id": msg.ConversationID,
					"is_one_time":     msg.IsOneTime,
					"viewed_at":       viewedAtStr,
				},
			}
			h.hub.BroadcastToUsers(memberIDs, update)
		}
	}

	common.Success(w, http.StatusOK, map[string]string{"status": "ok"})
}

type SearchResponse struct {
	Messages []MessageResponse `json:"messages"`
}

func (h *Handler) Search(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		common.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	query := r.URL.Query().Get("q")
	if query == "" {
		common.Error(w, http.StatusBadRequest, "q (search query) is required")
		return
	}

	limit := 20
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 50 {
			limit = parsed
		}
	}

	messages, err := h.service.Search(r.Context(), userID, query, limit)
	if err != nil {
		common.Error(w, http.StatusInternalServerError, "Failed to search messages")
		return
	}

	response := make([]MessageResponse, 0, len(messages))
	for _, msg := range messages {
		mr := MessageResponse{
			ID:             msg.ID,
			ConversationID: msg.ConversationID,
			SenderID:       msg.SenderID,
			MessageType:    msg.MessageType,
			CreatedAt:      msg.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			IsOneTime:      msg.IsOneTime,
		}

		if msg.Text != nil {
			mr.Text = msg.Text
		}
		if msg.MediaURL != nil {
			mr.MediaURL = msg.MediaURL
		}
		if msg.ExpiresAt != nil {
			expiresAtStr := msg.ExpiresAt.Format("2006-01-02T15:04:05Z07:00")
			mr.ExpiresAt = &expiresAtStr
		}
		if msg.ViewedAt != nil {
			viewedAtStr := msg.ViewedAt.Format("2006-01-02T15:04:05Z07:00")
			mr.ViewedAt = &viewedAtStr
		}

		response = append(response, mr)
	}

	common.Success(w, http.StatusOK, SearchResponse{
		Messages: response,
	})
}
