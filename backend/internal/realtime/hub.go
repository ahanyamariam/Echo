package realtime

import (
	"encoding/json"
	"log"
	"sync"
	"time"
) 

// Hub maintains the set of active clients and broadcasts messages
type Hub struct {
	// Registered clients mapped by user ID, then by client pointer for uniqueness
	clients map[string]map[*Client]bool

	// Inbound messages from clients to broadcast
	broadcast chan *BroadcastMessage

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Mutex for thread-safe access to clients map
	mu sync.RWMutex

	// Typing indicator timers keyed by "userID:conversationID"
	typingTimers map[string]*time.Timer
	typingMu     sync.Mutex
}

// BroadcastMessage represents a message to be sent to specific users
type BroadcastMessage struct {
	UserIDs []string
	Data    []byte
}

// NewHub creates a new Hub instance
func NewHub() *Hub {
	return &Hub{
		clients:      make(map[string]map[*Client]bool),
		broadcast:    make(chan *BroadcastMessage, 256),
		register:     make(chan *Client),
		unregister:   make(chan *Client),
		typingTimers: make(map[string]*time.Timer),
	}
}

// Run starts the hub's main loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if _, ok := h.clients[client.UserID]; !ok {
				h.clients[client.UserID] = make(map[*Client]bool)
			}
			h.clients[client.UserID][client] = true
			h.mu.Unlock()

			log.Printf("Client registered: %s (%s). Total connections for user: %d",
				client.Username, client.UserID, len(h.clients[client.UserID]))

		case client := <-h.unregister:
			h.mu.Lock()
			if userClients, ok := h.clients[client.UserID]; ok {
				if _, exists := userClients[client]; exists {
					delete(userClients, client)
					close(client.send)
					if len(userClients) == 0 {
						delete(h.clients, client.UserID)
					}

					log.Printf("Client unregistered: %s (%s). Remaining connections: %d",
						client.Username, client.UserID, len(userClients))
				}
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			h.mu.RLock()
			for _, userID := range message.UserIDs {
				if userClients, ok := h.clients[userID]; ok {
					for client := range userClients {
						select {
						case client.send <- message.Data:
						default:
							// Client's send buffer is full, handle if needed
							log.Printf("Client %s send buffer full, skipping message", userID)
						}
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

// BroadcastToUsers sends a message to specific users
func (h *Hub) BroadcastToUsers(userIDs []string, data interface{}) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	h.broadcast <- &BroadcastMessage{
		UserIDs: userIDs,
		Data:    jsonData,
	}

	return nil
}

// IsUserOnline checks if a user is currently connected
func (h *Hub) IsUserOnline(userID string) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	userClients, ok := h.clients[userID]
	return ok && len(userClients) > 0
}

// GetOnlineUsers returns a list of online user IDs from the given list
func (h *Hub) GetOnlineUsers(userIDs []string) []string {
	h.mu.RLock()
	defer h.mu.RUnlock()

	online := make([]string, 0)
	for _, userID := range userIDs {
		if userClients, ok := h.clients[userID]; ok && len(userClients) > 0 {
			online = append(online, userID)
		}
	}
	return online
}

// SetTyping manages typing indicator state with automatic timeout.
// Uses time.AfterFunc to broadcast typing_stop after 3 seconds of inactivity.
func (h *Hub) SetTyping(userID, username, conversationID string, memberIDs []string) {
	key := userID + ":" + conversationID

	// Build the list of other members to notify
	otherMembers := make([]string, 0, len(memberIDs)-1)
	for _, id := range memberIDs {
		if id != userID {
			otherMembers = append(otherMembers, id)
		}
	}
	if len(otherMembers) == 0 {
		return
	}

	h.typingMu.Lock()
	defer h.typingMu.Unlock()

	if timer, exists := h.typingTimers[key]; exists {
		// User is already typing — reset the timer
		timer.Reset(3 * time.Second)
		return
	}

	// New typing session — broadcast typing_start
	startMsg := map[string]string{
		"type":            "typing_start",
		"conversation_id": conversationID,
		"user_id":         userID,
		"username":        username,
	}
	if err := h.BroadcastToUsers(otherMembers, startMsg); err != nil {
		log.Printf("Failed to broadcast typing_start: %v", err)
	}

	// Set a 3-second timer — when it fires, broadcast typing_stop
	h.typingTimers[key] = time.AfterFunc(3*time.Second, func() {
		stopMsg := map[string]string{
			"type":            "typing_stop",
			"conversation_id": conversationID,
			"user_id":         userID,
			"username":        username,
		}
		if err := h.BroadcastToUsers(otherMembers, stopMsg); err != nil {
			log.Printf("Failed to broadcast typing_stop: %v", err)
		}

		h.typingMu.Lock()
		delete(h.typingTimers, key)
		h.typingMu.Unlock()
	})
}

// StopTyping immediately stops typing indicator for a user (e.g., on disconnect).
func (h *Hub) StopTyping(userID, conversationID string) {
	key := userID + ":" + conversationID

	h.typingMu.Lock()
	defer h.typingMu.Unlock()

	if timer, exists := h.typingTimers[key]; exists {
		timer.Stop()
		delete(h.typingTimers, key)
	}
}
