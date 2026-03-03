.PHONY: dev-backend restart-backend test-backend test-backend-repro test-backend-remote test-browser-smoke generate-backend-contract-tests test-backend-contracts

GO ?= $(shell command -v go 2>/dev/null)
ifeq ($(GO),)
GO := /home/bot/.nix-profile/bin/go
endif

dev-backend:
	cd backend && $(GO) run ./cmd/api

restart-backend:
	mkdir -p .run logs/runtime
	@if [ -f .run/backend.pid ]; then \
		pid=$$(cat .run/backend.pid); \
		if kill -0 $$pid 2>/dev/null; then kill $$pid 2>/dev/null || true; fi; \
		sleep 1; \
		if kill -0 $$pid 2>/dev/null; then kill -9 $$pid 2>/dev/null || true; fi; \
		rm -f .run/backend.pid; \
	fi
	nohup bash -lc "cd '$(CURDIR)/backend' && $(GO) run ./cmd/api" >> logs/runtime/backend.log 2>&1 & echo $$! > .run/backend.pid
	@echo "backend restarted pid=$$(cat .run/backend.pid)"

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
