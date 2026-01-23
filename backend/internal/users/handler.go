package users

import (
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

type UserResponse struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email,omitempty"`
}

type SearchResponse struct {
	Users []UserResponse `json:"users"`
}

func (h *Handler) GetMe(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		common.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	user, err := h.service.GetByID(r.Context(), userID)
	if err != nil {
		common.Error(w, http.StatusNotFound, "User not found")
		return
	}

	common.Success(w, http.StatusOK, UserResponse{
		ID:       user.ID,
		Username: user.Username,
		Email:    user.Email,
	})
}

func (h *Handler) Search(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		common.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	query := r.URL.Query().Get("q")
	if query == "" {
		common.Success(w, http.StatusOK, SearchResponse{Users: []UserResponse{}})
		return
	}

	if len(query) < 2 {
		common.Success(w, http.StatusOK, SearchResponse{Users: []UserResponse{}})
		return
	}

	users, err := h.service.Search(r.Context(), query, userID)
	if err != nil {
		common.Error(w, http.StatusInternalServerError, "Failed to search users")
		return
	}

	response := make([]UserResponse, len(users))
	for i, user := range users {
		response[i] = UserResponse{
			ID:       user.ID,
			Username: user.Username,
		}
	}

	common.Success(w, http.StatusOK, SearchResponse{Users: response})
}
