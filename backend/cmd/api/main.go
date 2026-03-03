package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/example/todo-app/backend/internal/app"
	"github.com/example/todo-app/backend/internal/store"
)

func main() {
	dsn := env("TODOAPP_DB_DSN", "file:todo.db?_pragma=foreign_keys(1)")
	addr := env("TODOAPP_ADDR", ":8080")

	s, err := store.NewSQLiteStore(dsn)
	if err != nil { log.Fatal(err) }
	defer s.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := s.Migrate(ctx); err != nil { log.Fatal(err) }

	h := app.NewServer(s).Routes()
	log.Printf("todo-api listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, h))
}

func env(k, v string) string {
	if x := os.Getenv(k); x != "" { return x }
	return v
}
