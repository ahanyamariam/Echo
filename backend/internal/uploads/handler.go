package uploads

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/ahanyamariam/echo/internal/common"
	"github.com/ahanyamariam/echo/internal/middleware"
	"github.com/google/uuid"
)

type Handler struct {
	uploadDir string
}

func NewHandler(uploadDir string) *Handler {
	return &Handler{uploadDir: uploadDir}
}

type UploadResponse struct {
	MediaURL string `json:"media_url"`
}

func (h *Handler) Upload(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		common.Error(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Parse multipart form (max 10MB)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		common.Error(w, http.StatusBadRequest, "File too large or invalid form")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		common.Error(w, http.StatusBadRequest, "No file provided")
		return
	}
	defer file.Close()

	// Validate file type
	contentType := header.Header.Get("Content-Type")
	if !isValidImageType(contentType) {
		ext := strings.ToLower(filepath.Ext(header.Filename))
		if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" && ext != ".gif" {
			common.Error(w, http.StatusBadRequest, "Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed")
			return
		}
		contentType = getContentTypeFromExt(ext)
	}

	// Validate file size (max 5MB)
	if header.Size > 5*1024*1024 {
		common.Error(w, http.StatusBadRequest, "File size exceeds 5MB limit")
		return
	}

	// Create upload directory if it doesn't exist
	if err := os.MkdirAll(h.uploadDir, 0755); err != nil {
		common.Error(w, http.StatusInternalServerError, "Failed to create upload directory")
		return
	}

	// Generate unique filename
	ext := filepath.Ext(header.Filename)
	filename := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), uuid.New().String(), ext)
	filePath := filepath.Join(h.uploadDir, filename)

	// Create destination file
	dst, err := os.Create(filePath)
	if err != nil {
		common.Error(w, http.StatusInternalServerError, "Failed to create file")
		return
	}
	defer dst.Close()

	// Copy file content
	if _, err := io.Copy(dst, file); err != nil {
		os.Remove(filePath) // Clean up on error
		common.Error(w, http.StatusInternalServerError, "Failed to save file")
		return
	}

	// Generate public URL
	mediaURL := "/uploads/" + filename

	common.Success(w, http.StatusOK, UploadResponse{
		MediaURL: mediaURL,
	})
}

func isValidImageType(contentType string) bool {
	validTypes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/webp": true,
		"image/gif":  true,
	}
	return validTypes[contentType]
}

func getContentTypeFromExt(ext string) string {
	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".webp":
		return "image/webp"
	case ".gif":
		return "image/gif"
	default:
		return "application/octet-stream"
	}
}