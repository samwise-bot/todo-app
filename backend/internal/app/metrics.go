package app

import (
	"fmt"
	"strings"
	"sync"
	"time"
)

var weeklyReviewDurationBuckets = []float64{0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10}

type metricsRegistry struct {
	mu sync.Mutex

	weeklyReviewRequests      int64
	weeklyReviewFailures      int64
	weeklyReviewDurationCount int64
	weeklyReviewDurationSum   float64
	weeklyReviewDurationLe    map[float64]int64

	boardLaneFetchFailures map[string]int64
}

func newMetricsRegistry() *metricsRegistry {
	durationLe := make(map[float64]int64, len(weeklyReviewDurationBuckets))
	for _, bucket := range weeklyReviewDurationBuckets {
		durationLe[bucket] = 0
	}

	return &metricsRegistry{
		weeklyReviewDurationLe: durationLe,
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
	seconds := d.Seconds()
	m.weeklyReviewDurationSum += seconds
	for _, bucket := range weeklyReviewDurationBuckets {
		if seconds <= bucket {
			m.weeklyReviewDurationLe[bucket]++
		}
	}
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
	b.WriteString("# HELP todo_app_weekly_review_requests_total Total weekly review requests.\n")
	b.WriteString("# TYPE todo_app_weekly_review_requests_total counter\n")
	b.WriteString(fmt.Sprintf("todo_app_weekly_review_requests_total %d\n", m.weeklyReviewRequests))
	b.WriteString("# HELP todo_app_weekly_review_failures_total Total failed weekly review requests.\n")
	b.WriteString("# TYPE todo_app_weekly_review_failures_total counter\n")
	b.WriteString(fmt.Sprintf("todo_app_weekly_review_failures_total %d\n", m.weeklyReviewFailures))
	b.WriteString("# HELP todo_app_weekly_review_duration_seconds Weekly review request duration in seconds.\n")
	b.WriteString("# TYPE todo_app_weekly_review_duration_seconds histogram\n")
	for _, bucket := range weeklyReviewDurationBuckets {
		b.WriteString(fmt.Sprintf("todo_app_weekly_review_duration_seconds_bucket{le=\"%.2f\"} %d\n", bucket, m.weeklyReviewDurationLe[bucket]))
	}
	b.WriteString(fmt.Sprintf("todo_app_weekly_review_duration_seconds_bucket{le=\"+Inf\"} %d\n", m.weeklyReviewDurationCount))
	b.WriteString(fmt.Sprintf("todo_app_weekly_review_duration_seconds_count %d\n", m.weeklyReviewDurationCount))
	b.WriteString(fmt.Sprintf("todo_app_weekly_review_duration_seconds_sum %.6f\n", m.weeklyReviewDurationSum))
	b.WriteString("# HELP todo_app_board_lane_fetch_failures_total Total board lane fetch failures by endpoint.\n")
	b.WriteString("# TYPE todo_app_board_lane_fetch_failures_total counter\n")
	b.WriteString(fmt.Sprintf("todo_app_board_lane_fetch_failures_total{endpoint=\"/api/boards\"} %d\n", m.boardLaneFetchFailures["/api/boards"]))
	b.WriteString(fmt.Sprintf("todo_app_board_lane_fetch_failures_total{endpoint=\"/api/columns\"} %d\n", m.boardLaneFetchFailures["/api/columns"]))
	b.WriteString(fmt.Sprintf("todo_app_board_lane_fetch_failures_total{endpoint=\"/api/tasks\"} %d\n", m.boardLaneFetchFailures["/api/tasks"]))
	return b.String()
}
