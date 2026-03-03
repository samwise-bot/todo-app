package app

import (
	"fmt"
	"strings"
	"sync"
	"time"
)

type metricsRegistry struct {
	mu sync.Mutex

	weeklyReviewRequests      int64
	weeklyReviewFailures      int64
	weeklyReviewDurationCount int64
	weeklyReviewDurationSum   float64

	boardLaneFetchFailures map[string]int64
}

func newMetricsRegistry() *metricsRegistry {
	return &metricsRegistry{
		boardLaneFetchFailures: map[string]int64{
			"/api/boards":  0,
			"/api/columns": 0,
			"/api/tasks":   0,
		},
	}
}

func (m *metricsRegistry) IncWeeklyReviewRequests() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.weeklyReviewRequests++
}

func (m *metricsRegistry) IncWeeklyReviewFailures() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.weeklyReviewFailures++
}

func (m *metricsRegistry) ObserveWeeklyReviewDuration(d time.Duration) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.weeklyReviewDurationCount++
	m.weeklyReviewDurationSum += d.Seconds()
}

func (m *metricsRegistry) IncBoardLaneFetchFailure(endpoint string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.boardLaneFetchFailures[endpoint]++
}

func (m *metricsRegistry) RenderPrometheus() string {
	m.mu.Lock()
	defer m.mu.Unlock()

	var b strings.Builder
	b.WriteString(fmt.Sprintf("todo_app_weekly_review_requests_total %d\n", m.weeklyReviewRequests))
	b.WriteString(fmt.Sprintf("todo_app_weekly_review_failures_total %d\n", m.weeklyReviewFailures))
	b.WriteString(fmt.Sprintf("todo_app_weekly_review_duration_seconds_count %d\n", m.weeklyReviewDurationCount))
	b.WriteString(fmt.Sprintf("todo_app_weekly_review_duration_seconds_sum %.6f\n", m.weeklyReviewDurationSum))
	b.WriteString(fmt.Sprintf("todo_app_board_lane_fetch_failures_total{endpoint=\"/api/boards\"} %d\n", m.boardLaneFetchFailures["/api/boards"]))
	b.WriteString(fmt.Sprintf("todo_app_board_lane_fetch_failures_total{endpoint=\"/api/columns\"} %d\n", m.boardLaneFetchFailures["/api/columns"]))
	b.WriteString(fmt.Sprintf("todo_app_board_lane_fetch_failures_total{endpoint=\"/api/tasks\"} %d\n", m.boardLaneFetchFailures["/api/tasks"]))
	return b.String()
}
