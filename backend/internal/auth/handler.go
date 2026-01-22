package auth

import (
	"encoding/json"
	"net/http"

	"github.com/ahanyamariam/echo/internal/common"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

type SignupRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	User  *UserResponse `json:"user"`
	Token string        `json:"token"`
}

type UserResponse struct {
	ID        string `json:"id"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	CreatedAt string `json:"created_at"`
}

func (h *Handler) Signup(w http.ResponseWriter, r *http.Request) {
	var req SignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		common.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Username == "" || req.Email == "" || req.Password == "" {
		common.Error(w, http.StatusBadRequest, "Username, email, and password are required")
		return
	}

	if len(req.Username) < 3 || len(req.Username) > 50 {
		common.Error(w, http.StatusBadRequest, "Username must be between 3 and 50 characters")
		return
	}

	if len(req.Password) < 6 {
		common.Error(w, http.StatusBadRequest, "Password must be at least 6 characters")
		return
	}

	user, token, err := h.service.Signup(r.Context(), req.Username, req.Email, req.Password)
	if err != nil {
		switch err {
		case ErrUserExists:
			common.Error(w, http.StatusConflict, "User with this email or username already exists")
		default:
			common.Error(w, http.StatusInternalServerError, "Failed to create user")
		}
		return
	}

	common.Success(w, http.StatusCreated, AuthResponse{
		User: &UserResponse{
			ID:        user.ID,
			Username:  user.Username,
			Email:     user.Email,
			CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		},
		Token: token,
	})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		common.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Email == "" || req.Password == "" {
		common.Error(w, http.StatusBadRequest, "Email and password are required")
		return
	}

	user, token, err := h.service.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		switch err {
		case ErrInvalidCredentials:
			common.Error(w, http.StatusUnauthorized, "Invalid email or password")
		default:
			common.Error(w, http.StatusInternalServerError, "Failed to login")
		}
		return
	}

	common.Success(w, http.StatusOK, AuthResponse{
		User: &UserResponse{
			ID:        user.ID,
			Username:  user.Username,
			Email:     user.Email,
			CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		},
		Token: token,
	})
}
