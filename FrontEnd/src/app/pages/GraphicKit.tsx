import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Mail, Star, Heart, Shield, MessageCircle, Sparkles, Lock, Users, Archive, Pencil } from "lucide-react";
import { useOutletContext, useNavigate } from "react-router";
import imageSrc from "@/imports/image.png";
import { fetchApi } from "../api";
import "@/styles/cylinder.css";

const adminImages = import.meta.glob<{ default: string }>('@/imports/adminProfile/*.{png,jpg,jpeg,webp}', { eager: true });
const adminList = Object.entries(adminImages).map(([path, module]) => {
  const fileName = path.split('/').pop() || '';
  const name = fileName.replace(/\.[^/.]+$/, '');
  const [nickname, guildName] = name.includes('_') ? name.split('_') : [name, ''];
  return {
    name,
    nickname,
    guildName,
    src: module.default,
  };
});



function Blob({ className }: { className: string }) {
  return (
    <div className={`absolute rounded-[60%_40%_30%_70%/60%_30%_70%_40%] blur-2xl opacity-60 ${className}`} />
  );
}

function FloatingIcon({ icon: Icon, color, delay, x, y, size = 28 }: {
  icon: React.ElementType; color: string; delay: number; x: string; y: string; size?: number;
}) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: x, top: y }}
      animate={{ y: [0, -14, 0], rotate: [0, 8, -8, 0] }}
      transition={{ duration: 3.5 + delay, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <div
        className="flex items-center justify-center rounded-2xl shadow-lg"
        style={{ width: size + 16, height: size + 16, background: color }}
      >
        <Icon size={size} color="#fff" strokeWidth={2} />
      </div>
    </motion.div>
  );
}

function FeatureChip({ icon: Icon, label, gradient }: { icon: React.ElementType; label: string; gradient: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.06 }}
      className="flex items-center gap-2 px-4 py-2.5 rounded-full shadow-md text-white text-sm font-bold"
      style={{ background: gradient }}
    >
      <Icon size={16} strokeWidth={2.5} />
      {label}
    </motion.div>
  );
}

function HeroCard() {
  return (
    <div
      className="relative overflow-hidden rounded-3xl shadow-2xl"
      style={{ width: 540, height: 540, background: "linear-gradient(135deg, #a855f7 0%, #ec4899 40%, #f97316 80%, #fbbf24 100%)" }}
    >
      <Blob className="w-72 h-72 -top-16 -left-16 bg-purple-300" />
      <Blob className="w-56 h-56 bottom-8 -right-12 bg-pink-300" />
      <Blob className="w-48 h-48 top-1/2 left-1/3 bg-yellow-200" />
      <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: `url(${imageSrc})` }} />
      <FloatingIcon icon={Star} color="rgba(255,199,0,0.9)" delay={0} x="8%" y="12%" size={22} />
      <FloatingIcon icon={Heart} color="rgba(244,63,94,0.9)" delay={0.6} x="78%" y="8%" size={20} />
      <FloatingIcon icon={Sparkles} color="rgba(139,92,246,0.9)" delay={1.2} x="82%" y="68%" size={20} />
      <FloatingIcon icon={MessageCircle} color="rgba(251,146,60,0.9)" delay={0.4} x="6%" y="72%" size={22} />
      <FloatingIcon icon={Lock} color="rgba(52,211,153,0.9)" delay={1.8} x="58%" y="78%" size={18} />
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-8 text-center">
        <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }} className="mb-5">
          <div className="flex items-center justify-center w-24 h-24 rounded-[2rem] shadow-2xl" style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(12px)", border: "2px solid rgba(255,255,255,0.4)" }}>
            <Mail size={48} color="#fff" strokeWidth={1.8} />
          </div>
        </motion.div>
        <h1 className="text-white leading-tight mb-2" style={{ fontFamily: "'Jua', sans-serif", fontSize: "2.8rem" }}>마음의 편지함</h1>
        <p className="text-white/90 mb-5" style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "1rem", fontWeight: 500 }}>익명으로 마음을 나누는 공간 ✨</p>
        <div className="flex flex-wrap justify-center gap-2 max-w-xs">
          <FeatureChip icon={Shield} label="완전 익명" gradient="linear-gradient(90deg,#6d28d9,#7c3aed)" />
          <FeatureChip icon={Users} label="주차별 편지함" gradient="linear-gradient(90deg,#db2777,#ec4899)" />
          <FeatureChip icon={Star} label="개념글 선정" gradient="linear-gradient(90deg,#d97706,#f59e0b)" />
          <FeatureChip icon={Archive} label="아카이브 보관" gradient="linear-gradient(90deg,#059669,#10b981)" />
        </div>
      </div>
      <div className="absolute top-4 right-4 w-12 h-12 rounded-full border-4 border-white/30" />
      <div className="absolute top-6 right-6 w-4 h-4 rounded-full bg-white/40" />
      <div className="absolute bottom-4 left-4 w-8 h-8 rounded-full border-4 border-white/30" />
    </div>
  );
}

function StoryCard({ nickname }: { nickname: string }) {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden rounded-3xl shadow-2xl flex flex-col" style={{ width: 280, height: 340, background: "linear-gradient(160deg, #1e1b4b 0%, #312e81 35%, #7c3aed 70%, #c026d3 100%)" }}>
      <Blob className="w-48 h-48 -top-10 -right-10 bg-violet-400 opacity-50" />
      <Blob className="w-40 h-40 bottom-4 -left-8 bg-fuchsia-400 opacity-50" />
      <div className="relative z-10 flex flex-col items-center justify-between h-full p-5 text-center gap-2">
        <div className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", fontFamily: "'Noto Sans KR', sans-serif" }}>
          ✉ 마음의 편지함 1주차
        </div>
        <div className="flex flex-col items-center gap-2">
          <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }} className="text-4xl">📬</motion.div>
          <div>
            <p className="text-white/60 text-[9px] mb-0.5" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>당신의 이름은</p>
            <p className="text-white text-base font-black truncate max-w-[220px]" style={{ fontFamily: "'Jua', sans-serif" }}>"{nickname || "익명 작가"}"</p>
            <p className="text-white/60 text-[9px] mt-0.5" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>입니다</p>
          </div>
          <div className="w-12 h-0.5 bg-white/10 rounded-full" />
          <p className="text-white/80 text-[11px] leading-relaxed" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>아래의 규칙을 읽고,<br />익명으로 편지를 남겨<br />하고 싶은 말을 적으세요<br />(악의적,비방글 금지)</p>
        </div>
        <motion.button
          onClick={() => navigate("/board/write")}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="w-full py-2 rounded-xl font-bold text-xs text-purple-900 shadow-md"
          style={{ background: "linear-gradient(90deg, #fde68a, #fbbf24)", fontFamily: "'Jua', sans-serif" }}
        >
          편지 쓰러 가기 →
        </motion.button>
      </div>
    </div>
  );
}

function FeatureBannerCard({ dark }: { dark: boolean }) {
  const rules = [
    { text: "모든 편지함은 익명으로 보장합니다.", icon: Shield, color: "from-purple-500 to-indigo-500" },
    { text: "아무런 주제도 가능합니다.", icon: Sparkles, color: "from-pink-500 to-rose-500" },
    { text: "매주 월요일 새 편지함이 열리고, 지난 편지함은 읽기만 가능합니다.", icon: Archive, color: "from-blue-500 to-teal-500" },
    { text: "악의적 글을 관리자에게 신고할 수 있습니다.", icon: MessageCircle, color: "from-amber-500 to-orange-500" },
    { text: "신고를 통해 접수된 악인은 제재가 가해집니다. 주의해주세요.", icon: Lock, color: "from-rose-500 to-red-500" },
  ];

  return (
    <div
      className="relative overflow-hidden rounded-3xl shadow-2xl transition-colors duration-500 flex flex-col p-5 justify-between"
      style={{
        width: 540,
        height: 540,
        background: dark
          ? "linear-gradient(120deg, #0f0a1e 0%, #1a0f2e 50%, #0d1a1a 100%)"
          : "linear-gradient(120deg, #fdf4ff 0%, #ffe4e6 50%, #fef3c7 100%)",
        border: dark ? "1px solid rgba(167,139,250,0.15)" : "1px solid rgba(168,85,247,0.1)",
      }}
    >
      <Blob className={`w-48 h-48 -top-10 -right-10 ${dark ? "bg-violet-900/40" : "bg-purple-200/50"}`} />
      <Blob className={`w-40 h-40 bottom-0 left-0 ${dark ? "bg-fuchsia-900/30" : "bg-pink-200/40"}`} />

      <div className="relative z-10 flex flex-col justify-between h-full py-1">
        {/* Title */}
        <div className="text-center">
          <p
            className="font-black text-xl tracking-tight mb-1.5"
            style={{ fontFamily: "'Jua', sans-serif", color: dark ? "#f3e8ff" : "#4c1d95" }}
          >
            ✨ 이야기방 마음의 편지함 개설 ✨
          </p>
          <p
            className="text-xs leading-relaxed max-w-lg mx-auto"
            style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              color: dark ? "rgba(233,213,255,0.75)" : "#6b21a8",
              fontWeight: 500
            }}
          >
            📮 이야기방 사람들의 고충, 불편사항, 건의사항 등등 이야기방 교주님들이 하고 싶은 말을 받아주는 "마음의 편지함" 이 개설되었습니다. 📮
          </p>
        </div>

        {/* Rules Blocks */}
        <div className="flex flex-col gap-2.5">
          {rules.map((r, idx) => {
            const Icon = r.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.01, x: 2 }}
                className="flex items-center gap-3 p-3 rounded-2xl border transition-all shadow-sm"
                style={{
                  background: dark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.65)",
                  borderColor: dark ? "rgba(167,139,250,0.15)" : "rgba(168,85,247,0.12)",
                }}
              >
                {/* Icon wrapper */}
                <div
                  className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-tr ${r.color} text-white shadow-sm`}
                >
                  <Icon size={14} strokeWidth={2.5} />
                </div>

                {/* Rule Text */}
                <span
                  className="text-xs font-bold leading-normal"
                  style={{
                    fontFamily: "'Noto Sans KR', sans-serif",
                    color: dark ? "#e9d5ff" : "#4c1d95"
                  }}
                >
                  {r.text}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WritingCard({ dark }: { dark: boolean }) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl shadow-2xl transition-colors duration-500"
      style={{
        width: 280,
        height: 176,
        background: dark
          ? "linear-gradient(135deg, #1c1007 0%, #2d1f00 50%, #3d2a00 100%)"
          : "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fbbf24 100%)"
      }}
    >
      <Blob className={`w-32 h-32 -top-8 -right-8 ${dark ? "bg-amber-900/40" : "bg-orange-200/50"}`} />
      <div className="relative z-10 flex flex-col items-center justify-between h-full p-4 text-center gap-2">
        {/* Header row with icon & title */}
        <div className="flex items-center gap-2 mt-1">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2.2, repeat: Infinity }} className="text-3xl">✍️</motion.div>
          <p className="font-black text-base" style={{ fontFamily: "'Jua', sans-serif", color: dark ? "#fde68a" : "#78350f" }}>블록 기반 에디터</p>
        </div>

        {/* Horizontal block list */}
        <div className="flex flex-wrap gap-1.5 justify-center w-full">
          {["📝 텍스트 블록", "🖼️ 미디어 블록", "📺 임베드"].map((item) => (
            <div
              key={item}
              className="flex items-center px-2 py-1 rounded-xl text-[10px] font-bold"
              style={{
                background: dark ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.5)",
                color: dark ? "#fbbf24" : "#78350f",
                fontFamily: "'Noto Sans KR', sans-serif"
              }}
            >
              {item}
            </div>
          ))}
        </div>

        {/* Footer status */}
        <div className="flex items-center gap-1 mb-1">
          <Pencil size={11} style={{ color: dark ? "#f59e0b" : "#b45309" }} />
          <span className="text-[10px]" style={{ color: dark ? "#f59e0b" : "#b45309", fontFamily: "'Noto Sans KR', sans-serif" }}>자동 임시저장 지원</span>
        </div>
      </div>
    </div>
  );
}

function AdminCard() {
  const navigate = useNavigate();
  return (
    <div
      className="relative overflow-hidden rounded-3xl shadow-2xl cursor-pointer"
      onClick={() => navigate("/admin")}
      style={{
        width: 280,
        height: 196,
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)",
        border: "1px solid rgba(167,139,250,0.2)"
      }}
    >
      <Blob className="w-32 h-32 -top-8 -right-8 bg-violet-500 opacity-40" />
      <div className="relative z-10 flex flex-col justify-between h-full p-4.5 text-center">
        {/* Header row with icon & title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <Shield size={20} color="#c4b5fd" />
          </div>
          <div className="text-left">
            <p className="text-white font-black text-base leading-tight" style={{ fontFamily: "'Jua', sans-serif" }}>관리 데스크 🛡️</p>
            <p className="text-violet-300 text-[9px] leading-tight mt-0.5" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>공식 답변 및 제재 도구</p>
          </div>
        </div>

        {/* Description text */}
        <p className="text-violet-200/80 text-[10px] leading-normal text-left" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
          닉네임 강제 변경, 부적절한 게시글 및 어뷰징 추천 이력을 실시간 통제합니다.
        </p>

        {/* Horizontal tag list */}
        <div className="flex flex-wrap gap-1.5 justify-center w-full mt-1">
          {["답변 권한", "사용자 제재", "활동 추적"].map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 rounded-lg text-[9px] font-bold text-violet-900"
              style={{
                background: "linear-gradient(90deg, #c4b5fd, #a78bfa)",
                fontFamily: "'Noto Sans KR', sans-serif"
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityCard({ dark }: { dark: boolean }) {
  const [stats, setStats] = useState({
    activeThisWeek: 0,
    postsThisWeek: 0,
    totalUsers: 0,
    totalPosts: 0
  });

  useEffect(() => {
    Promise.all([
      fetchApi("/admin/users"),
      fetchApi("/admin/posts"),
      fetchApi("/admin/reactions")
    ])
      .then(([usersData, postsData, reactionsData]) => {
        const CURRENT_WEEK = 1;
        const totalUsers = Object.keys(usersData).length;
        const totalPosts = postsData.length;
        const postsThisWeek = postsData.filter((p: any) => p.week === CURRENT_WEEK).length;

        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const usersThisWeek = Object.values(usersData)
          .filter((u: any) => new Date(u.createdAt) >= oneWeekAgo)
          .map((u: any) => u.uuid);

        const postAuthorsThisWeek = postsData
          .filter((p: any) => p.week === CURRENT_WEEK)
          .map((p: any) => p.authorUuid);

        const reactUsersThisWeek = reactionsData
          .filter((r: any) => r.week === CURRENT_WEEK)
          .map((r: any) => r.userUuid);

        const activeUsersSet = new Set([...usersThisWeek, ...postAuthorsThisWeek, ...reactUsersThisWeek]);

        setStats({
          activeThisWeek: activeUsersSet.size,
          postsThisWeek,
          totalUsers,
          totalPosts
        });
      })
      .catch(console.error);
  }, []);

  const statItems = [
    { label: "이번 주 접속자", val: `${stats.activeThisWeek}명`, icon: Users, textColor: "text-blue-400", iconColor: "rgba(59,130,246,0.15)" },
    { label: "이번 주 편지수", val: `${stats.postsThisWeek}개`, icon: Mail, textColor: "text-purple-400", iconColor: "rgba(168,85,247,0.15)" },
    { label: "전체 사용자", val: `${stats.totalUsers}명`, icon: Users, textColor: "text-emerald-400", iconColor: "rgba(16,185,129,0.15)" },
    { label: "전체 편지수", val: `${stats.totalPosts}개`, icon: Archive, textColor: "text-amber-400", iconColor: "rgba(245,158,11,0.15)" },
  ];

  return (
    <div
      className="relative overflow-hidden rounded-3xl shadow-2xl transition-colors duration-500 p-4 flex flex-col justify-between"
      style={{
        width: 280,
        height: 320,
        background: dark
          ? "linear-gradient(120deg, #090514 0%, #130a24 50%, #080d0d 100%)"
          : "linear-gradient(120deg, #faf0ff 0%, #fff0f3 50%, #fffbeb 100%)",
        border: dark ? "1px solid rgba(167,139,250,0.15)" : "1px solid rgba(168,85,247,0.1)",
      }}
    >
      <Blob className={`w-32 h-32 -top-6 -right-6 ${dark ? "bg-indigo-900/30" : "bg-indigo-100/40"}`} />

      <div className="relative z-10 flex flex-col gap-2.5 h-full justify-between">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black text-white bg-purple-600 shadow-sm tracking-wider">
            📊 활동 정보
          </span>
          <span className="text-[8px] opacity-45" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
            실시간 집계
          </span>
        </div>

        {/* Vertical list of 4 items */}
        <div className="flex flex-col gap-1.5">
          {statItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.01, x: 2 }}
                className="px-3 py-2 rounded-xl border transition-all flex items-center justify-between shadow-sm"
                style={{
                  background: dark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.65)",
                  borderColor: dark ? "rgba(167,139,250,0.06)" : "rgba(168,85,247,0.06)",
                }}
              >
                <span className="text-[10px] opacity-75 font-bold" style={{ fontFamily: "'Noto Sans KR', sans-serif", color: dark ? '#c4b5fd' : '#4c1d95' }}>
                  {item.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black" style={{ fontFamily: "'Jua', sans-serif", color: dark ? '#e9d5ff' : '#2d1b4e' }}>
                    {item.val}
                  </span>
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: item.iconColor }}
                  >
                    <Icon size={12} className={item.textColor} strokeWidth={2.5} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AdminCylinder({ dark }: { dark: boolean }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(60);
  const [perspective, setPerspective] = useState(1200);
  const [rotateX, setRotateX] = useState(0);
  const [manualY, setManualY] = useState(0);
  const [radius, setRadius] = useState(400);

  const handlePrev = () => {
    setIsPlaying(false);
    setManualY((prev) => prev - (360 / adminList.length));
  };

  const handleNext = () => {
    setIsPlaying(false);
    setManualY((prev) => prev + (360 / adminList.length));
  };

  return (
    <div className="w-full flex flex-col items-center mt-20 max-w-4xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: "'Jua', sans-serif", color: dark ? "#e9d5ff" : "#3b0764" }}>
          트릭컬 이야기방에 고마운 분들 💖
        </h2>
        <p className="text-sm font-medium opacity-75" style={{ fontFamily: "'Noto Sans KR', sans-serif", color: dark ? "#a78bfa" : "#a855f7" }}>
          이야기방을 언제나 빛내주시고 이끌어주시는 소중한 분들입니다.
        </p>
      </div>

      <div
        className="cylinder-viewport"
        style={{
          perspective: `${perspective}px`,
        }}
      >
        <div className="cylinder-floor-glow" />

        <div
          className={`cylinder-container ${isPlaying ? 'cylinder-rotating' : ''}`}
          style={{
            transform: !isPlaying
              ? `rotateX(${rotateX}deg) rotateY(${manualY}deg)`
              : undefined,
            ...({
              '--speed': `${speed}s`,
              '--play-state': isPlaying ? 'running' : 'paused',
              '--rotate-x': `${rotateX}deg`,
              '--manual-y': `${manualY}deg`,
            } as React.CSSProperties)
          }}
        >
          {adminList.map((item, idx) => {
            const angle = idx * (360 / adminList.length);
            return (
              <div
                key={item.name}
                className="cylinder-item"
                style={{
                  ...({
                    '--angle': `${angle}deg`,
                    '--radius': `${radius}px`,
                  } as React.CSSProperties)
                }}
              >
                <div className="cylinder-item-wrapper">
                  <img src={item.src} alt={item.name} className="cylinder-item-img" />
                </div>
                <div className="cylinder-item-label">
                  <span className="cylinder-nickname-tag">{item.nickname}</span>
                  {item.guildName && (
                    <span className="cylinder-guild-tag">{item.guildName}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Control Panel */}
      <div
        className="mt-8 flex flex-col items-center gap-4 p-5 rounded-3xl border w-full max-w-xl shadow-md transition-all duration-300"
        style={{
          background: dark ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.65)",
          borderColor: dark ? "rgba(167, 139, 250, 0.15)" : "rgba(168, 85, 247, 0.12)",
        }}
      >
        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrev}
            className="px-4 py-1.5 rounded-xl font-bold text-xs shadow-sm border transition-all hover:opacity-80 active:scale-95 cursor-pointer"
            style={{
              background: dark ? "rgba(255,255,255,0.05)" : "#fff",
              borderColor: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
              color: dark ? "#e9d5ff" : "#4c1d95",
            }}
          >
            ◀ 이전
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-6 py-2 rounded-xl font-black text-xs shadow-md transition-all text-white bg-purple-600 hover:bg-purple-700 active:scale-95 cursor-pointer"
            style={{
              fontFamily: "'Jua', sans-serif",
            }}
          >
            {isPlaying ? "⏸ 일시정지" : "▶ 자동회전"}
          </button>

          <button
            onClick={handleNext}
            className="px-4 py-1.5 rounded-xl font-bold text-xs shadow-sm border transition-all hover:opacity-80 active:scale-95 cursor-pointer"
            style={{
              background: dark ? "rgba(255,255,255,0.05)" : "#fff",
              borderColor: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
              color: dark ? "#e9d5ff" : "#4c1d95",
            }}
          >
            다음 ▶
          </button>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-2 gap-4 w-full text-xs font-semibold mt-2" style={{ color: dark ? "#c4b5fd" : "#4c1d95" }}>
          <div className="flex flex-col gap-1">
            <span>회전 속도 ({speed}초)</span>
            <input
              type="range"
              min="10"
              max="110"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer h-1 bg-purple-200 dark:bg-purple-950 rounded-lg appearance-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span>원근감 (Perspective)</span>
            <input
              type="range"
              min="400"
              max="2000"
              value={perspective}
              onChange={(e) => setPerspective(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer h-1 bg-purple-200 dark:bg-purple-950 rounded-lg appearance-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span>상하 각도 ({rotateX}도)</span>
            <input
              type="range"
              min="-30"
              max="30"
              value={rotateX}
              onChange={(e) => {
                setIsPlaying(false);
                setRotateX(Number(e.target.value));
              }}
              className="w-full accent-purple-500 cursor-pointer h-1 bg-purple-200 dark:bg-purple-950 rounded-lg appearance-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span>실린더 반경 ({radius}px)</span>
            <input
              type="range"
              min="200"
              max="600"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer h-1 bg-purple-200 dark:bg-purple-950 rounded-lg appearance-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function GraphicKit() {
  const { dark, nickname } = useOutletContext<{ dark: boolean; nickname: string }>();
  const labelColor = dark ? "#a78bfa" : "#a855f7";
  const titleColor = dark ? "#e9d5ff" : "#3b0764";
  const subtitleColor = dark ? "#7c5c9a" : "#a855f7";
  const footerColor = dark ? "#4c3670" : "#c4b5fd";

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-10">
        <p className="font-bold text-sm mb-1 tracking-widest uppercase" style={{ fontFamily: "'Noto Sans KR', sans-serif", letterSpacing: "0.15em", color: labelColor }}>트릭컬 이야기방이 제작한</p>
        <h1 className="text-5xl" style={{ fontFamily: "'Jua', sans-serif", color: titleColor }}>마음의 편지함</h1>
        <p className="mt-2 text-base" style={{ color: subtitleColor }}>제작자 : 도둑이야 🖋️ 배포자 : 주판케 💻</p>
      </motion.div>

      <div className="flex flex-col items-center gap-6 w-full max-w-4xl">
        {/* Row 1: HeroCard (Left) + StoryCard & WritingCard (Right) */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="flex flex-wrap justify-center gap-6">
          <HeroCard />
          <div className="flex flex-col gap-6">
            <StoryCard nickname={nickname} />
            <WritingCard dark={dark} />
          </div>
        </motion.div>

        {/* Row 2: FeatureBannerCard (Left) + ActivityCard & AdminCard (Right) */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }} className="flex flex-wrap justify-center gap-6">
          <FeatureBannerCard dark={dark} />
          <div className="flex flex-col gap-6">
            <ActivityCard dark={dark} />
            <AdminCard />
          </div>
        </motion.div>
      </div>

      <AdminCylinder dark={dark} />

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-12 text-xs" style={{ color: footerColor, fontFamily: "'Noto Sans KR', sans-serif" }}>
        트릭컬 이야기방 오픈카카오톡 : <a href="https://open.kakao.com/o/g1kO7zlg" style={{ color: footerColor }}>https://open.kakao.com/o/g1kO7zlg</a>
      </motion.p>
    </div>
  );
}

