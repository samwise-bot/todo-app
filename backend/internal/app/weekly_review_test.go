package app

import (
	"testing"
	"time"

	"github.com/example/todo-app/backend/internal/domain"
)

func TestBuildWeeklyReviewGroupsThresholdAndOverdueBoundaries(t *testing.T) {
	now := time.Date(2026, time.March, 3, 12, 0, 0, 0, time.UTC)
	cutoff := now.Add(-7 * 24 * time.Hour)
	beforeNow := now.Add(-1 * time.Minute)

	tasks := []domain.Task{
		{ID: 5, State: domain.TaskStateWaiting, UpdatedAt: cutoff},
		{ID: 6, State: domain.TaskStateWaiting, UpdatedAt: cutoff.Add(1 * time.Second)},
		{ID: 7, State: domain.TaskStateSomeday, UpdatedAt: cutoff.Add(-2 * time.Hour)},
		{ID: 8, State: domain.TaskStateScheduled, UpdatedAt: now, DueAt: &beforeNow},
		{ID: 9, State: domain.TaskStateScheduled, UpdatedAt: now, DueAt: &now},
		{ID: 10, State: domain.TaskStateScheduled, UpdatedAt: now},
		{ID: 11, State: domain.TaskStateNext, UpdatedAt: cutoff.Add(-24 * time.Hour)},
	}

	groups, staleTasks := buildWeeklyReviewGroups(tasks, now, 7)

	if len(groups.Waiting) != 1 || groups.Waiting[0].ID != 5 {
		t.Fatalf("expected waiting section to include only task 5, got %+v", groups.Waiting)
	}
	if len(groups.Someday) != 1 || groups.Someday[0].ID != 7 {
		t.Fatalf("expected someday section to include only task 7, got %+v", groups.Someday)
	}
	if len(groups.OverdueScheduled) != 1 || groups.OverdueScheduled[0].ID != 8 {
		t.Fatalf("expected overdue scheduled section to include only task 8, got %+v", groups.OverdueScheduled)
	}
	if len(staleTasks) != 2 || staleTasks[0].ID != 7 || staleTasks[1].ID != 5 {
		t.Fatalf("expected stale tasks [7,5], got %+v", staleTasks)
	}
}
