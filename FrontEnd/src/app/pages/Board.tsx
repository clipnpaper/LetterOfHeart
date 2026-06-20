import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useOutletContext, useNavigate, useParams } from "react-router";
import { Eye, ThumbsUp, ThumbsDown, Star, ChevronLeft, ChevronRight, Archive, Lock, Pencil } from "lucide-react";
import { fetchApi } from "../api";

// ─── Mock data ───────────────────────────────
const CURRENT_WEEK = 1;

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
  isNotion?: boolean; // 개념글
  deleted?: boolean;
  adminReply?: string;
};



const WEEKS = Array.from({ length: CURRENT_WEEK }, (_, i) => i + 1);

// ─── Sub-components ───────────────────────────
function WeekTab({ week, active, archived, dark, onClick }: {
  week: number; active: boolean; archived: boolean; dark: boolean; onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all"
      style={{
        background: active
          ? "linear-gradient(90deg, #a855f7, #ec4899)"
          : dark ? "rgba(167,139,250,0.1)" : "rgba(168,85,247,0.08)",
        color: active ? "#fff" : dark ? "#a78bfa" : "#7c3aed",
        border: active ? "none" : dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.2)",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}
    >
      {archived && <Archive size={12} />}
      {week}주차
      {archived && <span className="text-[10px] opacity-70">(읽기전용)</span>}
    </motion.button>
  );
}

function PostRow({ post, no, dark, isArchived, onClick }: {
  post: Post; no: number; dark: boolean; isArchived: boolean; onClick: () => void;
}) {
  return (
    <motion.tr
      onClick={post.deleted ? undefined : onClick}
      whileHover={post.deleted ? {} : { backgroundColor: dark ? "rgba(167,139,250,0.07)" : "rgba(168,85,247,0.04)" }}
      className={post.deleted ? "opacity-50 cursor-not-allowed" : "cursor-pointer transition-colors"}
      style={{ borderBottom: dark ? "1px solid rgba(167,139,250,0.1)" : "1px solid rgba(168,85,247,0.08)" }}
    >
      {/* 번호 */}
      <td className="py-3 px-4 text-sm text-center w-14" style={{ color: dark ? "#6d5b8a" : "#c4b5fd", fontFamily: "'Noto Sans KR', sans-serif" }}>
        {post.deleted ? "-" : post.isNotion ? (
          <span className="inline-flex items-center justify-center" title="개념글">
            <Star size={14} style={{ color: "#f59e0b", fill: "#fbbf24" }} />
          </span>
        ) : no}
      </td>
      {/* 제목 */}
      <td className="py-3 px-2 min-w-0">
        <div className="flex items-center gap-2 w-full min-w-0">
          {isArchived && <Lock size={11} style={{ color: dark ? "#6d5b8a" : "#c4b5fd", flexShrink: 0 }} />}
          <span
            className="text-sm font-medium leading-snug truncate flex-1 min-w-0"
            style={{
              color: dark ? "#e9d5ff" : "#3b0764",
              fontFamily: "'Noto Sans KR', sans-serif",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0
            }}
          >
            {post.deleted ? "삭제된 게시물입니다." : post.title}
          </span>
          {!post.deleted && post.adminReply && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0" style={{ background: "rgba(139,92,246,0.15)", color: "#7c3aed" }}>관리자답변</span>
          )}
        </div>
      </td>
      {/* 작성자 */}
      <td className="py-3 px-3 text-xs text-center whitespace-nowrap hidden sm:table-cell" style={{ color: dark ? "#7c5c9a" : "#a78bfa", fontFamily: "'Noto Sans KR', sans-serif" }}>
        {post.deleted ? "-" : post.author}
      </td>
      {/* 조회 */}
      <td className="py-3 px-2 text-center hidden md:table-cell">
        <div className="flex items-center justify-center gap-1 text-xs" style={{ color: dark ? "#6d5b8a" : "#c4b5fd" }}>
          {post.deleted ? "-" : <><Eye size={12} />{post.views}</>}
        </div>
      </td>
      {/* 추천 */}
      <td className="py-3 px-3 text-center w-16">
        <span
          className="text-xs font-bold"
          style={{ color: !post.deleted && post.likes >= 5 ? "#f59e0b" : dark ? "#6d5b8a" : "#c4b5fd" }}
        >
          {post.deleted ? "-" : `+${post.likes}`}
        </span>
      </td>
    </motion.tr>
  );
}

function getYoutubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  let match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return null;
}

function renderContent(content: string, dark: boolean) {
  try {
    const blocks = JSON.parse(content);
    if (Array.isArray(blocks)) {
      return (
        <div className="flex flex-col gap-4">
          {blocks.map((block: any, idx: number) => {
            if (block.type === "text") {
              return (
                <p
                  key={block.id || idx}
                  className="leading-relaxed text-base whitespace-pre-wrap"
                  style={{ color: dark ? "#c4b5fd" : "#4c1d95", fontFamily: "'Noto Sans KR', sans-serif" }}
                >
                  {block.value}
                </p>
              );
            }
            if (block.type === "media") {
              if (!block.value.trim()) return null;
              const isVideo = /\.(mp4|webm|ogg)$/i.test(block.value);
              return (
                <div key={block.id || idx} className="my-2 max-w-full">
                  {isVideo ? (
                    <video
                      src={block.value}
                      controls
                      className="max-w-full rounded-2xl shadow-md max-h-[400px] object-contain"
                    />
                  ) : (
                    <img
                      src={block.value}
                      alt="첨부 미디어"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                      className="max-w-full rounded-2xl shadow-md max-h-[400px] object-contain"
                    />
                  )}
                </div>
              );
            }
            if (block.type === "embed") {
              if (!block.value.trim()) return null;
              const embedUrl = getYoutubeEmbedUrl(block.value);
              if (embedUrl) {
                return (
                  <div key={block.id || idx} className="relative aspect-video w-full max-w-xl rounded-2xl overflow-hidden my-4 shadow-md">
                    <iframe
                      src={embedUrl}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
                );
              }
              return (
                <a
                  key={block.id || idx}
                  href={block.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline my-1 block break-all"
                  style={{ color: dark ? "#a78bfa" : "#7c3aed" }}
                >
                  🔗 {block.value}
                </a>
              );
            }
            return null;
          })}
        </div>
      );
    }
  } catch (e) {
    // Not JSON
  }
  return (
    <p className="leading-relaxed text-base whitespace-pre-wrap" style={{ color: dark ? "#c4b5fd" : "#4c1d95", fontFamily: "'Noto Sans KR', sans-serif" }}>
      {content}
    </p>
  );
}

function PostDetail({ post, dark, isArchived, activeWeek, onBack, onUpdate }: {
  post: Post; dark: boolean; isArchived: boolean; activeWeek: number; onBack: () => void; onUpdate: (p: Post) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [localLikes, setLocalLikes] = useState(post.likes);
  const [localDislikes, setLocalDislikes] = useState(post.dislikes);

  // Load initial reaction state
  useEffect(() => {
    const userUuid = localStorage.getItem("LOH_USER_UUID") || "";
    fetchApi("/admin/reactions")
      .then((reactions: any[]) => {
        const userReaction = reactions.find((r: any) => r.postId === post.id && r.userUuid === userUuid);
        if (userReaction) {
          if (userReaction.type === 'like') {
            setLiked(true);
            setDisliked(false);
          } else if (userReaction.type === 'dislike') {
            setDisliked(true);
            setLiked(false);
          }
        } else {
          setLiked(false);
          setDisliked(false);
        }
      })
      .catch(console.error);
  }, [post.id]);

  function syncWithBackend(actionType: 'like' | 'dislike' | 'cancel_like' | 'cancel_dislike') {
    const userUuid = localStorage.getItem("LOH_USER_UUID") || "";
    fetchApi("/reactions", {
      method: "POST",
      body: JSON.stringify({
        postId: post.id,
        week: activeWeek,
        userUuid,
        type: actionType
      })
    })
      .then((res: any) => {
        setLocalLikes(res.post.likes);
        setLocalDislikes(res.post.dislikes);
        if (onUpdate) {
          onUpdate(res.post);
        }
      })
      .catch(console.error);
  }

  function handleLike() {
    if (isArchived) return;
    let actionType: 'like' | 'dislike' | 'cancel_like' | 'cancel_dislike' = 'like';
    if (liked) {
      setLiked(false);
      actionType = 'cancel_like';
    } else {
      setLiked(true);
      actionType = 'like';
      if (disliked) {
        setDisliked(false);
      }
    }
    syncWithBackend(actionType);
  }

  function handleDislike() {
    if (isArchived) return;
    let actionType: 'like' | 'dislike' | 'cancel_like' | 'cancel_dislike' = 'dislike';
    if (disliked) {
      setDisliked(false);
      actionType = 'cancel_dislike';
    } else {
      setDisliked(true);
      actionType = 'dislike';
      if (liked) {
        setLiked(false);
      }
    }
    syncWithBackend(actionType);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm mb-6 font-bold transition-opacity hover:opacity-70"
        style={{ color: dark ? "#a78bfa" : "#7c3aed", fontFamily: "'Noto Sans KR', sans-serif" }}
      >
        <ChevronLeft size={16} /> 목록으로
      </button>

      <div
        className="rounded-3xl p-8 shadow-xl transition-colors duration-500"
        style={{
          background: dark ? "rgba(30,20,50,0.8)" : "rgba(255,255,255,0.85)",
          border: dark ? "1px solid rgba(167,139,250,0.15)" : "1px solid rgba(168,85,247,0.1)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Header */}
        <div className="mb-6 pb-5" style={{ borderBottom: dark ? "1px solid rgba(167,139,250,0.12)" : "1px solid rgba(168,85,247,0.1)" }}>
          {isArchived && (
            <div className="flex items-center gap-1.5 mb-3 text-xs font-bold px-3 py-1 rounded-full w-fit" style={{ background: dark ? "rgba(167,139,250,0.1)" : "rgba(168,85,247,0.08)", color: dark ? "#a78bfa" : "#7c3aed" }}>
              <Lock size={11} /> 아카이브 (읽기 전용)
            </div>
          )}
          {post.isNotion && (
            <div className="flex items-center gap-1 mb-2 text-xs font-bold px-3 py-1 rounded-full w-fit" style={{ background: "linear-gradient(90deg,#f59e0b,#fbbf24)", color: "#1c1007" }}>
              <Star size={11} /> 개념글
            </div>
          )}
          <h2 className="text-2xl font-black mb-3" style={{ fontFamily: "'Jua', sans-serif", color: dark ? "#e9d5ff" : "#2d1b4e" }}>
            {post.title}
          </h2>
          <div className="flex flex-wrap gap-4 text-xs" style={{ color: dark ? "#7c5c9a" : "#a78bfa", fontFamily: "'Noto Sans KR', sans-serif" }}>
            <span>✍️ {post.author}</span>
            <span>🕐 {post.date}</span>
            <span className="flex items-center gap-1"><Eye size={12} /> {post.views}</span>
          </div>
        </div>

        {/* Content */}
        <div className="mb-8">
          {renderContent(post.content, dark)}
        </div>

        {/* Like / dislike */}
        <div className="flex items-center gap-3 justify-center mb-6">
          <motion.button
            onClick={handleLike}
            whileHover={isArchived ? {} : { scale: 1.08 }}
            whileTap={isArchived ? {} : { scale: 0.93 }}
            disabled={isArchived}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all"
            style={{
              background: liked ? "linear-gradient(90deg,#7c3aed,#a855f7)" : dark ? "rgba(167,139,250,0.1)" : "rgba(168,85,247,0.08)",
              color: liked ? "#fff" : dark ? "#a78bfa" : "#7c3aed",
              border: liked ? "none" : dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.2)",
              cursor: isArchived ? "not-allowed" : "pointer",
              opacity: isArchived ? 0.5 : 1,
            }}
          >
            <ThumbsUp size={15} /> 추천 {localLikes}
          </motion.button>
          <motion.button
            onClick={handleDislike}
            whileHover={isArchived ? {} : { scale: 1.08 }}
            whileTap={isArchived ? {} : { scale: 0.93 }}
            disabled={isArchived}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all"
            style={{
              background: disliked ? "linear-gradient(90deg,#f43f5e,#ec4899)" : dark ? "rgba(244,63,94,0.08)" : "rgba(244,63,94,0.06)",
              color: disliked ? "#fff" : dark ? "#f87171" : "#f43f5e",
              border: disliked ? "none" : dark ? "1px solid rgba(244,63,94,0.2)" : "1px solid rgba(244,63,94,0.15)",
              cursor: isArchived ? "not-allowed" : "pointer",
              opacity: isArchived ? 0.5 : 1,
            }}
          >
            <ThumbsDown size={15} /> 비추천 {localDislikes}
          </motion.button>
        </div>

        {isArchived && (
          <p className="text-center text-xs" style={{ color: dark ? "#6d5b8a" : "#c4b5fd", fontFamily: "'Noto Sans KR', sans-serif" }}>
            아카이브된 게시글은 추천/비추천을 할 수 없어요.
          </p>
        )}

        {/* Admin reply */}
        {post.adminReply && (
          <div
            className="mt-6 p-5 rounded-2xl"
            style={{
              background: dark ? "rgba(139,92,246,0.12)" : "rgba(139,92,246,0.07)",
              border: dark ? "1px solid rgba(139,92,246,0.25)" : "1px solid rgba(139,92,246,0.15)",
            }}
          >
            <p className="text-xs font-black mb-2" style={{ color: "#a855f7", fontFamily: "'Jua', sans-serif" }}>🛡️ 관리자 답변</p>
            <p className="text-sm leading-relaxed" style={{ color: dark ? "#c4b5fd" : "#6d28d9", fontFamily: "'Noto Sans KR', sans-serif" }}>
              {post.adminReply}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Board page ──────────────────────────
export function Board() {
  const { dark } = useOutletContext<{ dark: boolean }>();
  const { week: weekParam } = useParams();
  const navigate = useNavigate();

  const activeWeek = weekParam ? parseInt(weekParam, 10) : CURRENT_WEEK;
  const isArchived = activeWeek < CURRENT_WEEK;

  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;
  const totalPages = Math.ceil(posts.length / PER_PAGE);
  const pagePosts = posts.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function loadPosts() {
    fetchApi(`/posts?week=${activeWeek}`)
      .then((res) => {
        setPosts(res);
      })
      .catch((err) => {
        console.error("Failed to load posts", err);
      });
  }

  function handleSelectPost(post: Post) {
    setSelectedPost(post);
    fetchApi(`/posts/${post.id}/view`, { method: "PUT" })
      .then((updatedPost) => {
        setPosts(prev => prev.map(p => p.id === post.id ? updatedPost : p));
      })
      .catch(console.error);
  }

  useEffect(() => {
    loadPosts();
  }, [activeWeek]);

  function goWeek(w: number) {
    setSelectedPost(null);
    setPage(1);
    navigate(w === CURRENT_WEEK ? "/board" : `/board/${w}`);
  }

  const labelColor = dark ? "#a78bfa" : "#a855f7";
  const titleColor = dark ? "#e9d5ff" : "#2d1b4e";

  return (
    <div className="flex flex-col items-center py-10 px-4 min-h-screen">
      <div className="w-full max-w-3xl">

        {/* Page title */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: labelColor, fontFamily: "'Noto Sans KR', sans-serif" }}>
            ANONYMOUS BOARD
          </p>
          <h1 className="text-4xl font-black" style={{ fontFamily: "'Jua', sans-serif", color: titleColor }}>
            마음의 편지함 {activeWeek}주차
          </h1>
          {isArchived && (
            <div className="flex items-center gap-1.5 mt-2 text-xs font-bold" style={{ color: dark ? "#a78bfa" : "#7c3aed", fontFamily: "'Noto Sans KR', sans-serif" }}>
              <Archive size={13} /> 아카이브 — 읽기 전용 모드
            </div>
          )}
        </motion.div>

        {/* Week tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {WEEKS.map((w) => (
            <WeekTab
              key={w}
              week={w}
              active={w === activeWeek}
              archived={w < CURRENT_WEEK}
              dark={dark}
              onClick={() => goWeek(w)}
            />
          ))}
        </div>

        {/* Write button (current week only) */}
        {!isArchived && !selectedPost && (
          <div className="flex justify-end mb-4">
            <motion.button
              onClick={() => navigate("/board/write")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white shadow-lg"
              style={{ background: "linear-gradient(90deg,#a855f7,#ec4899)", fontFamily: "'Noto Sans KR', sans-serif" }}
            >
              <Pencil size={14} /> 편지 쓰기
            </motion.button>
          </div>
        )}

        {/* Content area */}
        <AnimatePresence mode="wait">
          {selectedPost ? (
            <PostDetail
              key="detail"
              post={selectedPost}
              dark={dark}
              isArchived={isArchived}
              activeWeek={activeWeek}
              onBack={() => {
                setSelectedPost(null);
                loadPosts();
              }}
              onUpdate={(updated) => setSelectedPost(updated)}
            />
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
            >
              {/* Post table */}
              <div
                className="rounded-3xl overflow-hidden shadow-xl transition-colors duration-500"
                style={{
                  background: dark ? "rgba(30,20,50,0.8)" : "rgba(255,255,255,0.85)",
                  border: dark ? "1px solid rgba(167,139,250,0.15)" : "1px solid rgba(168,85,247,0.1)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <table className="w-full table-fixed">
                  <thead>
                    <tr style={{ borderBottom: dark ? "1px solid rgba(167,139,250,0.15)" : "1px solid rgba(168,85,247,0.1)" }}>
                      {["번호", "제목", "작성자", "조회", "추천"].map((h, i) => (
                        <th
                          key={h}
                          className={`py-3 px-4 text-xs font-bold text-center ${i === 1 ? "text-left" : ""
                            } ${i === 2 ? "hidden sm:table-cell w-32" : ""
                            } ${i === 3 ? "hidden md:table-cell w-16" : ""
                            } ${i === 0 ? "w-14" : ""
                            } ${i === 4 ? "w-16" : ""
                            }`}
                          style={{ color: dark ? "#6d5b8a" : "#c4b5fd", fontFamily: "'Noto Sans KR', sans-serif" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagePosts.map((post, i) => (
                      <PostRow
                        key={post.id}
                        post={post}
                        no={posts.length - ((page - 1) * PER_PAGE + i)}
                        dark={dark}
                        isArchived={isArchived}
                        onClick={() => handleSelectPost(post)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-full transition-opacity disabled:opacity-30"
                    style={{ color: dark ? "#a78bfa" : "#7c3aed" }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className="w-8 h-8 rounded-full text-sm font-bold transition-all"
                      style={{
                        background: p === page ? "linear-gradient(90deg,#a855f7,#ec4899)" : "transparent",
                        color: p === page ? "#fff" : dark ? "#a78bfa" : "#7c3aed",
                        fontFamily: "'Noto Sans KR', sans-serif",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-full transition-opacity disabled:opacity-30"
                    style={{ color: dark ? "#a78bfa" : "#7c3aed" }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
