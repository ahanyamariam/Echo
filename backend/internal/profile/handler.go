package profile

import (
	"encoding/json"
	"net/http"

	"github.com/ahanyamariam/echo/internal/common"
	"github.com/ahanyamariam/echo/internal/middleware"
	"github.com/go-chi/chi/v5"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// Profile response types
type ProfileResponse struct {
	ID          string  `json:"id"`
	Username    string  `json:"username"`
	Email       string  `json:"email,omitempty"`
	DisplayName *string `json:"display_name"`
	AvatarURL   *string `json:"avatar_url"`
	Bio         *string `json:"bio"`
	CreatedAt   string  `json:"created_at"`
}

type SettingsResponse struct {
	ShowEmail        bool `json:"show_email"`
	ShowAvatar       bool `json:"show_avatar"`
	ShowOnlineStatus bool `json:"show_online_status"`
}

type FullProfileResponse struct {
	Profile  ProfileResponse  `json:"profile"`
	Settings SettingsResponse `json:"settings"`
}

// Request types
type UpdateProfileRequest struct {
	DisplayName *string `json:"display_name"`
	Bio         *string `json:"bio"`
}

type UpdateSettingsRequest struct {
	ShowEmail        *bool `json:"show_email"`
	ShowAvatar       *bool `json:"show_avatar"`
	ShowOnlineStatus *bool `json:"show_online_status"`
}

// GET /users/me/profile
func (h *Handler) GetMyProfile(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		common.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	result, err := h.service.GetMyProfile(r.Context(), userID)
	if err != nil {
		common.Error(w, http.StatusInternalServerError, "Failed to get profile")
		return
	}

	response := FullProfileResponse{
		Profile: ProfileResponse{
			ID:          result.Profile.ID,
			Username:    result.Profile.Username,
			Email:       result.Profile.Email,
			DisplayName: result.Profile.DisplayName,
			AvatarURL:   result.Profile.AvatarURL,
			Bio:         result.Profile.Bio,
			CreatedAt:   result.Profile.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		},
		Settings: SettingsResponse{
			ShowEmail:        result.Settings.ShowEmail,
			ShowAvatar:       result.Settings.ShowAvatar,
			ShowOnlineStatus: result.Settings.ShowOnlineStatus,
		},
	}

	common.Success(w, http.StatusOK, response)
}

// PATCH /users/me/profile
func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		common.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		common.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	profile, err := h.service.UpdateProfile(r.Context(), userID, req.DisplayName, req.Bio)
	if err != nil {
		common.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	response := ProfileResponse{
		ID:          profile.ID,
		Username:    profile.Username,
		Email:       profile.Email,
		DisplayName: profile.DisplayName,
		AvatarURL:   profile.AvatarURL,
		Bio:         profile.Bio,
		CreatedAt:   profile.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	common.Success(w, http.StatusOK, response)
}

// POST /users/me/avatar
func (h *Handler) UploadAvatar(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		common.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Parse multipart form (max 5MB)
	if err := r.ParseMultipartForm(5 << 20); err != nil {
		common.Error(w, http.StatusBadRequest, "File too large or invalid form")
		return
	}

	file, header, err := r.FormFile("avatar")
	if err != nil {
		common.Error(w, http.StatusBadRequest, "No file provided")
		return
	}
	defer file.Close()

	avatarURL, err := h.service.UploadAvatar(r.Context(), userID, file, header)
	if err != nil {
		switch err {
		case ErrInvalidFileType:
			common.Error(w, http.StatusBadRequest, "Invalid file type. Only JPG, PNG, and WEBP are allowed")
		case ErrFileTooLarge:
			common.Error(w, http.StatusBadRequest, "File size exceeds 2MB limit")
		default:
			common.Error(w, http.StatusInternalServerError, "Failed to upload avatar")
		}
		return
	}

	common.Success(w, http.StatusOK, map[string]string{
		"avatar_url": avatarURL,
	})
}

// DELETE /users/me/avatar
func (h *Handler) RemoveAvatar(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		common.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	if err := h.service.RemoveAvatar(r.Context(), userID); err != nil {
		common.Error(w, http.StatusInternalServerError, "Failed to remove avatar")
		return
	}

	common.Success(w, http.StatusOK, map[string]string{
		"message": "Avatar removed successfully",
	})
}

// GET /users/me/settings
func (h *Handler) GetSettings(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		common.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	result, err := h.service.GetMyProfile(r.Context(), userID)
	if err != nil {
		common.Error(w, http.StatusInternalServerError, "Failed to get settings")
		return
	}

	response := SettingsResponse{
		ShowEmail:        result.Settings.ShowEmail,
		ShowAvatar:       result.Settings.ShowAvatar,
		ShowOnlineStatus: result.Settings.ShowOnlineStatus,
	}

	common.Success(w, http.StatusOK, response)
}

// PATCH /users/me/settings
func (h *Handler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		common.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req UpdateSettingsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		common.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	settings, err := h.service.UpdateSettings(r.Context(), userID, req.ShowEmail, req.ShowAvatar, req.ShowOnlineStatus)
	if err != nil {
		common.Error(w, http.StatusInternalServerError, "Failed to update settings")
		return
	}

	response := SettingsResponse{
		ShowEmail:        settings.ShowEmail,
		ShowAvatar:       settings.ShowAvatar,
		ShowOnlineStatus: settings.ShowOnlineStatus,
	}

	common.Success(w, http.StatusOK, response)
}

// GET /users/{id}/profile
func (h *Handler) GetUserProfile(w http.ResponseWriter, r *http.Request) {
	viewerID := middleware.GetUserID(r.Context())
	if viewerID == "" {
		common.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	userID := chi.URLParam(r, "id")
	if userID == "" {
		common.Error(w, http.StatusBadRequest, "User ID required")
		return
	}

	profile, err := h.service.GetPublicProfile(r.Context(), userID, viewerID)
	if err != nil {
		common.Error(w, http.StatusNotFound, "User not found")
		return
	}

	common.Success(w, http.StatusOK, profile)
}