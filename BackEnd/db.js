const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const REACTIONS_FILE = path.join(DATA_DIR, 'reactions.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

function initDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // 1. Initialize Users File with admin
  if (!fs.existsSync(USERS_FILE)) {
    const initialUsers = {
      "user-uuid-moon": {
        uuid: "user-uuid-moon",
        nickname: "달빛의서기",
        role: "admin",
        status: "active",
        createdAt: new Date().toISOString()
      }
    };
    fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2), 'utf-8');
  }

  // 2. Initialize Posts File
  if (!fs.existsSync(POSTS_FILE)) {
    fs.writeFileSync(POSTS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }

  // 3. Initialize Reactions File
  if (!fs.existsSync(REACTIONS_FILE)) {
    fs.writeFileSync(REACTIONS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }

  // 4. Initialize Settings File (Apostle & Title pool)
  if (!fs.existsSync(SETTINGS_FILE)) {
    const defaultSettings = {
      apostles: ["캬롯", "시스트", "버터", "클로에", "에르핀", "네르", "벨벳", "티그", "코미"],
      titles: ["지휘관", "대리인", "추종자", "사절", "관측자", "서기", "목격자", "방랑자", "수호자"]
    };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2), 'utf-8');
  }
}

// Read/Write helper functions
function readUsers() {
  initDb();
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

function writeUsers(users) {
  initDb();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

function readPosts() {
  initDb();
  return JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
}

// Ensure the helper writes clean JSON
function writePosts(posts) {
  initDb();
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf-8');
}

function readReactions() {
  initDb();
  return JSON.parse(fs.readFileSync(REACTIONS_FILE, 'utf-8'));
}

function writeReactions(reactions) {
  initDb();
  fs.writeFileSync(REACTIONS_FILE, JSON.stringify(reactions, null, 2), 'utf-8');
}

function readSettings() {
  initDb();
  return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
}

function writeSettings(settings) {
  initDb();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

module.exports = {
  readUsers,
  writeUsers,
  readPosts,
  writePosts,
  readReactions,
  writeReactions,
  readSettings,
  writeSettings
};
