package realtime

import (
	"encoding/json"
	"log"
	"sync"
)

// Hub maintains the set of active clients and broadcasts messages
type Hub struct {
	// Registered clients mapped by user ID
	clients map[string]*Client

	// Inbound messages from clients to broadcast
	broadcast chan *BroadcastMessage

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Mutex for thread-safe access to clients map
	mu sync.RWMutex
}

// BroadcastMessage represents a message to be sent to specific users
type BroadcastMessage struct {
	UserIDs []string
	Data    []byte
}

// NewHub creates a new Hub instance
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]*Client),
		broadcast:  make(chan *BroadcastMessage, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// Run starts the hub's main loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			// Close existing connection if user reconnects
			if existingClient, ok := h.clients[client.UserID]; ok {
				close(existingClient.send)
				delete(h.clients, client.UserID)
			}
			h.clients[client.UserID] = client
			h.mu.Unlock()
			log.Printf("Client registered: %s (%s)", client.Username, client.UserID)

		case client := <-h.unregister:
			h.mu.Lock()
			if existingClient, ok := h.clients[client.UserID]; ok {
				if existingClient == client {
					delete(h.clients, client.UserID)
					close(client.send)
					log.Printf("Client unregistered: %s (%s)", client.Username, client.UserID)
				}
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			h.mu.RLock()
			for _, userID := range message.UserIDs {
				if client, ok := h.clients[userID]; ok {
					select {
					case client.send <- message.Data:
					default:
						// Client's send buffer is full, skip
						log.Printf("Client %s send buffer full, skipping message", userID)
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
	_, ok := h.clients[userID]
	return ok
}

// GetOnlineUsers returns a list of online user IDs from the given list
func (h *Hub) GetOnlineUsers(userIDs []string) []string {
	h.mu.RLock()
	defer h.mu.RUnlock()

	online := make([]string, 0)
	for _, userID := range userIDs {
		if _, ok := h.clients[userID]; ok {
			online = append(online, userID)
		}
	}
	return online
}