package domain

import "time"

type TaskState string

const (
	TaskStateInbox      TaskState = "inbox"
	TaskStateNext       TaskState = "next"
	TaskStateWaiting    TaskState = "waiting"
	TaskStateScheduled  TaskState = "scheduled"
	TaskStateDone       TaskState = "done"
	TaskStateSomeday    TaskState = "someday"
	TaskStateReference  TaskState = "reference"
)

func (s TaskState) Valid() bool {
	switch s {
	case TaskStateInbox, TaskStateNext, TaskStateWaiting, TaskStateScheduled, TaskStateDone, TaskStateSomeday, TaskStateReference:
		return true
	default:
		return false
	}
}

type PrincipalType string

const (
	PrincipalHuman PrincipalType = "human"
	PrincipalAgent PrincipalType = "agent"
)

type Project struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
}

type Task struct {
	ID            int64      `json:"id"`
	Title         string     `json:"title"`
	Description   string     `json:"description"`
	State         TaskState  `json:"state"`
	ProjectID     *int64     `json:"projectId,omitempty"`
	AssigneeID    *int64     `json:"assigneeId,omitempty"`
	BoardColumnID *int64     `json:"boardColumnId,omitempty"`
	DueAt         *time.Time `json:"dueAt,omitempty"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`
}

type TaskEvent struct {
	ID        int64     `json:"id"`
	TaskID    int64     `json:"taskId"`
	ActorID   *int64    `json:"actorId,omitempty"`
	EventType string    `json:"eventType"`
	Payload   string    `json:"payload"`
	CreatedAt time.Time `json:"createdAt"`
}

func TransitionAllowed(from, to TaskState, projectID *int64) bool {
	if !from.Valid() || !to.Valid() {
		return false
	}
	if from == to {
		return true
	}

	if to == TaskStateNext || to == TaskStateScheduled || to == TaskStateWaiting {
		return projectID != nil
	}

	switch from {
	case TaskStateInbox:
		return to == TaskStateSomeday || to == TaskStateReference || to == TaskStateDone || to == TaskStateNext || to == TaskStateScheduled || to == TaskStateWaiting
	case TaskStateNext, TaskStateScheduled, TaskStateWaiting:
		return to == TaskStateDone || to == TaskStateSomeday || to == TaskStateReference || to == TaskStateNext || to == TaskStateScheduled || to == TaskStateWaiting
	case TaskStateSomeday, TaskStateReference:
		return to == TaskStateInbox || to == TaskStateNext
	case TaskStateDone:
		return false
	default:
		return false
	}
}
