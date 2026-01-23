package messages

import (
	"net/http"
	"strconv"

	"github.com/ahanyamariam/echo/internal/common"
	"github.com/ahanyamariam/echo/internal/middleware"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
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

		response = append(response, mr)
	}

	common.Success(w, http.StatusOK, ListResponse{
		Messages: response,
		HasMore:  hasMore,
	})
}