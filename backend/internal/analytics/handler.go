package analytics

import (
	"net/http"

	"github.com/ahanyamariam/echo/internal/common"
	"github.com/ahanyamariam/echo/internal/middleware"
	"github.com/go-chi/chi/v5"
)

// Handler exposes HTTP endpoints for conversation analytics.
type Handler struct {
	service *Service
}

// NewHandler creates a new analytics handler.
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// GetConversationAnalytics handles GET /analytics/conversations/{id}
// Returns statistical analysis of a conversation's messaging patterns including:
//   - Message counts by type and user
//   - Average and standard deviation of message lengths
//   - Top word frequencies (with stop-word filtering)
//   - Hourly activity distribution as percentages
func (h *Handler) GetConversationAnalytics(w http.ResponseWriter, r *http.Request) {
	conversationID := chi.URLParam(r, "id")
	if conversationID == "" {
		common.Error(w, http.StatusBadRequest, "conversation id is required")
		return
	}

	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		common.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	analytics, err := h.service.GetConversationAnalytics(r.Context(), conversationID, userID)
	if err != nil {
		if err == ErrNotMember {
			common.Error(w, http.StatusForbidden, "not a member of this conversation")
			return
		}
		common.Error(w, http.StatusInternalServerError, "failed to compute analytics")
		return
	}

	common.Success(w, http.StatusOK, analytics)
}
