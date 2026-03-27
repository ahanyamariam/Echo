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

	// Validate file type (image or audio)
	contentType := header.Header.Get("Content-Type")
	ext := strings.ToLower(filepath.Ext(header.Filename))

	isImage := isValidImageType(contentType) || isValidImageExt(ext)
	isAudio := isValidAudioType(contentType) || isValidAudioExt(ext)

	if !isImage && !isAudio {
		common.Error(w, http.StatusBadRequest, "Invalid file type. Only images (JPG, PNG, WEBP, GIF) and audio (MP3, WAV, OGG, M4A, WEBM) are allowed")
		return
	}

	// Validate file size (max 5MB for images, 10MB for audio)
	maxSize := int64(5 * 1024 * 1024)
	if isAudio {
		maxSize = 10 * 1024 * 1024
	}
	if header.Size > maxSize {
		if isAudio {
			common.Error(w, http.StatusBadRequest, "File size exceeds 10MB limit for audio")
		} else {
			common.Error(w, http.StatusBadRequest, "File size exceeds 5MB limit")
		}
		return
	}

	// Create upload directory if it doesn't exist
	if err := os.MkdirAll(h.uploadDir, 0755); err != nil {
		common.Error(w, http.StatusInternalServerError, "Failed to create upload directory")
		return
	}

	// Generate unique filename
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

func isValidImageExt(ext string) bool {
	validExts := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".webp": true,
		".gif":  true,
	}
	return validExts[ext]
}

func isValidAudioType(contentType string) bool {
	// Extract base type (remove codec info like ";codecs=opus")
	baseType := strings.Split(contentType, ";")[0]

	validTypes := map[string]bool{
		"audio/mpeg":  true, // MP3
		"audio/mp3":   true,
		"audio/wav":   true,
		"audio/wave":  true,
		"audio/x-wav": true,
		"audio/ogg":   true,
		"audio/webm":  true,
		"audio/mp4":   true, // M4A
		"audio/x-m4a": true,
		"audio/aac":   true,
		"audio/x-aac": true,
	}
	return validTypes[baseType]
}

func isValidAudioExt(ext string) bool {
	validExts := map[string]bool{
		".mp3":  true,
		".wav":  true,
		".ogg":  true,
		".webm": true,
		".m4a":  true,
		".aac":  true,
	}
	return validExts[ext]
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
	case ".mp3":
		return "audio/mpeg"
	case ".wav":
		return "audio/wav"
	case ".ogg":
		return "audio/ogg"
	case ".webm":
		return "audio/webm"
	case ".m4a":
		return "audio/mp4"
	case ".aac":
		return "audio/aac"
	default:
		return "application/octet-stream"
	}
}
