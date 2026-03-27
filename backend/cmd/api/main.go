package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/ahanyamariam/echo/internal/auth"
	"github.com/ahanyamariam/echo/internal/config"
	"github.com/ahanyamariam/echo/internal/conversations"
	"github.com/ahanyamariam/echo/internal/db"
	"github.com/ahanyamariam/echo/internal/jobs"
	"github.com/ahanyamariam/echo/internal/messages"
	"github.com/ahanyamariam/echo/internal/middleware"
	"github.com/ahanyamariam/echo/internal/profile"
	"github.com/ahanyamariam/echo/internal/realtime"
	"github.com/ahanyamariam/echo/internal/uploads"
	"github.com/ahanyamariam/echo/internal/users"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	pool, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	log.Println("Connected to database")

	// Initialize repositories
	authRepo := auth.NewRepository(pool)
	usersRepo := users.NewRepository(pool)
	convsRepo := conversations.NewRepository(pool)
	msgsRepo := messages.NewRepository(pool)
	profileRepo := profile.NewRepository(pool)
 
	// Initialize services
	authService := auth.NewService(authRepo, cfg.JWTSecret, cfg.JWTExpiry)
	usersService := users.NewService(usersRepo)
 	convsService := conversations.NewService(convsRepo)
 	msgsService := messages.NewService(msgsRepo, convsRepo)
 	profileService := profile.NewService(profileRepo, cfg.UploadDir)

	// Initialize WebSocket hub
	hub := realtime.NewHub()
	go hub.Run()
	log.Println("WebSocket hub started")

	// Start cleanup job for expired messages (runs every 5 minutes)
	cleanupJob := jobs.NewCleanupJob(msgsService, 5*time.Minute)
	cleanupJob.Start()
	log.Println("Cleanup job started")

	// Initialize handlers
	authHandler := auth.NewHandler(authService)
	usersHandler := users.NewHandler(usersService)
	convsHandler := conversations.NewHandler(convsService)
	msgsHandler := messages.NewHandler(msgsService, convsService, hub)
	uploadsHandler := uploads.NewHandler(cfg.UploadDir)
	profileHandler := profile.NewHandler(profileService)
	wsHandler := realtime.NewHandler(hub, authService, msgsService, convsService)

	// Setup router
	r := chi.NewRouter()

	// Middleware
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.Timeout(60 * time.Second))

	// CORS
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// WebSocket endpoint
	r.Get("/ws", wsHandler.HandleWebSocket)

	// Public routes - Auth
	r.Route("/auth", func(r chi.Router) {
		r.Post("/signup", authHandler.Signup)
		r.Post("/login", authHandler.Login)
	})

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(middleware.AuthMiddleware(authService))

		// Users
		r.Route("/users", func(r chi.Router) {
			r.Get("/me", usersHandler.GetMe)
			r.Get("/search", usersHandler.Search)

			// Profile routes
			r.Get("/me/profile", profileHandler.GetMyProfile)
			r.Patch("/me/profile", profileHandler.UpdateProfile)
			r.Post("/me/avatar", profileHandler.UploadAvatar)
			r.Delete("/me/avatar", profileHandler.RemoveAvatar)
			r.Get("/me/settings", profileHandler.GetSettings)
			r.Patch("/me/settings", profileHandler.UpdateSettings)
			r.Get("/{id}/profile", profileHandler.GetUserProfile)
		})

		// Conversations
		r.Route("/conversations", func(r chi.Router) {
			r.Get("/", convsHandler.List)
			r.Post("/", convsHandler.Create)
			r.Patch("/{id}/disappearing", convsHandler.UpdateDisappearingMessages)
		})

		// Messages
		r.Route("/messages", func(r chi.Router) {
 			r.Get("/", msgsHandler.List)
			r.Post("/{id}/view", msgsHandler.MarkAsViewed)
		})

		// Uploads
		r.Post("/uploads", uploadsHandler.Upload)
	})

	// Serve uploaded files (including avatars)
	if err := os.MkdirAll(cfg.UploadDir, 0755); err != nil {
		log.Fatalf("Failed to create upload directory: %v", err)
	}
	// Create avatars subdirectory
	if err := os.MkdirAll(cfg.UploadDir+"/avatars", 0755); err != nil {
		log.Fatalf("Failed to create avatars directory: %v", err)
	}
	fileServer := http.FileServer(http.Dir(cfg.UploadDir))
	r.Handle("/uploads/*", http.StripPrefix("/uploads/", fileServer))

	// Start server
	server := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("Server starting on port %s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Server shutting down...")

	// Stop cleanup job
	cleanupJob.Stop()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited properly")
}
