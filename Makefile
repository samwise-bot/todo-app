.PHONY: dev-backend test-backend

dev-backend:
	cd backend && go run ./cmd/api

test-backend:
	cd backend && go test ./...
