package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("❌ DATABASE_URL not set in .env")
	}

	fmt.Println("🔌 Testing connection to Neon...")
	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("❌ Connection failed: %v", err)
	}
	defer pool.Close()

	// Test ping
	if err := pool.Ping(context.Background()); err != nil {
		log.Fatalf("❌ Ping failed: %v", err)
	}

	fmt.Println("✅ Connection successful!")

	// Get database version
	var version string
	pool.QueryRow(context.Background(), "SELECT version()").Scan(&version)
	fmt.Printf("📊 PostgreSQL version: %s\n", version)
}
