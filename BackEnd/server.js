const express = require('express');
const cors = require('cors');
require('dotenv').config();

const {
  readUsers,
  writeUsers,
  readPosts,
  writePosts,
  readReactions,
  writeReactions,
  readSettings,
  writeSettings
} = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 기본 루트 라우트
app.get('/', (req, res) => {
  res.json({
    message: '마음의 편지함 백엔드 서버가 정상적으로 작동 중입니다.',
    status: 'healthy',
    timestamp: new Date()
  });
});

// ─── Users API ──────────────────────────────────────────────────────
app.post('/api/users', (req, res) => {
  let { uuid, nickname } = req.body;
  const users = readUsers();

  // If user already exists by uuid, return them
  if (uuid && users[uuid]) {
    return res.json(users[uuid]);
  }

  // If no uuid provided, generate one
  if (!uuid) {
    const crypto = require('crypto');
    uuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // If no nickname provided, generate one using settings pools
  if (!nickname) {
    const settings = readSettings();
    const apostles = settings.apostles || [];
    const titles = settings.titles || [];

    let generatedNickname = "";
    let attempts = 0;
    const existingNicknames = new Set(Object.values(users).map(u => u.nickname));

    do {
      const apostle = apostles.length > 0 ? apostles[Math.floor(Math.random() * apostles.length)] : "익명";
      const title = titles.length > 0 ? titles[Math.floor(Math.random() * titles.length)] : "작가";
      generatedNickname = `${apostle}의${title}`;

      if (attempts > 50) {
        generatedNickname += Math.floor(Math.random() * 1000);
      }
      attempts++;
    } while (existingNicknames.has(generatedNickname) && attempts < 100);

    nickname = generatedNickname;
  }

  const newUser = {
    uuid,
    nickname,
    role: nickname === '달빛의서기' ? 'admin' : 'user',
    status: 'active',
    createdAt: new Date().toISOString()
  };
  users[uuid] = newUser;
  writeUsers(users);

  res.status(201).json(newUser);
});

app.get('/api/admin/users', (req, res) => {
  const users = readUsers();
  res.json(users);
});

app.put('/api/admin/users/:uuid/nickname', (req, res) => {
  const { uuid } = req.params;
  const { nickname } = req.body;
  if (!nickname || !nickname.trim()) {
    return res.status(400).json({ error: 'Nickname is required.' });
  }
  const users = readUsers();
  if (!users[uuid]) {
    return res.status(404).json({ error: 'User not found.' });
  }

  users[uuid].nickname = nickname.trim();
  writeUsers(users);

  // Sync author nickname in all posts written by this user
  const posts = readPosts();
  const updatedPosts = posts.map(p => {
    if (p.authorUuid === uuid) {
      return { ...p, author: nickname.trim() };
    }
    return p;
  });
  writePosts(updatedPosts);

  res.json(users[uuid]);
});

app.put('/api/admin/users/:uuid/status', (req, res) => {
  const { uuid } = req.params;
  const users = readUsers();
  if (!users[uuid]) {
    return res.status(404).json({ error: 'User not found.' });
  }
  users[uuid].status = users[uuid].status === 'active' ? 'banned' : 'active';
  writeUsers(users);
  res.json(users[uuid]);
});

// ─── Posts API ──────────────────────────────────────────────────────
app.get('/api/posts', (req, res) => {
  const week = parseInt(req.query.week, 10);
  if (isNaN(week)) {
    return res.status(400).json({ error: 'Week query parameter is required.' });
  }
  const posts = readPosts();
  
  // Filter by week, and map to mask deleted posts
  const filtered = posts.filter(p => p.week === week).map(p => {
    if (p.deleted) {
      return {
        id: p.id,
        title: '삭제된 게시물입니다.',
        author: '-',
        authorUuid: '-',
        views: 0,
        likes: 0,
        dislikes: 0,
        date: p.date,
        content: JSON.stringify([{ id: 'del', type: 'text', value: '삭제된 게시물입니다.' }]),
        deleted: true,
        week: p.week
      };
    }
    return p;
  });
  
  // Sort posts newest first
  filtered.sort((a, b) => b.id - a.id);
  res.json(filtered);
});

app.get('/api/admin/posts', (req, res) => {
  const posts = readPosts();
  posts.sort((a, b) => b.id - a.id);
  res.json(posts);
});

app.post('/api/posts', (req, res) => {
  const { title, author, authorUuid, content, week } = req.body;
  if (!title || !author || !authorUuid || !content || isNaN(week)) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const posts = readPosts();
  
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const newPost = {
    id: Date.now(),
    title: title.trim(),
    author,
    authorUuid,
    views: 0,
    likes: 0,
    dislikes: 0,
    date: formattedDate,
    content,
    isNotion: false,
    deleted: false,
    week: parseInt(week, 10)
  };

  posts.push(newPost);
  writePosts(posts);

  res.status(201).json(newPost);
});

app.put('/api/posts/:id/view', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const posts = readPosts();
  const idx = posts.findIndex(p => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Post not found.' });
  }
  posts[idx].views += 1;
  writePosts(posts);
  res.json(posts[idx]);
});

app.put('/api/posts/:id/admin-reply', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { adminReply } = req.body;
  const posts = readPosts();
  const idx = posts.findIndex(p => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Post not found.' });
  }
  posts[idx].adminReply = adminReply ? adminReply.trim() : undefined;
  writePosts(posts);
  res.json(posts[idx]);
});

app.put('/api/posts/:id/delete', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const posts = readPosts();
  const idx = posts.findIndex(p => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Post not found.' });
  }
  posts[idx].deleted = !posts[idx].deleted;
  writePosts(posts);
  res.json(posts[idx]);
});

app.delete('/api/admin/posts/:id/permanent', (req, res) => {
  const id = parseInt(req.params.id, 10);
  let posts = readPosts();
  const idx = posts.findIndex(p => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Post not found.' });
  }
  posts = posts.filter(p => p.id !== id);
  writePosts(posts);

  // Also remove associated reactions to prevent phantom entries
  let reactions = readReactions();
  reactions = reactions.filter(r => r.postId !== id);
  writeReactions(reactions);

  res.json({ success: true });
});


// ─── Reactions API ──────────────────────────────────────────────────
app.get('/api/admin/reactions', (req, res) => {
  const reactions = readReactions();
  res.json(reactions);
});

app.post('/api/reactions', (req, res) => {
  const { postId, week, userUuid, type } = req.body;
  if (isNaN(postId) || isNaN(week) || !userUuid || !['like', 'dislike', 'cancel_like', 'cancel_dislike'].includes(type)) {
    return res.status(400).json({ error: 'Invalid fields.' });
  }

  const posts = readPosts();
  const postIdx = posts.findIndex(p => p.id === postId);
  if (postIdx === -1) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  let reactions = readReactions();
  const users = readUsers();
  const userNickname = users[userUuid] ? users[userUuid].nickname : '익명';

  // Filter out any existing reaction of this user for this post
  reactions = reactions.filter(r => !(r.postId === postId && r.userUuid === userUuid));

  if (type === 'like' || type === 'dislike') {
    reactions.push({
      id: Math.random().toString(36).substring(2, 9),
      postId,
      week: parseInt(week, 10),
      userUuid,
      userNickname,
      type,
      date: new Date().toISOString()
    });
  }

  // Recalculate likes/dislikes counts for the post
  const postReactions = reactions.filter(r => r.postId === postId);
  const likesCount = postReactions.filter(r => r.type === 'like').length;
  const dislikesCount = postReactions.filter(r => r.type === 'dislike').length;
  
  posts[postIdx].likes = likesCount;
  posts[postIdx].dislikes = dislikesCount;
  posts[postIdx].isNotion = likesCount >= 5 && (dislikesCount === 0 || (likesCount / dislikesCount) >= 3);

  writeReactions(reactions);
  writePosts(posts);

  res.json({
    post: posts[postIdx],
    reactions: postReactions
  });
});

app.delete('/api/admin/reactions/:id', (req, res) => {
  const { id } = req.params;
  let reactions = readReactions();
  const reaction = reactions.find(r => r.id === id);
  if (!reaction) {
    return res.status(404).json({ error: 'Reaction not found.' });
  }

  reactions = reactions.filter(r => r.id !== id);
  writeReactions(reactions);

  // Recalculate counts for the post
  const posts = readPosts();
  const postIdx = posts.findIndex(p => p.id === reaction.postId);
  if (postIdx !== -1) {
    const postReactions = reactions.filter(r => r.postId === reaction.postId);
    const likesCount = postReactions.filter(r => r.type === 'like').length;
    const dislikesCount = postReactions.filter(r => r.type === 'dislike').length;
    
    posts[postIdx].likes = likesCount;
    posts[postIdx].dislikes = dislikesCount;
    posts[postIdx].isNotion = likesCount >= 5 && (dislikesCount === 0 || (likesCount / dislikesCount) >= 3);
    writePosts(posts);
  }

  res.json({ success: true });
});

// ─── Settings API ───────────────────────────────────────────────────
app.get('/api/settings', (req, res) => {
  const settings = readSettings();
  res.json(settings);
});

app.put('/api/settings', (req, res) => {
  const { apostles, titles } = req.body;
  if (!Array.isArray(apostles) || !Array.isArray(titles)) {
    return res.status(400).json({ error: 'Apostles and titles must be arrays.' });
  }

  const cleanApostles = apostles.map(a => String(a).trim()).filter(a => a.length > 0);
  const cleanTitles = titles.map(t => String(t).trim()).filter(t => t.length > 0);

  if (cleanApostles.length === 0 || cleanTitles.length === 0) {
    return res.status(400).json({ error: 'Apostles and titles lists cannot be empty.' });
  }

  const updatedSettings = {
    apostles: cleanApostles,
    titles: cleanTitles
  };

  writeSettings(updatedSettings);
  res.json(updatedSettings);
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
