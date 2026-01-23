package conversations

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/ahanyamariam/echo/internal/common"
	"github.com/ahanyamariam/echo/internal/middleware"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

type CreateRequest struct {
	OtherUserID string `json:"other_user_id"`
}

type OtherUserResponse struct {
	ID       string `json:"id"`
	Username string `json:"username"`
}

type LastMessageResponse struct {
	ID          string `json:"id"`
	MessageType string `json:"message_type"`
	Text        string `json:"text,omitempty"`
	SenderID    string `json:"sender_id"`
	CreatedAt   string `json:"created_at"`
}

type ConversationResponse struct {
	ID          string               `json:"id"`
	Type        string               `json:"type"`
	CreatedAt   string               `json:"created_at"`
	OtherUser   OtherUserResponse    `json:"other_user"`
	LastMessage *LastMessageResponse `json:"last_message,omitempty"`
	UnreadCount int                  `json:"unread_count"`
}

type ListResponse struct {
	Conversations []ConversationResponse `json:"conversations"`
}

type CreateResponse struct {
	Conversation ConversationResponse `json:"conversation"`
	Created      bool                 `json:"created"`
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		common.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	conversations, err := h.service.ListForUser(r.Context(), userID)
	if err != nil {
		common.Error(w, http.StatusInternalServerError, "Failed to list conversations")
		return
	}

	response := make([]ConversationResponse, 0, len(conversations))
	for _, conv := range conversations {
		cr := ConversationResponse{
			ID:        conv.ID,
			Type:      conv.Type,
			CreatedAt: conv.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			OtherUser: OtherUserResponse{
				ID:       conv.OtherUserID,
				Username: conv.OtherUsername,
			},
			UnreadCount: conv.UnreadCount,
		}

		if conv.LastMessageID != nil {
			cr.LastMessage = &LastMessageResponse{
				ID:          *conv.LastMessageID,
				MessageType: *conv.LastMessageType,
				SenderID:    *conv.LastMessageSenderID,
				CreatedAt:   conv.LastMessageAt.Format("2006-01-02T15:04:05Z07:00"),
			}
			if conv.LastMessageText != nil {
				cr.LastMessage.Text = *conv.LastMessageText
			}
		}

		response = append(response, cr)
	}

	common.Success(w, http.StatusOK, ListResponse{Conversations: response})
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		common.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		common.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.OtherUserID == "" {
		common.Error(w, http.StatusBadRequest, "other_user_id is required")
		return
	}

	if req.OtherUserID == userID {
		common.Error(w, http.StatusBadRequest, "Cannot create conversation with yourself")
		return
	}

	conv, created, err := h.service.CreateOrGetDM(r.Context(), userID, req.OtherUserID)
	if err != nil {
		if err.Error() == "user not found" {
			common.Error(w, http.StatusNotFound, "User not found")
			return
		}
		log.Printf("Failed to create conversation: %v", err)
		common.Error(w, http.StatusInternalServerError, "Failed to create conversation")
		return
	}

	status := http.StatusOK
	if created {
		status = http.StatusCreated
	}

	common.Success(w, status, CreateResponse{
		Conversation: ConversationResponse{
			ID:        conv.ID,
			Type:      conv.Type,
			CreatedAt: conv.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			OtherUser: OtherUserResponse{
				ID:       conv.OtherUserID,
				Username: conv.OtherUsername,
			},
			UnreadCount: 0,
		},
		Created: created,
	})
}
