package app

import (
	"net/http"
	"time"
)

const sessionCookieName = "todo_app_session"

func newSessionCookie(token string, now time.Time) *http.Cookie {
	expiresAt := now.UTC().Add(24 * time.Hour)
	return &http.Cookie{
		Name:     sessionCookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
		Expires:  expiresAt,
		MaxAge:   int((24 * time.Hour).Seconds()),
	}
}

func clearSessionCookie() *http.Cookie {
	return &http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
		Expires:  time.Unix(0, 0).UTC(),
		MaxAge:   -1,
	}
}
