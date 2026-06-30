package db

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	_ "modernc.org/sqlite"
)

const (
	DBFile    = "data/letterofheart.db"
	AdminUUID = "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f90"
	AdminNick = "도둑이야"
	AdminCode = "10293847"
)

var DB *sql.DB

// Data models
type Settings struct {
	Apostles []string `json:"apostles"`
	Titles   []string `json:"titles"`
}

type User struct {
	UUID      string `json:"uuid"`
	Nickname  string `json:"nickname"`
	Role      string `json:"role"`
	Status    string `json:"status"`
	CreatedAt string `json:"createdAt"`
}

type AdminReply struct {
	ID             int64  `json:"id"`
	PostID         int64  `json:"postId"`
	AuthorUUID     string `json:"authorUuid"`
	AuthorNickname string `json:"authorNickname"`
	Content        string `json:"content"`
	CreatedAt      string `json:"createdAt"`
}

type Report struct {
	ID           int64  `json:"id"`
	PostID       int64  `json:"postId"`
	ReporterUUID string `json:"reporterUuid"`
	Reason       string `json:"reason"`
	Date         string `json:"date"`
}

type Post struct {
	ID           int64        `json:"id"`
	Title        string       `json:"title"`
	Author       string       `json:"author"`
	AuthorUUID   string       `json:"authorUuid"`
	Views        int          `json:"views"`
	Likes        int          `json:"likes"`
	Dislikes     int          `json:"dislikes"`
	Date         string       `json:"date"`
	Content      string       `json:"content"`
	IsNotion     bool         `json:"isNotion"`
	Deleted      bool         `json:"deleted"`
	Week         int          `json:"week"`
	AdminReplies []AdminReply `json:"adminReplies,omitempty"`
	Reports      []Report     `json:"reports,omitempty"`
}

type Reaction struct {
	ID           string `json:"id"`
	PostID       int64  `json:"postId"`
	Week         int    `json:"week"`
	UserUUID     string `json:"userUuid"`
	UserNickname string `json:"userNickname"`
	Type         string `json:"type"`
	Date         string `json:"date"`
}

type TooltipEntry struct {
	Keyword string `json:"keyword"`
	Tip     string `json:"tip"`
}

type SkillInfo struct {
	Name     string `json:"name"`
	Desc     string `json:"desc"`
	ImageURL string `json:"imageUrl,omitempty"`
}

type CloneRotation struct {
	Stages string   `json:"stages"`
	Before []string `json:"before"`
	After  []string `json:"after"`
}

type ShortcutEntry struct {
	Label string `json:"label"`
	URL   string `json:"url"`
}

type PvpGroupRule struct {
	Period    string `json:"period"`
	GroupName string `json:"groupName"`
	MinDays   int    `json:"minDays"`
	MaxDays   int    `json:"maxDays"`
}

type ContentBlock struct {
	Type             string          `json:"type"`
	Content          string          `json:"content,omitempty"`
	Tooltips         []TooltipEntry  `json:"tooltips,omitempty"`
	Title            string          `json:"title,omitempty"`
	Body             string          `json:"body,omitempty"`
	Label            string          `json:"label,omitempty"`
	URL              string          `json:"url,omitempty"`
	Desc             string          `json:"desc,omitempty"`
	Style            string          `json:"style,omitempty"`
	Items            []string        `json:"items,omitempty"`
	Name             string          `json:"name,omitempty"`
	Rarity           string          `json:"rarity,omitempty"`
	Personality      string          `json:"personality,omitempty"`
	Race             string          `json:"race,omitempty"`
	Role             string          `json:"role,omitempty"`
	AttackType       string          `json:"attackType,omitempty"`
	Position         string          `json:"position,omitempty"`
	ImageURL         string          `json:"imageUrl,omitempty"`
	NormalSkill      *SkillInfo      `json:"normalSkill,omitempty"`
	LowSkill         *SkillInfo      `json:"lowSkill,omitempty"`
	HighSkill        *SkillInfo      `json:"highSkill,omitempty"`
	CostumeImageURL  string          `json:"costumeImageUrl,omitempty"`
	ThemeTheaterURL  string          `json:"themeTheaterUrl,omitempty"`
	PickupEventURL   string          `json:"pickupEventUrl,omitempty"`
	Skills           string          `json:"skills,omitempty"`
	Character        string          `json:"character,omitempty"`
	Rotations        []CloneRotation `json:"rotations,omitempty"`
	Shortcuts        []ShortcutEntry `json:"shortcuts,omitempty"`
	StandardDate     string          `json:"standardDate,omitempty"`
	SeasonPeriod     string          `json:"seasonPeriod,omitempty"`
	SettlementTime   string          `json:"settlementTime,omitempty"`
	VocationApostles string          `json:"vocationApostles,omitempty"`
	GroupRules       []PvpGroupRule  `json:"groupRules,omitempty"`
	BotInfo          string          `json:"botInfo,omitempty"`
	EldainLimitDesc  string          `json:"eldainLimitDesc,omitempty"`
	HighSkillDesc    string          `json:"highSkillDesc,omitempty"`
}

type UpdatePost struct {
	ID        string         `json:"id"`
	Week      int            `json:"week"`
	Date      string         `json:"date"`
	Category  string         `json:"category"`
	Title     string         `json:"title"`
	Summary   string         `json:"summary"`
	Published bool           `json:"published"`
	Blocks    []ContentBlock `json:"blocks"`
}


func InitDB() error {
	if err := os.MkdirAll("data", 0755); err != nil {
		return err
	}

	dbPath := filepath.Join(".", DBFile)
	var err error
	DB, err = sql.Open("sqlite", dbPath)
	if err != nil {
		return fmt.Errorf("open sqlite: %w", err)
	}

	// Good defaults for sqlite in this app
	DB.SetMaxOpenConns(1) // sqlite best with single conn for simplicity
	DB.SetMaxIdleConns(1)
	DB.SetConnMaxLifetime(0)

	if err := DB.Ping(); err != nil {
		return fmt.Errorf("ping db: %w", err)
	}

	// Enable foreign keys and other pragmas
	_, _ = DB.Exec(`PRAGMA foreign_keys = ON;`)
	_, _ = DB.Exec(`PRAGMA journal_mode = WAL;`)

	if err := createTables(); err != nil {
		return err
	}

	// Migration for admin_code (ignore if column exists)
	_, _ = DB.Exec(`ALTER TABLE users ADD COLUMN admin_code TEXT`)

	if err := seedInitialData(); err != nil {
		return err
	}

	if err := migrateExistingReplies(); err != nil {
		fmt.Printf("warning: failed to migrate old admin replies: %v\n", err)
	}

	return nil
}

func createTables() error {
	_, err := DB.Exec(`
	CREATE TABLE IF NOT EXISTS users (
		uuid TEXT PRIMARY KEY,
		nickname TEXT UNIQUE NOT NULL,
		role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
		status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'banned')),
		created_at TEXT NOT NULL,
		admin_code TEXT
	);

	CREATE TABLE IF NOT EXISTS posts (
		id INTEGER PRIMARY KEY,
		title TEXT NOT NULL,
		author TEXT NOT NULL,
		author_uuid TEXT NOT NULL,
		views INTEGER NOT NULL DEFAULT 0,
		likes INTEGER NOT NULL DEFAULT 0,
		dislikes INTEGER NOT NULL DEFAULT 0,
		date TEXT NOT NULL,
		content TEXT NOT NULL,
		is_notion INTEGER NOT NULL DEFAULT 0,
		deleted INTEGER NOT NULL DEFAULT 0,
		week INTEGER NOT NULL,
		admin_reply TEXT,
		admin_reply_author_uuid TEXT,
		admin_reply_author TEXT
	);

	CREATE TABLE IF NOT EXISTS reactions (
		id TEXT PRIMARY KEY,
		post_id INTEGER NOT NULL,
		week INTEGER NOT NULL,
		user_uuid TEXT NOT NULL,
		user_nickname TEXT,
		type TEXT NOT NULL CHECK(type IN ('like','dislike')),
		date TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS settings (
		id INTEGER PRIMARY KEY CHECK(id = 1),
		apostles TEXT NOT NULL,
		titles TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS admin_sessions (
		id TEXT PRIMARY KEY,
		user_uuid TEXT NOT NULL,
		expires_at TEXT NOT NULL,
		FOREIGN KEY(user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS admin_replies (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		post_id INTEGER NOT NULL,
		author_uuid TEXT NOT NULL,
		author_nickname TEXT NOT NULL,
		content TEXT NOT NULL,
		created_at TEXT NOT NULL,
		FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
		FOREIGN KEY(author_uuid) REFERENCES users(uuid) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS reports (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		post_id INTEGER NOT NULL,
		reporter_uuid TEXT NOT NULL,
		reason TEXT NOT NULL,
		date TEXT NOT NULL,
		FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
		UNIQUE(post_id, reporter_uuid)
	);

	CREATE TABLE IF NOT EXISTS updates (
		id TEXT PRIMARY KEY,
		week INTEGER NOT NULL,
		date TEXT NOT NULL,
		category TEXT NOT NULL,
		title TEXT NOT NULL,
		summary TEXT NOT NULL,
		published INTEGER NOT NULL DEFAULT 0,
		blocks TEXT NOT NULL
	);
	`)
	return err
}

func seedInitialData() error {
	// Seed admin user - by nickname to be robust
	var exists int
	err := DB.QueryRow(`SELECT COUNT(1) FROM users WHERE nickname = ?`, AdminNick).Scan(&exists)
	if err != nil {
		return err
	}
	now := time.Now().UTC().Format(time.RFC3339)
	hashedCode, _ := hashCode(AdminCode)
	if exists == 0 {
		_, err = DB.Exec(`INSERT INTO users (uuid, nickname, role, status, created_at, admin_code) VALUES (?, ?, 'admin', 'active', ?, ?)`,
			AdminUUID, AdminNick, now, hashedCode)
		if err != nil {
			return err
		}
	} else {
		// Ensure the code is up to date (e.g. after changes)
		_, err = DB.Exec(`UPDATE users SET uuid = ?, admin_code = ?, role = 'admin' WHERE nickname = ?`,
			AdminUUID, hashedCode, AdminNick)
		if err != nil {
			return err
		}
	}

	// Seed settings if none
	err = DB.QueryRow(`SELECT COUNT(1) FROM settings`).Scan(&exists)
	if err != nil {
		return err
	}
	if exists == 0 {
		defaultApostles := []string{
			"가비아", "그윈", "나이아", "네르", "네티", "다야", "델리아", "디아나", "라이카", "란",
			"레비", "레이지", "레테", "로네", "롤렛", "루드", "루포", "리뉴아", "리스티", "리온",
			"리츠", "리코타", "림", "마고", "마리", "마에스트로", "마요", "마카샤", "메죵", "멜루나",
			"모모", "뮤트", "미로", "밍스", "사리", "샤샤", "셀리네", "셰럼", "셰이디", "슈로",
			"슈팡", "스노키", "스피키", "스패럿", "냉장고", "시스트", "시온", "시저", "실라", "실비아",
			"실피르", "아네트", "아라그리아", "아르코", "아멜리아", "아사나", "아야", "아이시아", "아일라",
			"알레트", "앨리스", "에르핀", "에슈르", "에스피", "에피카", "엘레나", "오르", "오팔", "요미",
			"우로스", "우이", "유미미", "이드", "이프리트", "잉클", "영춘", "제이드", "죠안", "쥬비",
			"쵸피", "카렌", "칸나", "칸타", "캐시", "캬롯", "코미", "큐이", "크레페", "클로에",
			"키디언", "키샤", "타이다", "티그", "파트라", "포셔", "폴랑", "프리클", "피라", "피코라",
			"하이디", "헤일리", "힐데",
		}
		defaultTitles := []string{
			"지휘관", "대리인", "추종자", "방랑자", "수호자", "하수인", "영웅", "집문서", "메이드",
			"멋진근육", "이쁜외모", "뚝배기", "애착인형", "산만한성격", "머리채잡기장인", "어그로꾼",
			"발목잡이", "악마의재능", "수학익힘책", "원효대사해골물", "미쳤지개볼빙", "고양이",
			"머쓱타드", "어깨춤을추게하는노래", "모에모에뀽", "다크넷닉네임", "말랑말랑한조끼",
			"제노사이드커터", "슈슈슈슉글러브", "명예훈장", "밑장빼기9단", "케챱도둑", "화장실문지기",
			"수다쟁이", "무쇠팔뚝", "이마에침뱉기장인", "터줏대감", "왼쪽볼따구", "오른쪽볼따구",
			"교주바라기", "사랑꾼", "정실", "바라기", "하트", "왕자", "공주", "남편", "내아내임",
			"신랑", "신부", "머플러", "버터쿠키", "호두까기인형", "코코넛밀크", "빨간책", "열정",
		}
		apostlesJSON, _ := json.Marshal(defaultApostles)
		titlesJSON, _ := json.Marshal(defaultTitles)
		_, err = DB.Exec(`INSERT INTO settings (id, apostles, titles) VALUES (1, ?, ?)`, string(apostlesJSON), string(titlesJSON))
		if err != nil {
			return err
		}
	}
	return nil
}

func ReadSettings() (Settings, error) {
	var apostlesStr, titlesStr string
	err := DB.QueryRow(`SELECT apostles, titles FROM settings WHERE id = 1`).Scan(&apostlesStr, &titlesStr)
	if err != nil {
		return Settings{}, err
	}
	var s Settings
	if err := json.Unmarshal([]byte(apostlesStr), &s.Apostles); err != nil {
		s.Apostles = []string{}
	}
	if err := json.Unmarshal([]byte(titlesStr), &s.Titles); err != nil {
		s.Titles = []string{}
	}
	return s, nil
}

func WriteSettings(s Settings) error {
	apostlesJSON, _ := json.Marshal(s.Apostles)
	titlesJSON, _ := json.Marshal(s.Titles)
	_, err := DB.Exec(`UPDATE settings SET apostles = ?, titles = ? WHERE id = 1`, string(apostlesJSON), string(titlesJSON))
	return err
}

func GetUser(uuid string) (*User, error) {
	u := &User{}
	err := DB.QueryRow(`SELECT uuid, nickname, role, status, created_at FROM users WHERE uuid = ?`, uuid).
		Scan(&u.UUID, &u.Nickname, &u.Role, &u.Status, &u.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}

func GetAdminByNicknameAndCode(nickname, code string) (*User, error) {
	var u User
	var storedCode string
	err := DB.QueryRow(`SELECT uuid, nickname, role, status, created_at, admin_code FROM users WHERE nickname = ? AND role = 'admin'`, nickname).
		Scan(&u.UUID, &u.Nickname, &u.Role, &u.Status, &u.CreatedAt, &storedCode)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if !verifyCode(storedCode, code) {
		return nil, nil
	}
	return &u, nil
}

func hashCode(code string) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(code), bcrypt.DefaultCost)
	return string(hashed), err
}

func verifyCode(hashed, code string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hashed), []byte(code)) == nil
}

func RegisterAdmin(nickname, code string) error {
	hashed, err := hashCode(code)
	if err != nil {
		return err
	}
	uid := generateUUID()
	now := time.Now().UTC().Format(time.RFC3339)
	_, err = DB.Exec(`INSERT INTO users (uuid, nickname, role, status, created_at, admin_code) VALUES (?, ?, 'admin', 'active', ?, ?)`,
		uid, nickname, now, hashed)
	return err
}

func ChangeAdminCode(uuid, newCode string) error {
	hashed, err := hashCode(newCode)
	if err != nil {
		return err
	}
	_, err = DB.Exec(`UPDATE users SET admin_code = ? WHERE uuid = ? AND role = 'admin'`, hashed, uuid)
	return err
}

func GetAllUsers() (map[string]User, error) {
	rows, err := DB.Query(`SELECT uuid, nickname, role, status, created_at FROM users ORDER BY created_at`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := make(map[string]User)
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.UUID, &u.Nickname, &u.Role, &u.Status, &u.CreatedAt); err != nil {
			return nil, err
		}
		users[u.UUID] = u
	}
	return users, nil
}

func CreateUser(uuid, nickname string) (*User, error) {
	// If uuid provided and exists, return existing
	if uuid != "" {
		if u, _ := GetUser(uuid); u != nil {
			return u, nil
		}
	}

	// Generate uuid if needed
	if uuid == "" {
		uuid = generateUUID()
	}

	// Generate nickname if needed
	if nickname == "" {
		nickname = generateNickname(uuid)
	}

	now := time.Now().UTC().Format(time.RFC3339)

	_, err := DB.Exec(`INSERT INTO users (uuid, nickname, role, status, created_at) VALUES (?, ?, ?, 'active', ?)`,
		uuid, nickname, "user", now)
	if err != nil {
		// If unique nickname conflict (very rare), append random and retry once
		if isUniqueViolation(err) {
			nickname = nickname + fmt.Sprintf("%d", time.Now().Unix()%1000)
			_, err = DB.Exec(`INSERT INTO users (uuid, nickname, role, status, created_at) VALUES (?, ?, ?, 'active', ?)`,
				uuid, nickname, "user", now)
		}
		if err != nil {
			return nil, err
		}
	}

	u, _ := GetUser(uuid)
	if u != nil {
		return u, nil
	}
	return &User{UUID: uuid, Nickname: nickname, Role: "user", Status: "active", CreatedAt: now}, nil
}

func isUniqueViolation(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "UNIQUE") || strings.Contains(msg, "unique constraint")
}

// generateNickname creates a unique {apostle}의{title} not already used
func generateNickname(proposedUUID string) string {
	settings, err := ReadSettings()
	if err != nil || len(settings.Apostles) == 0 || len(settings.Titles) == 0 {
		// Fallback
		return "익명의작가"
	}

	// collect existing nicknames
	rows, err := DB.Query(`SELECT nickname FROM users`)
	if err != nil {
		return "익명의작가"
	}
	defer rows.Close()
	existing := make(map[string]bool)
	for rows.Next() {
		var n string
		rows.Scan(&n)
		existing[n] = true
	}

	attempts := 0
	for attempts < 100 {
		apostle := settings.Apostles[rand.Intn(len(settings.Apostles))]
		title := settings.Titles[rand.Intn(len(settings.Titles))]
		cand := apostle + "의" + title
		if !existing[cand] {
			return cand
		}
		attempts++
		if attempts > 50 {
			cand += fmt.Sprintf("%d", rand.Intn(1000))
			if !existing[cand] {
				return cand
			}
		}
	}
	// last resort
	return "익명의작가" + fmt.Sprintf("%d", time.Now().Unix()%10000)
}

func GenerateNickname() string {
	// Expose server-side nickname generation for callers outside the db package
	return generateNickname("")
}

func UpdateUserNickname(uuid, nickname string) error {
	_, err := DB.Exec(`UPDATE users SET nickname = ? WHERE uuid = ?`, nickname, uuid)
	return err
}

func UpdateUserStatus(uuid string) (*User, error) {
	u, err := GetUser(uuid)
	if err != nil || u == nil {
		return nil, err
	}
	newStatus := "active"
	if u.Status == "active" {
		newStatus = "banned"
	}
	_, err = DB.Exec(`UPDATE users SET status = ? WHERE uuid = ?`, newStatus, uuid)
	if err != nil {
		return nil, err
	}
	u.Status = newStatus
	return u, nil
}

func HardDeleteUser(uuid string) error {
	_, err := DB.Exec(`DELETE FROM users WHERE uuid = ?`, uuid)
	return err
}

// Post operations

func GetPostByID(id int64) (*Post, error) {
	p := &Post{}
	var isNotion, deleted int
	var dummyReply, dummyUUID, dummyAuthor string
	err := DB.QueryRow(`SELECT id, title, author, author_uuid, views, likes, dislikes, date, content, is_notion, deleted, week,
		COALESCE(admin_reply,''), COALESCE(admin_reply_author_uuid,''), COALESCE(admin_reply_author,'')
		FROM posts WHERE id = ?`, id).
		Scan(&p.ID, &p.Title, &p.Author, &p.AuthorUUID, &p.Views, &p.Likes, &p.Dislikes, &p.Date, &p.Content,
			&isNotion, &deleted, &p.Week, &dummyReply, &dummyUUID, &dummyAuthor)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	p.IsNotion = isNotion == 1
	p.Deleted = deleted == 1

	repliesMap, err := GetAdminRepliesForPosts([]int64{p.ID})
	if err == nil {
		p.AdminReplies = repliesMap[p.ID]
	}
	if p.AdminReplies == nil {
		p.AdminReplies = []AdminReply{}
	}

	return p, nil
}

func GetPostsByWeek(week int) ([]Post, error) {
	rows, err := DB.Query(`SELECT id, title, author, author_uuid, views, likes, dislikes, date, content, is_notion, deleted, week,
		COALESCE(admin_reply,''), COALESCE(admin_reply_author_uuid,''), COALESCE(admin_reply_author,'')
		FROM posts WHERE week = ? ORDER BY id DESC`, week)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanPosts(rows)
}

func GetAllPosts() ([]Post, error) {
	rows, err := DB.Query(`SELECT id, title, author, author_uuid, views, likes, dislikes, date, content, is_notion, deleted, week,
		COALESCE(admin_reply,''), COALESCE(admin_reply_author_uuid,''), COALESCE(admin_reply_author,'')
		FROM posts ORDER BY id DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanPosts(rows)
}

func scanPosts(rows *sql.Rows) ([]Post, error) {
	var posts []Post
	var postIDs []int64
	for rows.Next() {
		var p Post
		var isNotion, deleted int
		var dummyReply, dummyUUID, dummyAuthor string
		if err := rows.Scan(&p.ID, &p.Title, &p.Author, &p.AuthorUUID, &p.Views, &p.Likes, &p.Dislikes,
			&p.Date, &p.Content, &isNotion, &deleted, &p.Week, &dummyReply, &dummyUUID, &dummyAuthor); err != nil {
			return nil, err
		}
		p.IsNotion = isNotion == 1
		p.Deleted = deleted == 1
		posts = append(posts, p)
		postIDs = append(postIDs, p.ID)
	}
	if posts == nil {
		posts = []Post{}
		return posts, nil
	}

	repliesMap, err := GetAdminRepliesForPosts(postIDs)
	if err == nil {
		for i, p := range posts {
			posts[i].AdminReplies = repliesMap[p.ID]
			if posts[i].AdminReplies == nil {
				posts[i].AdminReplies = []AdminReply{}
			}
		}
	} else {
		for i := range posts {
			posts[i].AdminReplies = []AdminReply{}
		}
	}

	reportsMap, err := GetReportsForPosts(postIDs)
	if err == nil {
		for i, p := range posts {
			posts[i].Reports = reportsMap[p.ID]
			if posts[i].Reports == nil {
				posts[i].Reports = []Report{}
			}
		}
	} else {
		for i := range posts {
			posts[i].Reports = []Report{}
		}
	}

	return posts, nil
}

func CreatePost(title, author, authorUUID, content string, week int) (*Post, error) {
	now := time.Now()
	dateStr := fmt.Sprintf("%d-%02d-%02d %02d:%02d",
		now.Year(), now.Month(), now.Day(), now.Hour(), now.Minute())

	id := now.UnixMilli()

	p := &Post{
		ID:         id,
		Title:      title,
		Author:     author,
		AuthorUUID: authorUUID,
		Views:      0,
		Likes:      0,
		Dislikes:   0,
		Date:       dateStr,
		Content:    content,
		IsNotion:   false,
		Deleted:    false,
		Week:       week,
	}

	_, err := DB.Exec(`INSERT INTO posts (id, title, author, author_uuid, views, likes, dislikes, date, content, is_notion, deleted, week)
		VALUES (?, ?, ?, ?, 0, 0, 0, ?, ?, 0, 0, ?)`,
		p.ID, p.Title, p.Author, p.AuthorUUID, p.Date, p.Content, p.Week)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func IncrementView(id int64) (*Post, error) {
	p, err := GetPostByID(id)
	if err != nil || p == nil {
		return nil, err
	}
	_, err = DB.Exec(`UPDATE posts SET views = views + 1 WHERE id = ?`, id)
	if err != nil {
		return nil, err
	}
	p.Views++
	return p, nil
}

func AddAdminReply(postID int64, content, authorUUID, authorNickname string) (*AdminReply, error) {
	now := time.Now().Format("2006-01-02 15:04")
	res, err := DB.Exec(`INSERT INTO admin_replies (post_id, author_uuid, author_nickname, content, created_at) VALUES (?, ?, ?, ?, ?)`,
		postID, authorUUID, authorNickname, content, now)
	if err != nil {
		return nil, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}
	return &AdminReply{
		ID:             id,
		PostID:         postID,
		AuthorUUID:     authorUUID,
		AuthorNickname: authorNickname,
		Content:        content,
		CreatedAt:      now,
	}, nil
}

func DeleteAdminReply(replyID int64) error {
	_, err := DB.Exec(`DELETE FROM admin_replies WHERE id = ?`, replyID)
	return err
}

func GetAdminRepliesForPosts(postIDs []int64) (map[int64][]AdminReply, error) {
	replies := make(map[int64][]AdminReply)
	if len(postIDs) == 0 {
		return replies, nil
	}

	placeholders := make([]string, len(postIDs))
	args := make([]interface{}, len(postIDs))
	for i, id := range postIDs {
		placeholders[i] = "?"
		args[i] = id
	}
	query := fmt.Sprintf(`
		SELECT id, post_id, author_uuid, author_nickname, content, created_at 
		FROM admin_replies 
		WHERE post_id IN (%s) 
		ORDER BY id ASC`, strings.Join(placeholders, ","))

	rows, err := DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var r AdminReply
		if err := rows.Scan(&r.ID, &r.PostID, &r.AuthorUUID, &r.AuthorNickname, &r.Content, &r.CreatedAt); err != nil {
			return nil, err
		}
		replies[r.PostID] = append(replies[r.PostID], r)
	}
	return replies, nil
}

func migrateExistingReplies() error {
	rows, err := DB.Query(`SELECT id, admin_reply, admin_reply_author_uuid, admin_reply_author, date FROM posts WHERE admin_reply IS NOT NULL AND admin_reply != ''`)
	if err != nil {
		return nil
	}
	defer rows.Close()

	type OldReply struct {
		PostID     int64
		Reply      string
		AuthorUUID string
		AuthorNick string
		Date       string
	}
	var oldReplies []OldReply
	for rows.Next() {
		var o OldReply
		if err := rows.Scan(&o.PostID, &o.Reply, &o.AuthorUUID, &o.AuthorNick, &o.Date); err == nil {
			oldReplies = append(oldReplies, o)
		}
	}

	for _, o := range oldReplies {
		var exists int
		_ = DB.QueryRow(`SELECT COUNT(1) FROM admin_replies WHERE post_id = ? AND author_uuid = ? AND content = ?`,
			o.PostID, o.AuthorUUID, o.Reply).Scan(&exists)
		if exists == 0 {
			_, err = DB.Exec(`INSERT INTO admin_replies (post_id, author_uuid, author_nickname, content, created_at) VALUES (?, ?, ?, ?, ?)`,
				o.PostID, o.AuthorUUID, o.AuthorNick, o.Reply, o.Date)
			if err != nil {
				log.Printf("error migrating old reply for post %d: %v", o.PostID, err)
			}
		}
	}

	_, _ = DB.Exec(`UPDATE posts SET admin_reply = NULL, admin_reply_author_uuid = NULL, admin_reply_author = NULL`)
	return nil
}

func ToggleDeletePost(id int64) (*Post, error) {
	p, err := GetPostByID(id)
	if err != nil || p == nil {
		return nil, err
	}
	newDel := 0
	if !p.Deleted {
		newDel = 1
	}
	_, err = DB.Exec(`UPDATE posts SET deleted = ? WHERE id = ?`, newDel, id)
	if err != nil {
		return nil, err
	}
	p.Deleted = newDel == 1
	return p, nil
}

func HardDeletePost(id int64) error {
	_, err := DB.Exec(`DELETE FROM reactions WHERE post_id = ?`, id)
	if err != nil {
		return err
	}
	_, err = DB.Exec(`DELETE FROM posts WHERE id = ?`, id)
	return err
}

// Reaction + post update logic
func AddReaction(postID int64, week int, userUUID, userNickname, reactionType string) (Post, []Reaction, error) {
	// transaction
	tx, err := DB.Begin()
	if err != nil {
		return Post{}, nil, err
	}
	defer tx.Rollback()

	// Remove any existing reaction of this user for this post
	_, _ = tx.Exec(`DELETE FROM reactions WHERE post_id = ? AND user_uuid = ?`, postID, userUUID)

	if reactionType == "like" || reactionType == "dislike" {
		id := fmt.Sprintf("%d%d", time.Now().UnixNano(), rand.Intn(99999))
		date := time.Now().UTC().Format(time.RFC3339)
		_, err = tx.Exec(`INSERT INTO reactions (id, post_id, week, user_uuid, user_nickname, type, date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
			id, postID, week, userUUID, userNickname, reactionType, date)
		if err != nil {
			return Post{}, nil, err
		}
	}

	// Recount
	var likes, dislikes int
	err = tx.QueryRow(`SELECT 
		COALESCE(SUM(CASE WHEN type='like' THEN 1 ELSE 0 END),0),
		COALESCE(SUM(CASE WHEN type='dislike' THEN 1 ELSE 0 END),0)
		FROM reactions WHERE post_id = ?`, postID).Scan(&likes, &dislikes)
	if err != nil {
		return Post{}, nil, err
	}

	isNotion := 0
	if likes >= 5 && (dislikes == 0 || float64(likes)/float64(dislikes) >= 3.0) {
		isNotion = 1
	}

	_, err = tx.Exec(`UPDATE posts SET likes = ?, dislikes = ?, is_notion = ? WHERE id = ?`, likes, dislikes, isNotion, postID)
	if err != nil {
		return Post{}, nil, err
	}

	if err := tx.Commit(); err != nil {
		return Post{}, nil, err
	}

	post, _ := GetPostByID(postID)
	if post == nil {
		post = &Post{}
	}
	post.Likes = likes
	post.Dislikes = dislikes
	post.IsNotion = isNotion == 1

	reactions := []Reaction{}
	rows, err := DB.Query(`SELECT id, post_id, week, user_uuid, user_nickname, type, date FROM reactions WHERE post_id = ?`, postID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var r Reaction
			rows.Scan(&r.ID, &r.PostID, &r.Week, &r.UserUUID, &r.UserNickname, &r.Type, &r.Date)
			reactions = append(reactions, r)
		}
	}
	return *post, reactions, nil
}

func DeleteReaction(reactionID string) error {
	// find post first
	var postID int64
	err := DB.QueryRow(`SELECT post_id FROM reactions WHERE id = ?`, reactionID).Scan(&postID)
	if err == sql.ErrNoRows {
		return nil
	}
	if err != nil {
		return err
	}

	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec(`DELETE FROM reactions WHERE id = ?`, reactionID)
	if err != nil {
		return err
	}

	var likes, dislikes int
	err = tx.QueryRow(`SELECT 
		COALESCE(SUM(CASE WHEN type='like' THEN 1 ELSE 0 END),0),
		COALESCE(SUM(CASE WHEN type='dislike' THEN 1 ELSE 0 END),0)
		FROM reactions WHERE post_id = ?`, postID).Scan(&likes, &dislikes)
	if err != nil && err != sql.ErrNoRows {
		return err
	}

	isNotion := 0
	if likes >= 5 && (dislikes == 0 || float64(likes)/float64(dislikes) >= 3.0) {
		isNotion = 1
	}

	_, err = tx.Exec(`UPDATE posts SET likes = ?, dislikes = ?, is_notion = ? WHERE id = ?`, likes, dislikes, isNotion, postID)
	if err != nil {
		return err
	}
	return tx.Commit()
}

func GetAllReactions() ([]Reaction, error) {
	rows, err := DB.Query(`SELECT id, post_id, week, user_uuid, user_nickname, type, date FROM reactions ORDER BY date DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	res := []Reaction{}
	for rows.Next() {
		var r Reaction
		if err := rows.Scan(&r.ID, &r.PostID, &r.Week, &r.UserUUID, &r.UserNickname, &r.Type, &r.Date); err != nil {
			return nil, err
		}
		res = append(res, r)
	}
	return res, nil
}

// Also sync author nickname in posts and admin replies on user nickname change
func SyncAuthorNicknames(uuid, newNick string) error {
	_, err := DB.Exec(`UPDATE posts SET author = ? WHERE author_uuid = ?`, newNick, uuid)
	if err != nil {
		return err
	}
	_, err = DB.Exec(`UPDATE admin_replies SET author_nickname = ? WHERE author_uuid = ?`, newNick, uuid)
	return err
}

// generateUUID is used by CreateUser
func generateUUID() string {
	u, err := uuid.NewV7()
	if err == nil {
		return u.String()
	}
	return uuid.New().String()
}

// Admin Session Helpers
func CreateAdminSession(userUUID string, duration time.Duration) (string, error) {
	CleanExpiredSessions()
	sessionID := generateUUID()
	expiresAt := time.Now().Add(duration).UTC().Format(time.RFC3339)
	_, err := DB.Exec(`INSERT INTO admin_sessions (id, user_uuid, expires_at) VALUES (?, ?, ?)`,
		sessionID, userUUID, expiresAt)
	if err != nil {
		return "", err
	}
	return sessionID, nil
}

func GetAdminSession(sessionID string) (*User, error) {
	var u User
	var expiresAtStr string
	err := DB.QueryRow(`
		SELECT u.uuid, u.nickname, u.role, u.status, u.created_at, s.expires_at 
		FROM admin_sessions s
		JOIN users u ON s.user_uuid = u.uuid
		WHERE s.id = ? AND u.role = 'admin' AND u.status = 'active'`, sessionID).
		Scan(&u.UUID, &u.Nickname, &u.Role, &u.Status, &u.CreatedAt, &expiresAtStr)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	expiresAt, err := time.Parse(time.RFC3339, expiresAtStr)
	if err != nil || time.Now().UTC().After(expiresAt) {
		// Expired or corrupt, delete it
		_ = DeleteAdminSession(sessionID)
		return nil, nil
	}

	return &u, nil
}

func DeleteAdminSession(sessionID string) error {
	_, err := DB.Exec(`DELETE FROM admin_sessions WHERE id = ?`, sessionID)
	return err
}

func CleanExpiredSessions() {
	now := time.Now().UTC().Format(time.RFC3339)
	_, _ = DB.Exec(`DELETE FROM admin_sessions WHERE expires_at < ?`, now)
}

func GetReportsForPosts(postIDs []int64) (map[int64][]Report, error) {
	reportsMap := make(map[int64][]Report)
	if len(postIDs) == 0 {
		return reportsMap, nil
	}

	placeholders := make([]string, len(postIDs))
	args := make([]interface{}, len(postIDs))
	for i, id := range postIDs {
		placeholders[i] = "?"
		args[i] = id
	}

	query := fmt.Sprintf(`SELECT id, post_id, reporter_uuid, reason, date FROM reports WHERE post_id IN (%s) ORDER BY id DESC`, strings.Join(placeholders, ","))
	rows, err := DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var r Report
		if err := rows.Scan(&r.ID, &r.PostID, &r.ReporterUUID, &r.Reason, &r.Date); err != nil {
			return nil, err
		}
		reportsMap[r.PostID] = append(reportsMap[r.PostID], r)
	}
	return reportsMap, nil
}

func CreateReport(postID int64, reporterUUID, reason string) (*Report, error) {
	var exists int
	err := DB.QueryRow(`SELECT COUNT(1) FROM posts WHERE id = ?`, postID).Scan(&exists)
	if err != nil || exists == 0 {
		return nil, fmt.Errorf("post does not exist")
	}

	date := time.Now().Format("2006-01-02 15:04")
	res, err := DB.Exec(`INSERT INTO reports (post_id, reporter_uuid, reason, date) VALUES (?, ?, ?, ?)`,
		postID, reporterUUID, reason, date)
	if err != nil {
		return nil, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	return &Report{
		ID:           id,
		PostID:       postID,
		ReporterUUID: reporterUUID,
		Reason:       reason,
		Date:         date,
	}, nil
}

func GetAllUpdates() ([]UpdatePost, error) {
	rows, err := DB.Query(`SELECT id, week, date, category, title, summary, published, blocks FROM updates ORDER BY week DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []UpdatePost
	for rows.Next() {
		var p UpdatePost
		var pubInt int
		var blocksStr string
		if err := rows.Scan(&p.ID, &p.Week, &p.Date, &p.Category, &p.Title, &p.Summary, &pubInt, &blocksStr); err != nil {
			return nil, err
		}
		p.Published = pubInt == 1
		if err := json.Unmarshal([]byte(blocksStr), &p.Blocks); err != nil {
			p.Blocks = []ContentBlock{}
		}
		posts = append(posts, p)
	}
	if posts == nil {
		posts = []UpdatePost{}
	}
	return posts, nil
}

func UpsertUpdate(p UpdatePost) error {
	blocksBytes, err := json.Marshal(p.Blocks)
	if err != nil {
		return err
	}
	pubInt := 0
	if p.Published {
		pubInt = 1
	}

	_, err = DB.Exec(`INSERT INTO updates (id, week, date, category, title, summary, published, blocks)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			week = excluded.week,
			date = excluded.date,
			category = excluded.category,
			title = excluded.title,
			summary = excluded.summary,
			published = excluded.published,
			blocks = excluded.blocks`,
		p.ID, p.Week, p.Date, p.Category, p.Title, p.Summary, pubInt, string(blocksBytes))
	return err
}

func DeleteUpdate(id string) error {
	_, err := DB.Exec(`DELETE FROM updates WHERE id = ?`, id)
	return err
}

