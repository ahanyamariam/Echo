package realtime

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"github.com/ahanyamariam/echo/internal/auth"
	"github.com/ahanyamariam/echo/internal/conversations"
	"github.com/ahanyamariam/echo/internal/messages"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// In production, check against allowed origins
		return true
	},
}

// Handler handles WebSocket connections
type Handler struct {
	hub         *Hub
	authService *auth.Service
	msgService  *messages.Service
	convService *conversations.Service
}

// NewHandler creates a new WebSocket handler
func NewHandler(hub *Hub, authService *auth.Service, msgService *messages.Service, convService *conversations.Service) *Handler {
	return &Handler{
		hub:         hub,
		authService: authService,
		msgService:  msgService,
		convService: convService,
	}
}

// WebSocket message types
type WSMessage struct {
	Type string `json:"type"`
}

type WSMessageSend struct {
	Type           string `json:"type"`
	ConversationID string `json:"conversation_id"`
	MessageType    string `json:"message_type"`
	Text           string `json:"text,omitempty"`
	MediaURL       string `json:"media_url,omitempty"`
}

type WSMessageNew struct {
	Type    string          `json:"type"`
	Message *MessagePayload `json:"message"`
}

type MessagePayload struct {
	ID             string  `json:"id"`
	ConversationID string  `json:"conversation_id"`
	SenderID       string  `json:"sender_id"`
	MessageType    string  `json:"message_type"`
	Text           *string `json:"text,omitempty"`
	MediaURL       *string `json:"media_url,omitempty"`
	CreatedAt      string  `json:"created_at"`
}

type WSError struct {
	Type  string `json:"type"`
	Error string `json:"error"`
}

type WSReadUpdate struct {
	Type              string `json:"type"`
	ConversationID    string `json:"conversation_id"`
	UserID            string `json:"user_id,omitempty"`
	LastReadMessageID string `json:"last_read_message_id"`
}

// HandleWebSocket handles WebSocket upgrade and connection
func (h *Handler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Get token from query parameter
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Validate token
	claims, err := h.authService.ValidateToken(token)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	// Create client
	client := NewClient(h.hub, conn, claims.UserID, claims.Username, h.handleMessage)

	// Register client
	h.hub.register <- client

	// Start read/write pumps
	go client.WritePump()
	go client.ReadPump()
}

// handleMessage processes incoming WebSocket messages
func (h *Handler) handleMessage(client *Client, data []byte) {
	var baseMsg WSMessage
	if err := json.Unmarshal(data, &baseMsg); err != nil {
		h.sendError(client, "Invalid message format")
		return
	}

	switch baseMsg.Type {
	case "message_send":
		h.handleMessageSend(client, data)
	case "read_update":
		h.handleReadUpdate(client, data)
	default:
		h.sendError(client, "Unknown message type")
	}
}

// handleMessageSend handles sending a new message
func (h *Handler) handleMessageSend(client *Client, data []byte) {
	var msg WSMessageSend
	if err := json.Unmarshal(data, &msg); err != nil {
		h.sendError(client, "Invalid message format")
		return
	}

	// Validate message
	if msg.ConversationID == "" {
		h.sendError(client, "conversation_id is required")
		return
	}

	if msg.MessageType != "text" && msg.MessageType != "image" {
		h.sendError(client, "message_type must be 'text' or 'image'")
		return
	}

	if msg.MessageType == "text" && msg.Text == "" {
		h.sendError(client, "text is required for text messages")
		return
	}

	if msg.MessageType == "image" && msg.MediaURL == "" {
		h.sendError(client, "media_url is required for image messages")
		return
	}

	// Prepare text and media_url pointers
	var textPtr, mediaURLPtr *string
	if msg.MessageType == "text" {
		textPtr = &msg.Text
	} else {
		mediaURLPtr = &msg.MediaURL
	}

	// Create message in database
	ctx := context.Background()
	message, err := h.msgService.Create(ctx, msg.ConversationID, client.UserID, msg.MessageType, textPtr, mediaURLPtr)
	if err != nil {
		if err.Error() == "not a member" {
			h.sendError(client, "Not a member of this conversation")
		} else {
			log.Printf("Failed to create message: %v", err)
			h.sendError(client, "Failed to send message")
		}
		return
	}

	// Get conversation members
	memberIDs, err := h.convService.GetMemberIDs(ctx, msg.ConversationID)
	if err != nil {
		log.Printf("Failed to get conversation members: %v", err)
		return
	}

	// Build response
	response := WSMessageNew{
		Type: "message_new",
		Message: &MessagePayload{
			ID:             message.ID,
			ConversationID: message.ConversationID,
			SenderID:       message.SenderID,
			MessageType:    message.MessageType,
			Text:           message.Text,
			MediaURL:       message.MediaURL,
			CreatedAt:      message.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		},
	}

	// Broadcast to all members (including sender for confirmation)
	if err := h.hub.BroadcastToUsers(memberIDs, response); err != nil {
		log.Printf("Failed to broadcast message: %v", err)
	}
}

// handleReadUpdate handles read receipt updates
func (h *Handler) handleReadUpdate(client *Client, data []byte) {
	var msg WSReadUpdate
	if err := json.Unmarshal(data, &msg); err != nil {
		h.sendError(client, "Invalid message format")
		return
	}

	if msg.ConversationID == "" || msg.LastReadMessageID == "" {
		h.sendError(client, "conversation_id and last_read_message_id are required")
		return
	}

	// Verify membership
	ctx := context.Background()
	isMember, err := h.convService.IsMember(ctx, msg.ConversationID, client.UserID)
	if err != nil || !isMember {
		h.sendError(client, "Not a member of this conversation")
		return
	}

	// Get conversation members to broadcast
	memberIDs, err := h.convService.GetMemberIDs(ctx, msg.ConversationID)
	if err != nil {
		log.Printf("Failed to get conversation members: %v", err)
		return
	}

	// Broadcast read update to other members
	response := WSReadUpdate{
		Type:              "read_update",
		ConversationID:    msg.ConversationID,
		UserID:            client.UserID,
		LastReadMessageID: msg.LastReadMessageID,
	}

	// Only send to other members (not the sender)
	for _, memberID := range memberIDs {
		if memberID != client.UserID {
			if err := h.hub.BroadcastToUsers([]string{memberID}, response); err != nil {
				log.Printf("Failed to broadcast read update: %v", err)
			}
		}
	}
}

// sendError sends an error message to the client
func (h *Handler) sendError(client *Client, message string) {
	client.SendJSON(WSError{
		Type:  "error",
		Error: message,
	})
}
