package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	dbURL := "postgres://echo:echo@localhost:5432/echo?sslmode=disable"
	ctx := context.Background()

	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer pool.Close()

	// 1. Create User 1
	var user1ID string
	err = pool.QueryRow(ctx, "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id", "userA_"+time.Now().Format("20060102150405"), "userA_"+time.Now().Format("20060102150405")+"@example.com", "hash").Scan(&user1ID)
	if err != nil {
		log.Fatalf("Failed to create user 1: %v", err)
	}
	fmt.Printf("Created User 1: %s\n", user1ID)

	// 2. Create User 2
	var user2ID string
	err = pool.QueryRow(ctx, "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id", "userB_"+time.Now().Format("20060102150405"), "userB_"+time.Now().Format("20060102150405")+"@example.com", "hash").Scan(&user2ID)
	if err != nil {
		log.Fatalf("Failed to create user 2: %v", err)
	}
	fmt.Printf("Created User 2: %s\n", user2ID)

	// 3. Create DM (First time) - simulating repository logic
	fmt.Println("Attempt 1: Creating DM...")
	tx, err := pool.Begin(ctx)
	if err != nil {
		log.Fatalf("Failed to begin tx: %v", err)
	}

	// Verify user 2 exists
	var otherUsername string
	err = tx.QueryRow(ctx, "SELECT username FROM users WHERE id = $1", user2ID).Scan(&otherUsername)
	if err != nil {
		log.Fatalf("Failed to find other user: %v", err)
	}

	var convID string
	err = tx.QueryRow(ctx, "INSERT INTO conversations (type) VALUES ('dm') RETURNING id").Scan(&convID)
	if err != nil {
		log.Fatalf("Failed to insert conversation: %v", err)
	}

	_, err = tx.Exec(ctx, "INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1, $2), ($1, $3)", convID, user1ID, user2ID)
	if err != nil {
		log.Fatalf("Failed to insert members: %v", err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		log.Fatalf("Failed to commit: %v", err)
	}
	fmt.Printf("Successfully created DM: %s\n", convID)

	// 4. Find Existing DM - simulating repository FindDMBetweenUsers
	fmt.Println("Attempt 2: Finding existing DM...")
	var existingID string
	err = pool.QueryRow(ctx, `
		SELECT c.id
		FROM conversations c
		JOIN conversation_members cm1 ON c.id = cm1.conversation_id AND cm1.user_id = $1
		JOIN conversation_members cm2 ON c.id = cm2.conversation_id AND cm2.user_id = $2
		JOIN users u ON u.id = $2
		WHERE c.type = 'dm'
		LIMIT 1
	`, user1ID, user2ID).Scan(&existingID)

	if err != nil {
		log.Fatalf("FindDM failed to find existing DM: %v", err)
	} else {
		fmt.Printf("Found existing DM: %s\n", existingID)
	}

	// 5. Try with non-existent user
	fmt.Println("Attempt 3: Create DM with fake user")
	fakeID := "00000000-0000-0000-0000-000000000000"

	tx, _ = pool.Begin(ctx)
	err = tx.QueryRow(ctx, "SELECT username FROM users WHERE id = $1", fakeID).Scan(&otherUsername)
	tx.Rollback(ctx)
	if err != nil {
		if err == pgx.ErrNoRows {
			fmt.Println("Correctly identified user not found")
		} else {
			fmt.Printf("Unexpected error for fake user: %v\n", err)
		}
	} else {
		log.Fatal("Expected error for fake user but got none")
	}

}
