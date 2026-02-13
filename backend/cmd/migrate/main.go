package main

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/ahanyamariam/echo/internal/config"
	"github.com/ahanyamariam/echo/internal/db"
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

	log.Println("Connected to database for migration")

	files, err := os.ReadDir("migrations")
	if err != nil {
		log.Fatalf("Failed to read migrations directory: %v", err)
	}

	var upMigrations []string
	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".up.sql") {
			upMigrations = append(upMigrations, file.Name())
		}
	}

	sort.Strings(upMigrations)

	ctx := context.Background()

	for _, file := range upMigrations {
		log.Printf("Applying migration: %s", file)
		content, err := os.ReadFile(filepath.Join("migrations", file))
		if err != nil {
			log.Fatalf("Failed to read file %s: %v", file, err)
		}

		_, err = pool.Exec(ctx, string(content))
		if err != nil {
			log.Fatalf("Failed to execute migration %s: %v", file, err)
		}
		log.Printf("Successfully applied %s", file)
	}

	log.Println("All migrations applied successfully")
}
