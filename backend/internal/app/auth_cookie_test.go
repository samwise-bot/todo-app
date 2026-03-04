package app

import (
	"net/http"
	"testing"
	"time"
)

func TestNewSessionCookieSecureDefaults(t *testing.T) {
	now := time.Date(2026, 3, 4, 9, 43, 0, 0, time.UTC)
	cookie := newSessionCookie("session-token", now)

	if cookie.Name != sessionCookieName {
		t.Fatalf("expected name %q, got %q", sessionCookieName, cookie.Name)
	}
	if cookie.Value != "session-token" {
		t.Fatalf("expected token value, got %q", cookie.Value)
	}
	if !cookie.HttpOnly || !cookie.Secure {
		t.Fatalf("expected secure HttpOnly cookie: %+v", cookie)
	}
	if cookie.SameSite != http.SameSiteStrictMode {
		t.Fatalf("expected SameSiteStrictMode, got %v", cookie.SameSite)
	}
	if cookie.Path != "/" {
		t.Fatalf("expected path '/', got %q", cookie.Path)
	}
	if cookie.MaxAge != 86400 {
		t.Fatalf("expected max age 86400, got %d", cookie.MaxAge)
	}
	expectedExpiry := now.Add(24 * time.Hour)
	if !cookie.Expires.Equal(expectedExpiry) {
		t.Fatalf("expected expiry %s, got %s", expectedExpiry, cookie.Expires)
	}
}

func TestClearSessionCookieExpiresImmediately(t *testing.T) {
	cookie := clearSessionCookie()

	if cookie.Name != sessionCookieName {
		t.Fatalf("expected name %q, got %q", sessionCookieName, cookie.Name)
	}
	if cookie.MaxAge != -1 {
		t.Fatalf("expected MaxAge -1, got %d", cookie.MaxAge)
	}
	if cookie.Value != "" {
		t.Fatalf("expected empty cookie value, got %q", cookie.Value)
	}
	if !cookie.HttpOnly || !cookie.Secure {
		t.Fatalf("expected secure HttpOnly cookie: %+v", cookie)
	}
	if cookie.SameSite != http.SameSiteStrictMode {
		t.Fatalf("expected SameSiteStrictMode, got %v", cookie.SameSite)
	}
	if !cookie.Expires.Equal(time.Unix(0, 0).UTC()) {
		t.Fatalf("expected epoch expiry, got %s", cookie.Expires)
	}
}
