.PHONY: dev-backend test-backend test-backend-repro test-backend-remote test-browser-smoke generate-backend-contract-tests test-backend-contracts

GO ?= $(shell command -v go 2>/dev/null)
ifeq ($(GO),)
GO := /home/bot/.nix-profile/bin/go
endif

dev-backend:
	cd backend && $(GO) run ./cmd/api

test-backend:
	cd backend && $(GO) test ./...

test-backend-repro:
	./ops/run/test-backend.sh

test-backend-remote:
	BACKEND_TEST_FORCE_REMOTE=1 ./ops/run/test-backend.sh

test-browser-smoke:
	./ops/run/test-browser-smoke.sh

generate-backend-contract-tests:
	./ops/run/generate-backend-contract-tests.sh

test-backend-contracts:
	./ops/run/generate-backend-contract-tests.sh
	git diff --exit-code

smoke-task-mutations:
	./ops/run/check-task-mutations.sh
