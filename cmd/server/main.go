package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"log"
	"math/rand"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"letterofheart/internal/db"
	"letterofheart/web"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env if present (optional)
	_ = godotenv.Load()

	rand.Seed(time.Now().UnixNano())

	if err := db.InitDB(); err != nil {
		log.Fatalf("failed to initialize database: %v", err)
	}
	defer db.DB.Close()

	shutdownCtx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	db.StartAutoBackup(shutdownCtx, 5*time.Minute)

	// Ensure uploads directory exists
	if err := os.MkdirAll("./uploads", 0755); err != nil {
		log.Fatalf("failed to create uploads directory: %v", err)
	}

	// Initialize audit logging for cybersecurity (IP logging for writes and admin access)
	initAuditLog()

	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// CORS middleware (matching previous express cors())
	r.Use(corsMiddleware)

	// JSON body helper used in handlers, also allow multipart/form-data for file uploads
	r.Use(middleware.AllowContentType("application/json", "multipart/form-data"))

	// Health check endpoints
	r.Get("/api/health", healthHandler)
	r.Get("/health", healthHandler)

	// All API routes (prefixed with /api)
	// Users
	r.Post("/api/users", createUserHandler)
	r.Get("/api/generate-nickname", generateNicknameHandler)
	r.Get("/api/current-week", currentWeekHandler)

	// Posts
	r.Get("/api/posts", listPostsHandler)
	r.Post("/api/posts", createPostHandler)
	r.Put("/api/posts/{id}/view", viewPostHandler)
	r.Put("/api/posts/{id}/admin-reply", adminReplyHandler)
	r.Post("/api/posts/{id}/admin-reply", adminReplyHandler)
	r.Put("/api/posts/{id}/delete", toggleDeleteHandler)
	r.Post("/api/posts/{id}/report", reportPostHandler)

	// Reactions
	r.Post("/api/reactions", addReactionHandler)

	// Settings
	r.Get("/api/settings", getSettingsHandler)
	r.Put("/api/settings", updateSettingsHandler)

	// Updates
	r.Get("/api/updates", listUpdatesHandler)

	// Stats
	r.Get("/api/stats", getStatsHandler)

	// Upload routes
	r.Post("/api/upload", uploadHandler)
	r.Handle("/api/uploads/*", http.StripPrefix("/api/uploads/", http.FileServer(http.Dir("./uploads"))))

	// Serve a top-level thumbnail path for crawlers (e.g., /thumbnail.png) — prefers uploaded kakao-thumbnail.png
	r.Get("/thumbnail.png", func(w http.ResponseWriter, r *http.Request) {
		candidates := []string{"./uploads/kakao-thumbnail.png", "./thumbnail.png"}
		for _, p := range candidates {
			if _, err := os.Stat(p); err == nil {
				// Use ServeFile so proper headers are set
				http.ServeFile(w, r, p)
				return
			}
		}
		http.NotFound(w, r)
	})

	// Admin Subrouter (Session-based)
	r.Route("/api/admin", func(r chi.Router) {
		r.Post("/login", adminLoginHandler)

		r.Group(func(r chi.Router) {
			r.Use(adminAuthMiddleware)
			r.Post("/logout", adminLogoutHandler)
			r.Get("/check-auth", checkAuthHandler)
			r.Get("/users", listUsersHandler)
			r.Put("/users/{uuid}/nickname", updateNicknameHandler)
			r.Put("/users/{uuid}/status", toggleUserStatusHandler)
			r.Delete("/users/{uuid}/permanent", permanentDeleteUserHandler)
			r.Get("/posts", listAllPostsHandler)
			r.Delete("/posts/{id}/permanent", permanentDeletePostHandler)
			r.Get("/reactions", listReactionsHandler)
			r.Delete("/reactions/{id}", deleteReactionHandler)
			r.Delete("/replies/{id}", deleteAdminReplyHandler)
			r.Post("/register", adminRegisterHandler)
			r.Put("/change-code", adminChangeCodeHandler)
			r.Get("/audit-logs", listAuditLogsHandler)
			r.Post("/updates", upsertUpdateHandler)
			r.Delete("/updates/{id}", deleteUpdateHandler)
		})
	})

	// Serve built frontend (if it exists) so everything runs on ONE URL.
	serveFrontend(r)

	log.Printf("Server is running on port %s (SQLite backend)", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}

// --- Cybersecurity: IP Audit Logging ---

var auditLog *log.Logger

func initAuditLog() {
	if err := os.MkdirAll("data", 0755); err != nil {
		log.Printf("warning: could not create data dir for audit log: %v", err)
		auditLog = log.New(os.Stdout, "AUDIT ", log.LstdFlags|log.LUTC)
		return
	}
	f, err := os.OpenFile("data/audit.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Printf("warning: could not open audit.log, falling back to stdout: %v", err)
		auditLog = log.New(os.Stdout, "AUDIT ", log.LstdFlags|log.LUTC)
		return
	}
	auditLog = log.New(f, "", log.LstdFlags|log.LUTC)
}

func getClientIP(r *http.Request) string {
	// RealIP middleware populates RemoteAddr with the original client IP.
	if ip, _, err := net.SplitHostPort(r.RemoteAddr); err == nil {
		return ip
	}
	return r.RemoteAddr
}

func logAudit(r *http.Request, action, userUUID, userNickname, details string) {
	if auditLog == nil {
		auditLog = log.New(os.Stdout, "AUDIT ", log.LstdFlags|log.LUTC)
	}
	// If the client indicates incognito mode, mask identifiers in audit logs for privacy
	if r != nil && r.Header.Get("X-Incognito") == "1" {
		userUUID = ""
		userNickname = ""
	}
	ip := getClientIP(r)
	auditLog.Printf("ip=%s action=%s user_uuid=%s user_nickname=%s details=%q", ip, action, userUUID, userNickname, details)
}

// serveFrontend mounts the built React app from web/dist (if it exists).
// The web UI source lives inside this Go project (`web/`) — one codebase.
func serveFrontend(r chi.Router) {
	// Prefer embedded frontend (single binary produced by `make build`)
	if subFS, err := fs.Sub(web.Dist, "dist"); err == nil {
		if _, err := subFS.Open("index.html"); err == nil {
			serveSPA(r, http.FS(subFS), "embedded")
			return
		}
	}

	// Fallback to on-disk build (after `npm run build` inside web/)
	// When running `go run ./cmd/server` or the binary from project root, "web/dist" is correct.
	distDir := "web/dist"
	if _, err := os.Stat(distDir + "/index.html"); err == nil {
		serveSPA(r, http.Dir(distDir), distDir)
		return
	}

	// Nothing built — show helpful root page
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		port := os.Getenv("PORT")
		if port == "" {
			port = "5000"
		}
		w.Write([]byte(`<h1>Backend is running ✅</h1>
<p>Go + SQLite on ` + port + `</p>
<p><b>One-app modes:</b></p>
<ul>
<li>Dev (hot reload): <code>make dev</code> → http://localhost:5173</li>
<li>Full binary: <code>make build</code> → ./letterofheart → http://localhost:5000</li>
</ul>
<p>UI source is in <code>web/</code>.</p>`))
	})
}

// serveSPA registers a handler for static files + SPA fallback.
func serveSPA(r chi.Router, fsys http.FileSystem, label string) {
	fileServer := http.FileServer(fsys)

	r.Get("/*", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api") {
			http.NotFound(w, r)
			return
		}

		// Serve asset if exists
		if f, err := fsys.Open(strings.TrimLeft(r.URL.Path, "/")); err == nil {
			f.Close()
			fileServer.ServeHTTP(w, r)
			return
		}

		// React Router fallback
		r.URL.Path = "/"
		fileServer.ServeHTTP(w, r)
	})

	log.Printf("Serving frontend (%s)", label)
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("json encode error: %v", err)
	}
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message":   "마음의 편지함 백엔드 서버가 정상적으로 작동 중입니다.",
		"status":    "healthy",
		"timestamp": time.Now(),
	})
}

// ─── User Handlers ──────────────────────────────────────────────────

func createUserHandler(w http.ResponseWriter, r *http.Request) {
	var body struct {
		UUID     string `json:"uuid"`
		Nickname string `json:"nickname"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		// allow empty body
		body = struct {
			UUID     string `json:"uuid"`
			Nickname string `json:"nickname"`
		}{}
	}

	user, err := db.CreateUser(body.UUID, body.Nickname)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, user)
}

func generateNicknameHandler(w http.ResponseWriter, r *http.Request) {
	// Return a server-side generated nickname without creating a user record
	nick := db.GenerateNickname()
	writeJSON(w, http.StatusOK, map[string]string{"nickname": nick})
}

func adminAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("loh_session_id")
		if err != nil {
			writeError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}
		user, err := db.GetAdminSession(cookie.Value)
		if err != nil || user == nil {
			writeError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func checkAuthHandler(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("loh_session_id")
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	user, err := db.GetAdminSession(cookie.Value)
	if err != nil || user == nil {
		writeError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"authorized": true,
		"user":       user,
	})
}

func adminLogoutHandler(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("loh_session_id")
	if err == nil && cookie != nil {
		_ = db.DeleteAdminSession(cookie.Value)
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "loh_session_id",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	})

	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}

func adminLoginHandler(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Nickname string `json:"nickname"`
		Code     string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid body.")
		return
	}
	if body.Nickname == "" || body.Code == "" {
		writeError(w, http.StatusBadRequest, "Nickname and code are required.")
		return
	}

	user, err := db.GetAdminByNicknameAndCode(body.Nickname, body.Code)
	if err != nil || user == nil {
		writeError(w, http.StatusForbidden, "Invalid administrator credentials.")
		return
	}

	sessionID, err := db.CreateAdminSession(user.UUID, 7*24*time.Hour)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create session.")
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "loh_session_id",
		Value:    sessionID,
		Path:     "/",
		HttpOnly: true,
		Secure:   false, // set to false for local dev HTTP support
		SameSite: http.SameSiteLaxMode,
		MaxAge:   7 * 24 * 60 * 60, // 7 days in seconds
	})

	logAudit(r, "admin_login", user.UUID, user.Nickname, "")

	writeJSON(w, http.StatusOK, user)
}

func adminRegisterHandler(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Nickname      string `json:"nickname"`
		Code          string `json:"code"`
		RegistrarUUID string `json:"registrarUuid"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid body.")
		return
	}
	if body.Nickname == "" || body.Code == "" || body.RegistrarUUID == "" {
		writeError(w, http.StatusBadRequest, "Nickname, code, and registrarUuid required.")
		return
	}
	// Only the first admin can register new admins
	if body.RegistrarUUID != db.AdminUUID {
		writeError(w, http.StatusForbidden, "Only the first administrator can register new admins.")
		return
	}
	if err := db.RegisterAdmin(body.Nickname, body.Code); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	logAudit(r, "admin_register", body.RegistrarUUID, "", fmt.Sprintf("new_nickname=%s", body.Nickname))
	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}

func adminChangeCodeHandler(w http.ResponseWriter, r *http.Request) {
	var body struct {
		NewCode   string `json:"newCode"`
		AdminUUID string `json:"adminUuid"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid body.")
		return
	}
	if body.NewCode == "" || body.AdminUUID == "" {
		writeError(w, http.StatusBadRequest, "newCode and adminUuid required.")
		return
	}
	// Verify the admin exists and is admin
	user, err := db.GetUser(body.AdminUUID)
	if err != nil || user == nil || user.Role != "admin" {
		writeError(w, http.StatusForbidden, "Invalid administrator.")
		return
	}
	if err := db.ChangeAdminCode(body.AdminUUID, body.NewCode); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	logAudit(r, "admin_change_code", body.AdminUUID, "", "")
	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}

func listUsersHandler(w http.ResponseWriter, r *http.Request) {
	logAudit(r, "admin_list_users", "", "", "")
	users, err := db.GetAllUsers()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, users)
}

func updateNicknameHandler(w http.ResponseWriter, r *http.Request) {
	uuidParam := chi.URLParam(r, "uuid")
	logAudit(r, "admin_update_nickname", "", "", fmt.Sprintf("target_uuid=%s", uuidParam))

	var body struct {
		Nickname string `json:"nickname"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || strings.TrimSpace(body.Nickname) == "" {
		writeError(w, http.StatusBadRequest, "Nickname is required.")
		return
	}
	nick := strings.TrimSpace(body.Nickname)

	existing, err := db.GetUser(uuidParam)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if existing == nil {
		writeError(w, http.StatusNotFound, "User not found.")
		return
	}

	if err := db.UpdateUserNickname(uuidParam, nick); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Sync denormalized author names
	_ = db.SyncAuthorNicknames(uuidParam, nick)

	updated, _ := db.GetUser(uuidParam)
	writeJSON(w, http.StatusOK, updated)
}

func toggleUserStatusHandler(w http.ResponseWriter, r *http.Request) {
	uuidParam := chi.URLParam(r, "uuid")
	logAudit(r, "admin_toggle_user_status", "", "", fmt.Sprintf("target_uuid=%s", uuidParam))

	updated, err := db.UpdateUserStatus(uuidParam)
	if err != nil {
		writeError(w, http.StatusNotFound, "User not found.")
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

// ─── Post Handlers ──────────────────────────────────────────────────

func listPostsHandler(w http.ResponseWriter, r *http.Request) {
	weekStr := r.URL.Query().Get("week")
	week, err := strconv.Atoi(weekStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Week query parameter is required.")
		return
	}

	posts, err := db.GetPostsByWeek(week)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Mask deleted like original JS
	filtered := []map[string]interface{}{}
	for _, p := range posts {
		if p.Deleted {
			filtered = append(filtered, map[string]interface{}{
				"id":         p.ID,
				"title":      "삭제된 게시물입니다.",
				"author":     "-",
				"authorUuid": "-",
				"views":      0,
				"likes":      0,
				"dislikes":   0,
				"date":       p.Date,
				"content":    `[{"id":"del","type":"text","value":"삭제된 게시물입니다."}]`,
				"deleted":    true,
				"week":       p.Week,
			})
		} else {
			filtered = append(filtered, map[string]interface{}{
				"id":           p.ID,
				"title":        p.Title,
				"author":       p.Author,
				"authorUuid":   p.AuthorUUID,
				"views":        p.Views,
				"likes":        p.Likes,
				"dislikes":     p.Dislikes,
				"date":         p.Date,
				"content":      p.Content,
				"isNotion":     p.IsNotion,
				"deleted":      false,
				"week":         p.Week,
				"adminReplies": p.AdminReplies,
			})
		}
	}

	writeJSON(w, http.StatusOK, filtered)
}

func listAllPostsHandler(w http.ResponseWriter, r *http.Request) {
	logAudit(r, "admin_list_posts", "", "", "")
	posts, err := db.GetAllPosts()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, posts)
}

func getStatsHandler(w http.ResponseWriter, r *http.Request) {
	users, err := db.GetAllUsers()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	posts, err := db.GetAllPosts()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	reactions, err := db.GetAllReactions()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// 2. Find maximum week number from posts, reactions, and user signups, at least 1
	maxWeek := 1
	for _, p := range posts {
		if p.Week > maxWeek {
			maxWeek = p.Week
		}
	}
	for _, re := range reactions {
		if re.Week > maxWeek {
			maxWeek = re.Week
		}
	}
	for _, u := range users {
		t, err := time.Parse(time.RFC3339, u.CreatedAt)
		if err == nil {
			uw := getWeekForTime(t)
			if uw > maxWeek {
				maxWeek = uw
			}
		}
	}

	// 3. For each week from 1 to maxWeek, initialize stats
	type WeeklyStat struct {
		Week         int `json:"week"`
		VisitorCount int `json:"visitorCount"`
		PostCount    int `json:"postCount"`
	}
	weeklyStats := make([]WeeklyStat, maxWeek)
	for i := 0; i < maxWeek; i++ {
		weeklyStats[i] = WeeklyStat{
			Week:         i + 1,
			VisitorCount: 0,
			PostCount:    0,
		}
	}

	// Group active users per week
	activeUsersPerWeek := make(map[int]map[string]bool)
	for w := 1; w <= maxWeek; w++ {
		activeUsersPerWeek[w] = make(map[string]bool)
	}

	// User signup active status: count user signup in their signup week
	for _, u := range users {
		t, err := time.Parse(time.RFC3339, u.CreatedAt)
		if err == nil {
			uw := getWeekForTime(t)
			if uw <= maxWeek && uw > 0 {
				activeUsersPerWeek[uw][u.UUID] = true
			}
		}
	}

	// Post authors count as active in that week
	for _, p := range posts {
		if p.Week <= maxWeek && p.Week > 0 {
			activeUsersPerWeek[p.Week][p.AuthorUUID] = true
			weeklyStats[p.Week-1].PostCount++
		}
	}

	// Reacting users count as active in that week
	for _, re := range reactions {
		if re.Week <= maxWeek && re.Week > 0 {
			activeUsersPerWeek[re.Week][re.UserUUID] = true
		}
	}

	// Copy visitor count to weeklyStats
	for w := 1; w <= maxWeek; w++ {
		weeklyStats[w-1].VisitorCount = len(activeUsersPerWeek[w])
	}

	totalUsers := len(users)
	totalPosts := len(posts)

	response := map[string]interface{}{
		"totalUsers":  totalUsers,
		"totalPosts":  totalPosts,
		"weeklyStats": weeklyStats,
	}

	writeJSON(w, http.StatusOK, response)
}

func createPostHandler(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Title          string `json:"title"`
		Author         string `json:"author"`
		AuthorUUID     string `json:"authorUuid"`
		Content        string `json:"content"`
		Week           int    `json:"week"`
		Incognito      bool   `json:"incognito"`
		AuthorNickname string `json:"authorNickname"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON body.")
		return
	}
	if body.Title == "" || body.Author == "" || body.AuthorUUID == "" || body.Content == "" {
		writeError(w, http.StatusBadRequest, "Missing required fields.")
		return
	}

	currentWeek := getCurrentWeek()
	post, err := db.CreatePost(body.Title, body.Author, body.AuthorUUID, body.Content, currentWeek)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	// For privacy, if client indicates incognito mode, avoid logging the author UUID and nickname
	logUUID := body.AuthorUUID
	logNick := ""
	if body.Incognito {
		logUUID = ""
		logNick = ""
	}
	logAudit(r, "post_write", logUUID, logNick, fmt.Sprintf("post_id=%d title=%s week=%d", post.ID, body.Title, currentWeek))
	writeJSON(w, http.StatusCreated, post)
}

func viewPostHandler(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid post id.")
		return
	}
	post, err := db.IncrementView(id)
	if err != nil || post == nil {
		writeError(w, http.StatusNotFound, "Post not found.")
		return
	}
	writeJSON(w, http.StatusOK, post)
}

func adminReplyHandler(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid post id.")
		return
	}

	var body struct {
		AdminReply     string `json:"adminReply"`
		UserUUID       string `json:"userUuid"`
		Incognito      bool   `json:"incognito"`
		AuthorNickname string `json:"authorNickname"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid body.")
		return
	}

	// verify admin (this acts as "login" verification for admin actions)
	user, err := db.GetUser(body.UserUUID)
	if err != nil || user == nil || user.Role != "admin" {
		writeError(w, http.StatusForbidden, "관리자 태그를 받지 못하였습니다. 방장님께 여쭤보세요.")
		return
	}

	// When incognito is requested, avoid logging or storing the real nickname in audit logs.
	logNick := user.Nickname
	if body.Incognito {
		// omit nickname from audit for privacy
		logNick = ""
	}
	logAudit(r, "admin_reply", body.UserUUID, logNick, fmt.Sprintf("post_id=%d", id))

	reply := strings.TrimSpace(body.AdminReply)
	if reply == "" {
		writeError(w, http.StatusBadRequest, "Reply content cannot be empty.")
		return
	}

	// Decide the public-facing author nickname: use the client-provided authorNickname when incognito,
	// otherwise use the admin's real nickname from database.
	publicNick := user.Nickname
	if body.Incognito && strings.TrimSpace(body.AuthorNickname) != "" {
		publicNick = body.AuthorNickname
	}

	_, err = db.AddAdminReply(id, reply, body.UserUUID, publicNick)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to save reply.")
		return
	}

	post, err := db.GetPostByID(id)
	if err != nil || post == nil {
		writeError(w, http.StatusNotFound, "Post not found.")
		return
	}

	writeJSON(w, http.StatusOK, post)
}

func deleteAdminReplyHandler(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid reply id.")
		return
	}

	logAudit(r, "admin_delete_reply", "", "", fmt.Sprintf("reply_id=%d", id))

	if err := db.DeleteAdminReply(id); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to delete reply.")
		return
	}

	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}

func reportPostHandler(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid post id.")
		return
	}

	var body struct {
		ReporterUUID string `json:"reporterUuid"`
		Reason       string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON body.")
		return
	}

	body.ReporterUUID = strings.TrimSpace(body.ReporterUUID)
	body.Reason = strings.TrimSpace(body.Reason)

	if body.ReporterUUID == "" || body.Reason == "" {
		writeError(w, http.StatusBadRequest, "reporterUuid and reason are required.")
		return
	}

	report, err := db.CreateReport(id, body.ReporterUUID, body.Reason)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint") {
			writeError(w, http.StatusConflict, "이미 신고한 게시글입니다.")
			return
		}
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	logAudit(r, "post_report", body.ReporterUUID, "", fmt.Sprintf("post_id=%d reason=%s", id, body.Reason))
	writeJSON(w, http.StatusOK, report)
}

func toggleDeleteHandler(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid post id.")
		return
	}
	post, err := db.ToggleDeletePost(id)
	if err != nil || post == nil {
		writeError(w, http.StatusNotFound, "Post not found.")
		return
	}
	logAudit(r, "admin_toggle_delete", "", "", fmt.Sprintf("post_id=%d", id))
	writeJSON(w, http.StatusOK, post)
}

func permanentDeletePostHandler(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid post id.")
		return
	}
	if err := db.HardDeletePost(id); err != nil {
		writeError(w, http.StatusNotFound, "Post not found.")
		return
	}
	logAudit(r, "admin_hard_delete", "", "", fmt.Sprintf("post_id=%d", id))
	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// ─── Reaction Handlers ──────────────────────────────────────────────

func listReactionsHandler(w http.ResponseWriter, r *http.Request) {
	logAudit(r, "admin_list_reactions", "", "", "")
	reactions, err := db.GetAllReactions()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, reactions)
}

func addReactionHandler(w http.ResponseWriter, r *http.Request) {
	var body struct {
		PostID   int64  `json:"postId"`
		Week     int    `json:"week"`
		UserUUID string `json:"userUuid"`
		Type     string `json:"type"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid fields.")
		return
	}
	if body.PostID == 0 || body.Week == 0 || body.UserUUID == "" {
		writeError(w, http.StatusBadRequest, "Invalid fields.")
		return
	}
	valid := map[string]bool{"like": true, "dislike": true, "cancel_like": true, "cancel_dislike": true}
	if !valid[body.Type] {
		writeError(w, http.StatusBadRequest, "Invalid fields.")
		return
	}

	// Check post exists
	p, err := db.GetPostByID(body.PostID)
	if err != nil || p == nil {
		writeError(w, http.StatusNotFound, "Post not found.")
		return
	}

	// Check if the post's week is archived (i.e. older than current week)
	currentWeek := getCurrentWeek()
	if p.Week < currentWeek {
		writeError(w, http.StatusBadRequest, "아카이브된 게시글에는 추천/비추천을 할 수 없습니다.")
		return
	}

	// Get nickname
	user, _ := db.GetUser(body.UserUUID)
	userNick := "익명"
	if user != nil {
		userNick = user.Nickname
	}

	post, reactions, err := db.AddReaction(body.PostID, p.Week, body.UserUUID, userNick, body.Type)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"post":      post,
		"reactions": reactions,
	})
}

func deleteReactionHandler(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := db.DeleteReaction(id); err != nil {
		writeError(w, http.StatusNotFound, "Reaction not found.")
		return
	}

	// Note: unlike original we don't recalc here again as deleteReaction already did. Return success.
	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// ─── Settings Handlers ──────────────────────────────────────────────

func getSettingsHandler(w http.ResponseWriter, r *http.Request) {
	s, err := db.ReadSettings()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, s)
}

func updateSettingsHandler(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Apostles []string `json:"apostles"`
		Titles   []string `json:"titles"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid body.")
		return
	}

	cleanA := []string{}
	for _, a := range body.Apostles {
		if t := strings.TrimSpace(a); t != "" {
			cleanA = append(cleanA, t)
		}
	}
	cleanT := []string{}
	for _, t := range body.Titles {
		if tt := strings.TrimSpace(t); tt != "" {
			cleanT = append(cleanT, tt)
		}
	}

	if len(cleanA) == 0 || len(cleanT) == 0 {
		writeError(w, http.StatusBadRequest, "Apostles and titles lists cannot be empty.")
		return
	}

	s := db.Settings{Apostles: cleanA, Titles: cleanT}
	if err := db.WriteSettings(s); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, s)
}

// ─── Updates Handlers ──────────────────────────────────────────────────

func listUpdatesHandler(w http.ResponseWriter, r *http.Request) {
	// Check if this caller is an authorized admin
	isAdmin := false
	cookie, err := r.Cookie("loh_session_id")
	if err == nil && cookie != nil {
		user, err := db.GetAdminSession(cookie.Value)
		if err == nil && user != nil && user.Role == "admin" {
			isAdmin = true
		}
	}

	updates, err := db.GetAllUpdates()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Filter out unpublished updates for non-admins
	filtered := []db.UpdatePost{}
	for _, u := range updates {
		if u.Published || isAdmin {
			filtered = append(filtered, u)
		}
	}

	writeJSON(w, http.StatusOK, filtered)
}

func upsertUpdateHandler(w http.ResponseWriter, r *http.Request) {
	var body db.UpdatePost
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid body.")
		return
	}

	if body.ID == "" {
		writeError(w, http.StatusBadRequest, "Update ID is required.")
		return
	}

	if err := db.UpsertUpdate(body); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	logAudit(r, "admin_upsert_update", "", "", fmt.Sprintf("update_id=%s week=%d title=%s", body.ID, body.Week, body.Title))
	writeJSON(w, http.StatusOK, body)
}

func deleteUpdateHandler(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "Missing update ID.")
		return
	}

	if err := db.DeleteUpdate(id); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	logAudit(r, "admin_delete_update", "", "", fmt.Sprintf("update_id=%s", id))
	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// --- IP Audit Log Viewing (for frontend) ---

type AuditLogEntry struct {
	Timestamp    string `json:"timestamp"`
	IP           string `json:"ip"`
	Action       string `json:"action"`
	UserUUID     string `json:"userUuid"`
	UserNickname string `json:"userNickname"`
	Details      string `json:"details"`
}

func parseAuditLogLine(line string) *AuditLogEntry {
	// Lines are like: 2026/06/21 12:34:56 ip=1.2.3.4 action=foo user_uuid=bar details="post_id=123 title=hello world"
	parts := strings.SplitN(line, " ", 3)
	if len(parts) < 3 {
		return nil
	}
	timestamp := parts[0] + " " + parts[1]
	rest := parts[2]

	entry := &AuditLogEntry{Timestamp: timestamp}

	// Find positions of known keys
	ipIdx := strings.Index(rest, "ip=")
	actionIdx := strings.Index(rest, "action=")
	userIdx := strings.Index(rest, "user_uuid=")
	nickIdx := strings.Index(rest, "user_nickname=")
	detailsIdx := strings.Index(rest, "details=")

	if ipIdx != -1 {
		end := len(rest)
		if actionIdx > ipIdx && actionIdx < end {
			end = actionIdx
		}
		if userIdx > ipIdx && userIdx < end {
			end = userIdx
		}
		if nickIdx > ipIdx && nickIdx < end {
			end = nickIdx
		}
		if detailsIdx > ipIdx && detailsIdx < end {
			end = detailsIdx
		}
		entry.IP = strings.TrimSpace(rest[ipIdx+3 : end])
	}
	if actionIdx != -1 {
		end := len(rest)
		if userIdx > actionIdx && userIdx < end {
			end = userIdx
		}
		if nickIdx > actionIdx && nickIdx < end {
			end = nickIdx
		}
		if detailsIdx > actionIdx && detailsIdx < end {
			end = detailsIdx
		}
		entry.Action = strings.TrimSpace(rest[actionIdx+7 : end])
	}
	if userIdx != -1 {
		end := len(rest)
		if nickIdx > userIdx && nickIdx < end {
			end = nickIdx
		}
		if detailsIdx > userIdx && detailsIdx < end {
			end = detailsIdx
		}
		entry.UserUUID = strings.TrimSpace(rest[userIdx+10 : end])
	}
	if nickIdx != -1 {
		end := len(rest)
		if detailsIdx > nickIdx && detailsIdx < end {
			end = detailsIdx
		}
		entry.UserNickname = strings.TrimSpace(rest[nickIdx+14 : end])
	}
	if detailsIdx != -1 {
		d := rest[detailsIdx+8:]
		d = strings.Trim(d, `" `)
		entry.Details = d
	}

	if entry.IP == "" {
		return nil
	}
	return entry
}

func listAuditLogsHandler(w http.ResponseWriter, r *http.Request) {
	logs := []AuditLogEntry{}

	data, err := os.ReadFile("data/audit.log")
	if err != nil {
		// File may not exist yet, return empty
		writeJSON(w, http.StatusOK, logs)
		return
	}

	lines := strings.Split(string(data), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		if entry := parseAuditLogLine(line); entry != nil {
			logs = append(logs, *entry)
		}
	}

	// Return newest first
	for i, j := 0, len(logs)-1; i < j; i, j = i+1, j-1 {
		logs[i], logs[j] = logs[j], logs[i]
	}

	writeJSON(w, http.StatusOK, logs)
}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	// Limit request body to 50MB (allowing videos)
	r.Body = http.MaxBytesReader(w, r.Body, 50<<20)
	if err := r.ParseMultipartForm(50 << 20); err != nil {
		writeError(w, http.StatusBadRequest, "파일 업로드 용량이 초과되었습니다. (최대 50MB)")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "업로드할 파일을 찾을 수 없습니다.")
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	allowed := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".webp": true,
		".gif":  true,
		".svg":  true,
		".jfif": true,
		".mp4":  true,
		".webm": true,
	}
	if !allowed[ext] {
		writeError(w, http.StatusBadRequest, "허용되지 않는 파일 형식입니다. (지원 형식: 이미지, GIF 및 mp4/webm 비디오)")
		return
	}

	// Double-check image file size limit of 6MB on server
	isImage := ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".webp" || ext == ".gif" || ext == ".svg" || ext == ".jfif"
	if isImage && header.Size > 6*1024*1024 {
		writeError(w, http.StatusBadRequest, "이미지 크기는 최대 6MB까지 업로드 가능합니다.")
		return
	}

	u, err := uuid.NewRandom()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "UUID 생성에 실패했습니다.")
		return
	}

	// Securely write file with UUID filename
	newFilename := u.String() + ext
	savePath := filepath.Join("./uploads", newFilename)

	out, err := os.Create(savePath)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "파일 저장 파일 생성 실패")
		return
	}
	defer out.Close()

	if _, err := io.Copy(out, file); err != nil {
		writeError(w, http.StatusInternalServerError, "파일 쓰기 실패")
		return
	}

	publicURL := fmt.Sprintf("/api/uploads/%s", newFilename)
	writeJSON(w, http.StatusOK, map[string]string{
		"url": publicURL,
	})
}

func permanentDeleteUserHandler(w http.ResponseWriter, r *http.Request) {
	uuidParam := chi.URLParam(r, "uuid")

	target, err := db.GetUser(uuidParam)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if target == nil {
		writeError(w, http.StatusNotFound, "User not found.")
		return
	}
	if target.Role == "admin" {
		writeError(w, http.StatusForbidden, "Cannot delete an administrator account.")
		return
	}

	if err := db.HardDeleteUser(uuidParam); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	logAudit(r, "admin_delete_user_permanent", "", "", fmt.Sprintf("target_uuid=%s target_nickname=%s", uuidParam, target.Nickname))
	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// --- Week Helper Functions ---

func getWeekForTime(t time.Time) int {
	// Service started on 2026-06-22 00:00:00 KST
	// which is 2026-06-21 15:00:00 UTC.
	// Adjust the input time to KST (+9 hours) to work timezone-independently.
	tKST := t.UTC().Add(9 * time.Hour)
	startKST := time.Date(2026, 6, 22, 0, 0, 0, 0, time.UTC)

	diff := tKST.Sub(startKST)
	if diff < 0 {
		return 1
	}
	days := diff.Hours() / 24
	return int(days/7) + 1
}

func getCurrentWeek() int {
	return getWeekForTime(time.Now())
}

func currentWeekHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"currentWeek": getCurrentWeek(),
	})
}
