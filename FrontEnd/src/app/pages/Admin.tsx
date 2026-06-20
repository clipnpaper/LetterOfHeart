import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { fetchApi } from "../api";
import {
  Users,
  FileText,
  Heart,
  ShieldAlert,
  Key,
  Trash2,
  MessageSquare,
  CornerDownRight,
  RotateCcw,
  Search,
  ChevronRight,
  UserCheck,
  UserX,
  Edit2,
  Check,
  Calendar,
  Layers,
  Sparkles,
  Eye,
  EyeOff
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────
type Post = {
  id: number;
  title: string;
  author: string;
  authorUuid?: string;
  views: number;
  likes: number;
  dislikes: number;
  date: string;
  content: string;
  isNotion?: boolean;
  deleted?: boolean;
  adminReply?: string;
};

type UserInfo = {
  uuid: string;
  nickname: string;
  role: 'user' | 'admin';
  status: 'active' | 'banned';
  createdAt: string;
};

type Reaction = {
  id: string;
  postId: number;
  week: number;
  userUuid: string;
  userNickname: string;
  type: 'like' | 'dislike';
  date: string;
};

// ─── Main Admin Component ───────────────────────────────────────────
export function Admin() {
  const { dark } = useOutletContext<{ dark: boolean }>();
  const navigate = useNavigate();

  // Authentication State
  const [authorized, setAuthorized] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<"users" | "posts" | "reactions" | "settings">("users");

  // Settings states
  const [apostlesText, setApostlesText] = useState("");
  const [titlesText, setTitlesText] = useState("");

  // Registry States
  const [users, setUsers] = useState<Record<string, UserInfo>>({});
  const [allPosts, setAllPosts] = useState<(Post & { week: number })[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);

  // Selection/Input States
  const [selectedUserUuid, setSelectedUserUuid] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [newNickname, setNewNickname] = useState("");
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [adminReplyText, setAdminReplyText] = useState("");

  // Initialize DB and load data
  useEffect(() => {
    loadAllData();
  }, []);

  function loadAllData() {
    Promise.all([
      fetchApi("/admin/users"),
      fetchApi("/admin/posts"),
      fetchApi("/admin/reactions"),
      fetchApi("/settings").catch(() => ({ apostles: [], titles: [] }))
    ])
      .then(([usersData, postsData, reactionsData, settingsData]) => {
        setUsers(usersData);
        setAllPosts(postsData);
        setReactions(reactionsData);
        if (settingsData && settingsData.apostles && settingsData.titles) {
          setApostlesText(settingsData.apostles.join(", "));
          setTitlesText(settingsData.titles.join(", "));
        }
      })
      .catch(console.error);
  }

  // Handle Login
  function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (passcode === "bolttaguneedmoney!") {
      setAuthorized(true);
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
      setPasscode("");
    }
  }

  // User tab actions
  function handleForceRename(uuid: string, oldName: string) {
    if (!newNickname.trim()) return;
    if (newNickname === oldName) {
      setEditingUuid(null);
      return;
    }

    fetchApi(`/admin/users/${uuid}/nickname`, {
      method: "PUT",
      body: JSON.stringify({ nickname: newNickname.trim() })
    })
      .then(() => {
        loadAllData();
        setEditingUuid(null);
        setNewNickname("");
      })
      .catch(console.error);
  }

  // Toggle user active status
  function handleToggleUserStatus(uuid: string) {
    fetchApi(`/admin/users/${uuid}/status`, {
      method: "PUT"
    })
      .then(() => {
        loadAllData();
      })
      .catch(console.error);
  }

  // Post tab actions
  function handleTogglePostDelete(postId: number, week: number) {
    fetchApi(`/posts/${postId}/delete`, {
      method: "PUT"
    })
      .then(() => {
        loadAllData();
      })
      .catch(console.error);
  }

  function handlePermanentDelete(postId: number) {
    if (!window.confirm("정말로 이 게시물을 영구 삭제하시겠습니까? 데이터베이스에서 완전히 삭제되며, 복구할 수 없습니다.")) return;
    fetchApi(`/admin/posts/${postId}/permanent`, {
      method: "DELETE"
    })
      .then(() => {
        loadAllData();
      })
      .catch(console.error);
  }

  function handleSaveAdminReply(postId: number, week: number) {
    fetchApi(`/posts/${postId}/admin-reply`, {
      method: "PUT",
      body: JSON.stringify({ adminReply: adminReplyText.trim() })
    })
      .then(() => {
        loadAllData();
        setEditingPostId(null);
        setAdminReplyText("");
      })
      .catch(console.error);
  }

  // Reaction tab actions
  function handleCancelReaction(reactionId: string, postId: number, week: number, type: 'like' | 'dislike') {
    fetchApi(`/admin/reactions/${reactionId}`, {
      method: "DELETE"
    })
      .then(() => {
        loadAllData();
      })
      .catch(console.error);
  }

  function handleSaveSettings() {
    const apostles = apostlesText.split(",").map(s => s.trim()).filter(Boolean);
    const titles = titlesText.split(",").map(s => s.trim()).filter(Boolean);

    if (apostles.length === 0 || titles.length === 0) {
      alert("사도 풀과 호칭 풀은 최소 1개 이상 입력되어야 합니다.");
      return;
    }

    fetchApi("/settings", {
      method: "PUT",
      body: JSON.stringify({ apostles, titles })
    })
      .then((res: any) => {
        setApostlesText(res.apostles.join(", "));
        setTitlesText(res.titles.join(", "));
        alert("닉네임 설정이 성공적으로 저장되었습니다!");
      })
      .catch(err => {
        alert("설정 저장 실패: " + err.message);
      });
  }

  // Filtered lists
  const filteredUsers = Object.values(users).filter(u =>
    u.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.uuid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPosts = allPosts.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReactions = reactions.filter(r =>
    r.userNickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(r.postId).includes(searchQuery)
  );

  // Styled colors
  const primaryBg = dark ? "rgba(15,10,35,0.7)" : "rgba(255,255,255,0.8)";
  const borderColor = dark ? "rgba(167,139,250,0.15)" : "rgba(168,85,247,0.12)";
  const cardBg = dark ? "rgba(25,15,45,0.6)" : "rgba(255,255,255,0.9)";
  const textTitle = dark ? "#e9d5ff" : "#2d1b4e";
  const textSub = dark ? "#9d82c4" : "#6d28d9";

  // Render Passcode Screen if unauthorized
  if (!authorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[85vh] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md p-8 rounded-3xl shadow-2xl transition-all border"
          style={{ background: cardBg, borderColor }}
        >
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20 animate-pulse">
              <ShieldAlert size={28} />
            </div>
            <h1 className="text-2xl font-black mb-1" style={{ fontFamily: "'Jua', sans-serif", color: textTitle }}>
              관리자 모드 접속
            </h1>
            <p className="text-xs" style={{ color: textSub }}>
              안전한 관리를 위해 패스코드를 입력해 주십시오.
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
            <div>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" size={18} />
                <input
                  type={showPasscode ? "text" : "password"}
                  placeholder="관리자 패스코드를 입력하세요"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 rounded-2xl font-bold transition-all focus:outline-none text-center tracking-widest text-lg"
                  style={{
                    background: dark ? "rgba(10,5,20,0.5)" : "rgba(168,85,247,0.04)",
                    border: dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.15)",
                    color: dark ? "#e9d5ff" : "#4c1d95"
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-600 transition-colors p-1 rounded-lg"
                  title={showPasscode ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showPasscode ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passcodeError && (
                <p className="text-red-500 text-xs font-bold text-center mt-2">
                  ❌ 비밀번호가 틀렸습니다. 다시 시도하십시오.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(90deg,#a855f7,#ec4899)" }}
            >
              승인 요청
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-10 px-4 min-h-screen">
      <div className="w-full max-w-5xl">

        {/* Header Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-purple-600 w-fit mb-2 shadow">
              <Sparkles size={11} strokeWidth={3} /> 관리 데스크
            </span>
            <h1 className="text-4xl font-black" style={{ fontFamily: "'Jua', sans-serif", color: textTitle }}>
              마음의 편지함 관리자 포털 🛡️
            </h1>
            <p className="text-xs mt-1" style={{ color: textSub }}>
              유저 계정 정보, 부적절한 게시글 및 어뷰징 추천 이력을 실시간 통제할 수 있습니다.
            </p>
          </div>

          <button
            onClick={() => navigate("/board")}
            className="px-4 py-2 rounded-full text-xs font-bold border transition-all hover:opacity-85 shadow"
            style={{
              background: dark ? "rgba(167,139,250,0.08)" : "rgba(168,85,247,0.05)",
              borderColor,
              color: dark ? "#a78bfa" : "#7c3aed",
            }}
          >
            ← 일반 편지함 게시판
          </button>
        </div>

        {/* Dashboard Metrics Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "전체 사용자", val: Object.keys(users).length, icon: <Users size={18} />, color: "from-blue-500 to-indigo-500" },
            { label: "전체 편지수", val: allPosts.length, icon: <FileText size={18} />, color: "from-purple-500 to-pink-500" },
            { label: "삭제된 편지", val: allPosts.filter(p => p.deleted).length, icon: <Trash2 size={18} />, color: "from-rose-500 to-red-500" },
            { label: "누적 추천수", val: reactions.filter(r => r.type === "like").length, icon: <Heart size={18} />, color: "from-amber-500 to-orange-500" },
          ].map((m, idx) => (
            <div
              key={idx}
              className="rounded-3xl p-5 border flex items-center justify-between shadow-md"
              style={{ background: cardBg, borderColor }}
            >
              <div>
                <span className="text-xs opacity-75 block mb-1" style={{ color: dark ? "#c4b5fd" : "#4c1d95" }}>{m.label}</span>
                <span className="text-2xl font-black" style={{ color: textTitle, fontFamily: "'Jua', sans-serif" }}>{m.val}명/개</span>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-tr ${m.color}`}>
                {m.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Main Interface Layout */}
        <div className="flex flex-col md:flex-row gap-6">

          {/* Sidebar Tabs */}
          <div className="w-full md:w-56 shrink-0 flex flex-col gap-2">
            {[
              { id: "users", label: "사용자 관리", desc: "닉네임 강제 변경 및 제재", icon: <Users size={16} /> },
              { id: "posts", label: "콘텐츠 관리", desc: "글 삭제/복구 및 답변달기", icon: <FileText size={16} /> },
              { id: "reactions", label: "추천/비추천 관리", desc: "리액션 로그 열람 및 취소", icon: <Heart size={16} /> },
              { id: "settings", label: "닉네임 풀 설정", desc: "사도 및 호칭 풀 관리", icon: <Layers size={16} /> }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id as any);
                  setSearchQuery("");
                  setSelectedUserUuid(null);
                }}
                className="w-full p-4 rounded-2xl text-left transition-all border flex items-center gap-3 relative"
                style={{
                  background: activeTab === t.id
                    ? "linear-gradient(90deg,#a855f7,#ec4899)"
                    : cardBg,
                  borderColor: activeTab === t.id ? "transparent" : borderColor,
                  color: activeTab === t.id ? "#fff" : dark ? "#e9d5ff" : "#4c1d95"
                }}
              >
                <div className={`p-2 rounded-xl ${activeTab === t.id ? "bg-white/20" : "bg-purple-500/10"}`}>
                  {t.icon}
                </div>
                <div>
                  <span className="text-sm font-bold block leading-tight">{t.label}</span>
                  <span className={`text-[10px] block leading-none mt-0.5 ${activeTab === t.id ? "text-white/70" : "opacity-60"}`}>{t.desc}</span>
                </div>
                {activeTab === t.id && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute right-3 w-1.5 h-6 rounded-full bg-white"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Contents Panel */}
          <div
            className="flex-1 rounded-3xl p-6 border shadow-xl transition-colors duration-500"
            style={{ background: cardBg, borderColor }}
          >
            {/* Inner Search Box */}
            {activeTab !== "settings" && (
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" size={16} />
                <input
                  type="text"
                  placeholder={
                    activeTab === "users" ? "유저 닉네임 또는 UUID로 검색..." :
                      activeTab === "posts" ? "글 제목 또는 작성자명으로 검색..." :
                        "작성자 닉네임 또는 글 번호로 검색..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none"
                  style={{
                    background: dark ? "rgba(10,5,20,0.4)" : "rgba(168,85,247,0.03)",
                    border: dark ? "1px solid rgba(167,139,250,0.15)" : "1px solid rgba(168,85,247,0.1)",
                    color: dark ? "#e9d5ff" : "#4c1d95"
                  }}
                />
              </div>
            )}

            {/* Content Switcher */}
            <AnimatePresence mode="wait">

              {/* TAB 1: USER MANAGEMENT */}
              {activeTab === "users" && (
                <motion.div
                  key="tab-users"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* User Grid list */}
                    <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                      <h3 className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: textSub }}>가입자 레지스트리 ({filteredUsers.length})</h3>
                      {filteredUsers.length === 0 ? (
                        <p className="text-sm opacity-50 py-4 text-center">조건에 부합하는 사용자가 없습니다.</p>
                      ) : (
                        filteredUsers.map(u => (
                          <div
                            key={u.uuid}
                            onClick={() => setSelectedUserUuid(u.uuid)}
                            className="p-3.5 rounded-2xl border transition-all hover:scale-[1.01] flex items-center justify-between cursor-pointer"
                            style={{
                              background: selectedUserUuid === u.uuid ? "rgba(167,139,250,0.1)" : dark ? "rgba(10,5,20,0.3)" : "rgba(255,255,255,0.4)",
                              borderColor: selectedUserUuid === u.uuid ? "#a855f7" : borderColor,
                            }}
                          >
                            <div className="min-w-0 flex-1">
                              {editingUuid === u.uuid ? (
                                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="text"
                                    value={newNickname}
                                    onChange={(e) => setNewNickname(e.target.value)}
                                    className="px-2 py-0.5 rounded border text-xs focus:outline-none"
                                    style={{
                                      background: dark ? "rgba(20,15,40,0.8)" : "#fff",
                                      borderColor,
                                      color: dark ? "#e9d5ff" : "#4c1d95"
                                    }}
                                  />
                                  <button
                                    onClick={() => handleForceRename(u.uuid, u.nickname)}
                                    className="p-1 text-green-500 hover:bg-green-500/10 rounded"
                                  >
                                    <Check size={14} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm block truncate" style={{ color: dark ? "#e9d5ff" : "#2d1b4e" }}>
                                    {u.nickname}
                                  </span>
                                  {u.role === "admin" && (
                                    <span className="text-[9px] px-1 rounded font-black bg-indigo-500 text-white">ADMIN</span>
                                  )}
                                  {u.status === "banned" && (
                                    <span className="text-[9px] px-1 rounded font-black bg-rose-500 text-white animate-pulse">BANNED</span>
                                  )}
                                </div>
                              )}
                              <span className="text-[9px] font-mono opacity-50 block truncate">{u.uuid}</span>
                            </div>

                            <div className="flex items-center gap-1.5 ml-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setEditingUuid(u.uuid);
                                  setNewNickname(u.nickname);
                                }}
                                className="p-1.5 text-purple-400 hover:bg-purple-500/10 rounded-xl"
                                title="닉네임 강제 변경"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleToggleUserStatus(u.uuid)}
                                className={`p-1.5 rounded-xl ${u.status === "active" ? "text-rose-400 hover:bg-rose-500/10" : "text-emerald-400 hover:bg-emerald-500/10"}`}
                                title={u.status === "active" ? "이용 정지 제재" : "제재 해제"}
                              >
                                {u.status === "active" ? <UserX size={13} /> : <UserCheck size={13} />}
                              </button>
                              <ChevronRight size={14} className="opacity-50" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Selected User Activity timeline */}
                    <div className="border rounded-2xl p-4 flex flex-col min-h-[300px]" style={{ borderColor, background: dark ? "rgba(10,5,20,0.2)" : "rgba(255,255,255,0.3)" }}>
                      <h3 className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: textSub }}>사용자 개별 활동 타임라인</h3>
                      {selectedUserUuid ? (
                        <div className="flex flex-col gap-4 overflow-y-auto max-h-[420px] pr-1">
                          <div className="p-3 rounded-xl bg-purple-500/5 border" style={{ borderColor }}>
                            <span className="text-[10px] block opacity-60">닉네임</span>
                            <span className="text-base font-extrabold block" style={{ color: dark ? "#c084fc" : "#7c3aed" }}>"{users[selectedUserUuid]?.nickname}"</span>
                            <span className="text-[10px] block opacity-40 font-mono mt-1">UUID: {selectedUserUuid}</span>
                            <span className="text-[9px] block opacity-50 mt-1">가입일: {users[selectedUserUuid]?.createdAt ? new Date(users[selectedUserUuid].createdAt).toLocaleString() : "-"}</span>
                          </div>

                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider block mb-2" style={{ color: textSub }}>작성한 편지 목록</span>
                            {allPosts.filter(p => p.authorUuid === selectedUserUuid).length === 0 ? (
                              <p className="text-xs opacity-50 italic">작성한 편지가 없습니다.</p>
                            ) : (
                              <div className="flex flex-col gap-2">
                                {allPosts.filter(p => p.authorUuid === selectedUserUuid).map(p => (
                                  <div key={p.id} className="p-2.5 rounded-xl border text-xs flex justify-between items-center" style={{ borderColor, background: cardBg }}>
                                    <div className="min-w-0 flex-1">
                                      <span className="font-bold block truncate" style={{ color: dark ? "#e9d5ff" : "#2d1b4e" }}>
                                        {p.deleted ? "[삭제됨] " : ""}{p.title}
                                      </span>
                                      <span className="text-[9px] opacity-50 flex items-center gap-1 mt-0.5"><Calendar size={9} /> {p.date} ({p.week}주차)</span>
                                    </div>
                                    <div className="flex gap-2 text-[9px] font-bold ml-2">
                                      <span className="text-purple-400">👍 {p.likes}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider block mb-2" style={{ color: textSub }}>참여한 추천/비추천 이력</span>
                            {reactions.filter(r => r.userUuid === selectedUserUuid).length === 0 ? (
                              <p className="text-xs opacity-50 italic">추천/비추천 참여 이력이 없습니다.</p>
                            ) : (
                              <div className="flex flex-col gap-2">
                                {reactions.filter(r => r.userUuid === selectedUserUuid).map(r => {
                                  const p = allPosts.find(ap => ap.id === r.postId);
                                  return (
                                    <div key={r.id} className="p-2.5 rounded-xl border text-xs flex justify-between items-center" style={{ borderColor, background: cardBg }}>
                                      <div className="min-w-0 flex-1 flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${r.type === 'like' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                        <div className="min-w-0 flex-1">
                                          <span className="block truncate">#{r.postId}번 글 "{p ? p.title : "알 수 없는 게시물"}" 에 {r.type === 'like' ? '추천' : '비추천'}함</span>
                                          <span className="text-[9px] opacity-40 block">{new Date(r.date).toLocaleString()}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-40 py-10">
                          <Users size={40} className="mb-2" />
                          <p className="text-xs">유저 목록에서 상세 조회할 사용자를 클릭해 주십시오.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: CONTENT & COMMENT MANAGEMENT */}
              {activeTab === "posts" && (
                <motion.div
                  key="tab-posts"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-4"
                >
                  <h3 className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: textSub }}>전체 편지 모니터링 및 복구 ({filteredPosts.length})</h3>
                  <div className="flex flex-col gap-3 max-h-[550px] overflow-y-auto pr-1">
                    {filteredPosts.length === 0 ? (
                      <p className="text-sm opacity-50 py-4 text-center">조건에 일치하는 편지가 존재하지 않습니다.</p>
                    ) : (
                      filteredPosts.map(p => (
                        <div
                          key={p.id}
                          className="p-4 rounded-2xl border transition-all flex flex-col gap-3"
                          style={{
                            background: p.deleted ? (dark ? "rgba(225,29,72,0.05)" : "rgba(225,29,72,0.03)") : dark ? "rgba(10,5,20,0.3)" : "rgba(255,255,255,0.4)",
                            borderColor: p.deleted ? "rgba(225,29,72,0.3)" : borderColor,
                          }}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 font-bold text-purple-400">
                                  {p.week}주차
                                </span>
                                {p.isNotion && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded font-black bg-amber-500 text-slate-900">개념글</span>
                                )}
                                {p.deleted && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded font-black bg-rose-600 text-white animate-pulse">DELETED (SOFT)</span>
                                )}
                              </div>

                              <h4 className="text-base font-extrabold leading-snug" style={{ color: p.deleted ? (dark ? "#f87171" : "#b91c1c") : textTitle }}>
                                {p.title}
                              </h4>

                              <span className="text-[10px] opacity-60 flex items-center gap-2 mt-1.5">
                                <span>✍️ {p.author}</span>
                                <span>🕐 {p.date}</span>
                                <span>👁️ {p.views}회</span>
                                <span className="text-amber-500">👍 {p.likes}</span>
                                <span className="text-rose-500">👎 {p.dislikes}</span>
                              </span>
                            </div>

                            <div className="flex gap-2 shrink-0">
                              {p.deleted && (
                                <button
                                  onClick={() => handlePermanentDelete(p.id)}
                                  className="px-3 py-1.5 rounded-full text-xs font-bold transition-all bg-rose-600 text-white hover:bg-rose-700 shadow"
                                >
                                  영구 삭제
                                </button>
                              )}
                              <button
                                onClick={() => handleTogglePostDelete(p.id, p.week)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${p.deleted
                                  ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow"
                                  : "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                                  }`}
                              >
                                {p.deleted ? "복구하기" : "강제 삭제"}
                              </button>
                            </div>
                          </div>

                          {/* Raw block values display */}
                          <div className="p-3 rounded-xl text-xs leading-relaxed" style={{ background: dark ? "rgba(0,0,0,0.2)" : "rgba(168,85,247,0.02)", color: dark ? "#c4b5fd" : "#4c1d95" }}>
                            {(() => {
                              try {
                                const blocks = JSON.parse(p.content);
                                if (Array.isArray(blocks)) {
                                  return blocks.map((b: any, idx) => (
                                    <div key={b.id || idx} className="flex gap-1.5 mb-1 last:mb-0">
                                      <span className="opacity-45 font-black uppercase text-[9px] inline-block w-10 shrink-0">[{b.type}]</span>
                                      <span className="break-all">{b.value}</span>
                                    </div>
                                  ));
                                }
                              } catch (e) { }
                              return <p>{p.content}</p>;
                            })()}
                          </div>

                          {/* Admin Reply field */}
                          <div className="flex flex-col gap-2">
                            {p.adminReply && editingPostId !== p.id && (
                              <div className="p-3 rounded-xl border flex justify-between items-start gap-2 bg-indigo-500/5" style={{ borderColor }}>
                                <div className="text-xs">
                                  <span className="font-extrabold text-[10px] text-indigo-400 block mb-1">🛡️ 관리자 답변</span>
                                  <p style={{ color: dark ? "#c4b5fd" : "#4c1d95" }}>{p.adminReply}</p>
                                </div>
                                <button
                                  onClick={() => {
                                    setEditingPostId(p.id);
                                    setAdminReplyText(p.adminReply || "");
                                  }}
                                  className="text-[10px] text-purple-400 underline shrink-0"
                                >
                                  수정
                                </button>
                              </div>
                            )}

                            {editingPostId === p.id ? (
                              <div className="flex flex-col gap-2 mt-1">
                                <textarea
                                  placeholder="이 글에 등록할 공식 관리자 답변을 작성하세요..."
                                  value={adminReplyText}
                                  onChange={(e) => setAdminReplyText(e.target.value)}
                                  rows={2}
                                  className="w-full p-2.5 rounded-xl text-xs focus:outline-none resize-none"
                                  style={{
                                    background: dark ? "rgba(15,10,35,0.6)" : "#fff",
                                    border: `1px solid ${borderColor}`,
                                    color: dark ? "#e9d5ff" : "#4c1d95"
                                  }}
                                />
                                <div className="flex justify-end gap-2 text-xs">
                                  <button
                                    onClick={() => {
                                      setEditingPostId(null);
                                      setAdminReplyText("");
                                    }}
                                    className="px-3 py-1 rounded"
                                    style={{ color: textSub }}
                                  >
                                    취소
                                  </button>
                                  <button
                                    onClick={() => handleSaveAdminReply(p.id, p.week)}
                                    className="px-4 py-1 bg-purple-600 text-white rounded font-bold"
                                  >
                                    답변 저장
                                  </button>
                                </div>
                              </div>
                            ) : (
                              !p.adminReply && (
                                <button
                                  onClick={() => {
                                    setEditingPostId(p.id);
                                    setAdminReplyText("");
                                  }}
                                  className="w-fit flex items-center gap-1 text-[11px] text-purple-400 hover:underline font-bold"
                                >
                                  <MessageSquare size={12} /> 관리자 답변(댓글) 작성하기
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* TAB 3: REACTION HISTORY & ROLLBACK */}
              {activeTab === "reactions" && (
                <motion.div
                  key="tab-reactions"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-4"
                >
                  <h3 className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: textSub }}>추천/비추천 상호작용 로그 ({filteredReactions.length})</h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                          <th className="py-2.5 px-3 opacity-60">종류</th>
                          <th className="py-2.5 px-3 opacity-60">글 번호 (주차)</th>
                          <th className="py-2.5 px-3 opacity-60">활동 닉네임</th>
                          <th className="py-2.5 px-3 opacity-60">시간</th>
                          <th className="py-2.5 px-3 opacity-60 text-center">조치</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReactions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center opacity-50">상호작용 로그가 존재하지 않습니다.</td>
                          </tr>
                        ) : (
                          filteredReactions.map(r => (
                            <tr
                              key={r.id}
                              style={{ borderBottom: `1px solid ${borderColor}` }}
                              className="hover:bg-purple-500/5 transition-colors"
                            >
                              <td className="py-3 px-3 font-bold">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] ${r.type === 'like'
                                  ? "bg-amber-500/10 text-amber-500"
                                  : "bg-rose-500/10 text-rose-500"
                                  }`}>
                                  {r.type === 'like' ? '👍 추천' : '👎 비추천'}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <span className="font-bold">#{r.postId}</span>
                                <span className="opacity-50 text-[10px] ml-1">({r.week}주차)</span>
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex flex-col">
                                  <span className="font-bold">{r.userNickname}</span>
                                  <span className="text-[9px] font-mono opacity-40 truncate max-w-[120px]">{r.userUuid}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 opacity-60">
                                {new Date(r.date).toLocaleString()}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <button
                                  onClick={() => handleCancelReaction(r.id, r.postId, r.week, r.type)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 font-bold text-[10px] transition-all"
                                  title="리액션 로그 삭제 및 카운트 차감"
                                >
                                  <RotateCcw size={10} /> 강제 취소
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* TAB 4: SETTINGS (NICKNAME POOLS) */}
              {activeTab === "settings" && (
                <motion.div 
                  key="tab-settings" 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-6"
                >
                  <div className="flex flex-col gap-1 mb-2">
                    <h3 className="text-base font-extrabold" style={{ color: textTitle }}>
                      익명 닉네임 풀 설정 🎨
                    </h3>
                    <p className="text-xs opacity-75" style={{ color: textSub }}>
                      새로운 익명 사용자가 가입할 때 무작위로 생성되는 닉네임의 사도 목록과 호칭 목록을 관리할 수 있습니다. 쉼표(,)로 각 단어를 구분하여 입력해 주십시오.
                    </p>
                  </div>

                  <div className="flex flex-col gap-5">
                    {/* Apostles textarea */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-black uppercase tracking-wider block" style={{ color: textSub }}>
                        {`{트릭컬 사도}`} 후보 목록 (쉼표 구분)
                      </label>
                      <textarea
                        rows={5}
                        placeholder="캬롯, 시스트, 버터, 클로에, 에르핀..."
                        value={apostlesText}
                        onChange={(e) => setApostlesText(e.target.value)}
                        className="w-full p-4 rounded-2xl text-sm focus:outline-none transition-all"
                        style={{
                          background: dark ? "rgba(10,5,20,0.4)" : "rgba(168,85,247,0.03)",
                          border: dark ? "1px solid rgba(167,139,250,0.15)" : "1px solid rgba(168,85,247,0.1)",
                          color: dark ? "#e9d5ff" : "#4c1d95"
                        }}
                      />
                    </div>

                    {/* Titles textarea */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-black uppercase tracking-wider block" style={{ color: textSub }}>
                        {`{호칭}`} 후보 목록 (쉼표 구분)
                      </label>
                      <textarea
                        rows={5}
                        placeholder="지휘관, 대리인, 추종자, 사절, 관측자..."
                        value={titlesText}
                        onChange={(e) => setTitlesText(e.target.value)}
                        className="w-full p-4 rounded-2xl text-sm focus:outline-none transition-all"
                        style={{
                          background: dark ? "rgba(10,5,20,0.4)" : "rgba(168,85,247,0.03)",
                          border: dark ? "1px solid rgba(167,139,250,0.15)" : "1px solid rgba(168,85,247,0.1)",
                          color: dark ? "#e9d5ff" : "#4c1d95"
                        }}
                      />
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleSaveSettings}
                        className="px-6 py-3 rounded-2xl text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                        style={{ background: "linear-gradient(90deg,#a855f7,#ec4899)" }}
                      >
                        설정 저장
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>

      </div>
    </div>
  );
}
