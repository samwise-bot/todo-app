package tests

import (
	"testing"

	"github.com/example/todo-app/backend/internal/domain"
)

func TestTransitionRequiresProjectForActionableStates(t *testing.T) {
	if domain.TransitionAllowed(domain.TaskStateInbox, domain.TaskStateNext, nil) {
		t.Fatal("expected inbox -> next to fail without project")
	}
	pid := int64(1)
	if !domain.TransitionAllowed(domain.TaskStateInbox, domain.TaskStateNext, &pid) {
		t.Fatal("expected inbox -> next with project")
	}
}

func TestDoneIsTerminal(t *testing.T) {
	pid := int64(1)
	if domain.TransitionAllowed(domain.TaskStateDone, domain.TaskStateNext, &pid) {
		t.Fatal("done should be terminal")
	}
}
