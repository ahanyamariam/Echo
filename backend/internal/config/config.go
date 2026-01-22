package config

import (
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port          string
	Env           string
	DatabaseURL   string
	JWTSecret     string
	JWTExpiry     time.Duration
	UploadDir     string
	MaxUploadSize int64
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	jwtExpiry, err := time.ParseDuration(getEnv("JWT_EXPIRY", "24h"))
	if err != nil {
		jwtExpiry = 24 * time.Hour
	}

	maxUploadSize, _ := strconv.ParseInt(getEnv("MAX_UPLOAD_SIZE", "5242880"), 10, 64)

	return &Config{
		Port:          getEnv("PORT", "8080"),
		Env:           getEnv("ENV", "development"),
		DatabaseURL:   getEnv("DATABASE_URL", "postgres://echo:echo@localhost:5432/echo?sslmode=disable"),
		JWTSecret:     getEnv("JWT_SECRET", "default-secret-change-me"),
		JWTExpiry:     jwtExpiry,
		UploadDir:     getEnv("UPLOAD_DIR", "./uploads"),
		MaxUploadSize: maxUploadSize,
	}, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}