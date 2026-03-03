.PHONY: dev-backend test-backend test-backend-repro

dev-backend:
	cd backend && go run ./cmd/api

test-backend:
	cd backend && go test ./...

test-backend-repro:
	./ops/run/test-backend.sh
