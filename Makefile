.PHONY: dev-backend test-backend test-backend-repro test-browser-smoke

dev-backend:
	cd backend && go run ./cmd/api

test-backend:
	cd backend && go test ./...

test-backend-repro:
	./ops/run/test-backend.sh

test-browser-smoke:
	./ops/run/test-browser-smoke.sh
