import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Sun, Moon, Mail, LayoutList, User, EyeOff, Menu, X } from "lucide-react";
import { fetchApi } from "./api";
import { GlitchText } from "./components/GlitchText";

export function Root() {
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem("LOH_DARK_MODE");
    return saved !== null ? saved === "true" : true;
  });
  const navigate = useNavigate();
  const location = useLocation();
  const isBoard = location.pathname.startsWith("/board");
  const isAdmin = location.pathname.startsWith("/admin");
  const isUpdates = location.pathname.startsWith("/updates");
  const isApostlesTest = location.pathname.startsWith("/test-apostles");
  const isGraphicKit = !isBoard && !isAdmin && !isUpdates && !isApostlesTest;

  const toggleDark = () => {
    setDark((prev) => {
      const nextVal = !prev;
      localStorage.setItem("LOH_DARK_MODE", String(nextVal));
      return nextVal;
    });
  };

  const [nickname, setNickname] = useState("");
  const [userUuid, setUserUuid] = useState("");
  const [role, setRole] = useState("");
  const [incognito, setIncognito] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentWeek, setCurrentWeek] = useState<number>(1);

  useEffect(() => {
    fetchApi("/current-week")
      .then((res: any) => {
        if (res.currentWeek) {
          setCurrentWeek(res.currentWeek);
        }
      })
      .catch(console.error);
  }, []);


  useEffect(() => {
    setMenuOpen(false); // Close menu on navigation
    const uuid = localStorage.getItem("LOH_USER_UUID");
    const name = localStorage.getItem("LOH_USER_NICKNAME");
    const incog = localStorage.getItem("LOH_ADMIN_INCOGNITO") === "true";
    setIncognito(incog);

    // If incognito is active, do not send nickname to server (avoid persisting or logging incog name)
    const body: any = { uuid: uuid || undefined };
    if (!incog && name) { body.nickname = name; }

    fetchApi("/users", {
      method: "POST",
      body: JSON.stringify(body)
    })
      .then((res: any) => {
        if (res.uuid) {
          localStorage.setItem("LOH_USER_UUID", res.uuid);
          setUserUuid(res.uuid);
        }
        // Only accept server nickname when not incognito
        if (res.nickname && !incog) {
          localStorage.setItem("LOH_USER_NICKNAME", res.nickname);
          setNickname(res.nickname);
        } else if (name && incog) {
          // keep incognito nickname from localStorage
          setNickname(name);
        }
        if (res.role) {
          setRole(res.role);
        }
      })
      .catch(console.error);
  }, [location.pathname]);

  // Generate a nickname using the server-side generator (falls back to a local random suffix)
  async function genRandomNickname() {
    try {
      const res: any = await fetchApi("/generate-nickname");
      return res.nickname || `익명-${Math.random().toString(36).slice(2,8)}`;
    } catch (e) {
      return `익명-${Math.random().toString(36).slice(2,8)}`;
    }
  }

  async function toggleIncognito() {
    if (role !== "admin") return;
    if (!incognito) {
      // entering incognito: save real nickname in session and set a generated nickname locally
      sessionStorage.setItem("LOH_ADMIN_REAL_NICKNAME", nickname || "");
      const rn = await genRandomNickname();
      localStorage.setItem("LOH_USER_NICKNAME", rn);
      localStorage.setItem("LOH_ADMIN_INCOGNITO", "true");
      setNickname(rn);
      setIncognito(true);
    } else {
      // exiting incognito: restore real nickname
      const real = sessionStorage.getItem("LOH_ADMIN_REAL_NICKNAME") || nickname || "관리자";
      localStorage.setItem("LOH_USER_NICKNAME", real);
      localStorage.setItem("LOH_ADMIN_INCOGNITO", "false");
      setNickname(real);
      sessionStorage.removeItem("LOH_ADMIN_REAL_NICKNAME");
      setIncognito(false);
    }
  }

  return (
    <div
      className="min-h-screen w-full transition-colors duration-500"
      style={{
        background: dark
          ? "linear-gradient(160deg, #0a0614 0%, #130a24 30%, #0d0d2b 60%, #0f0a00 100%)"
          : "linear-gradient(160deg, #fdf4ff 0%, #ffe4f6 30%, #e0e7ff 60%, #fdf6e3 100%)",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}
    >
      {/* Top navigation bar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 transition-colors duration-500"
        style={{
          background: dark ? "rgba(10,6,20,0.85)" : "rgba(253,246,255,0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: dark ? "1px solid rgba(167,139,250,0.15)" : "1px solid rgba(168,85,247,0.12)",
        }}
      >
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 transition-opacity hover:opacity-75"
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)" }}
          >
            <Mail size={16} color="#fff" strokeWidth={2} />
          </div>
          <span
            className="font-black text-base"
            style={{ fontFamily: "'Jua', sans-serif", color: dark ? "#e9d5ff" : "#3b0764" }}
          >
            마음의 편지함
          </span>
        </button>

        {/* Desktop Nav links + toggle */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all"
            style={{
              background: isGraphicKit
                ? "linear-gradient(90deg,#a855f7,#ec4899)"
                : "transparent",
              color: isGraphicKit ? "#fff" : dark ? "#a78bfa" : "#7c3aed",
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            홈
          </button>
          <button
            onClick={() => navigate("/board")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all"
            style={{
              background: isBoard
                ? "linear-gradient(90deg,#a855f7,#ec4899)"
                : "transparent",
              color: isBoard ? "#fff" : dark ? "#a78bfa" : "#7c3aed",
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            <LayoutList size={14} />
            편지함 게시판
          </button>
          <button
            onClick={() => navigate("/updates")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all"
            style={{
              background: isUpdates
                ? "linear-gradient(90deg,#a855f7,#ec4899)"
                : "transparent",
              color: isUpdates ? "#fff" : dark ? "#a78bfa" : "#7c3aed",
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            업데이트 요약
          </button>
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all"
            style={{
              background: isAdmin
                ? "linear-gradient(90deg,#a855f7,#ec4899)"
                : "transparent",
              color: isAdmin ? "#fff" : dark ? "#a78bfa" : "#7c3aed",
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            관리자
          </button>
          <button
            onClick={() => navigate("/test-apostles")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all"
            style={{
              background: isApostlesTest
                ? "linear-gradient(90deg,#a855f7,#ec4899)"
                : "transparent",
              color: isApostlesTest ? "#fff" : dark ? "#a78bfa" : "#7c3aed",
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            사도 테스트
          </button>

          {/* User profile badge */}
          <div
            className="hidden sm:flex items-center gap-2 rounded-full border text-xs font-black transition-all shadow-sm"
            style={{
              background: dark ? "rgba(167,139,250,0.08)" : "rgba(168,85,247,0.05)",
              borderColor: dark ? "rgba(167,139,250,0.2)" : "rgba(168,85,247,0.15)",
              color: dark ? "#c4b5fd" : "#6d28d9",
              fontFamily: "'Noto Sans KR', sans-serif",
              minWidth: 240,
              maxWidth: 480,
              height: 40,
              boxSizing: 'border-box',
              padding: '6px 12px',
              overflow: 'hidden',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span style={{display: 'inline-block', maxWidth: '360px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle'}}><GlitchText text={nickname} /></span>
          </div>

          {/* Dark mode toggle */}
          <motion.button
            onClick={toggleDark}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            className="flex items-center gap-1.5 rounded-full text-sm font-bold shadow-md transition-colors duration-300"
            style={{
              background: dark
                ? "linear-gradient(90deg,#fbbf24,#f59e0b)"
                : "linear-gradient(90deg,#312e81,#4c1d95)",
              color: dark ? "#1e1b4b" : "#fff",
              fontFamily: "'Noto Sans KR', sans-serif",
              minWidth: 72,
              height: 40,
              boxSizing: 'border-box',
              padding: '6px 12px',
              justifyContent: 'center',
            }}
          >
            <motion.span
              key={dark ? "sun" : "moon"}
              initial={{ rotate: -30, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              {dark ? <Sun size={14} strokeWidth={2.5} /> : <Moon size={14} strokeWidth={2.5} />}
            </motion.span>
            {dark ? "라이트" : "다크"}
          </motion.button>

          {/* Admin incognito toggle */}
          {role === "admin" && (
            <motion.button
              onClick={toggleIncognito}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold shadow-md transition-colors duration-300"
              style={{
                background: incognito ? "linear-gradient(90deg,#6b7280,#374151)" : "transparent",
                color: incognito ? "#fff" : dark ? "#a78bfa" : "#7c3aed",
                fontFamily: "'Noto Sans KR', sans-serif",
                border: incognito ? "1px solid rgba(255,255,255,0.06)" : undefined,
                minWidth: 120,
                height: 40,
                boxSizing: 'border-box',
                padding: '6px 12px',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
              title={incognito ? "익명 모드 종료" : "익명으로 (관리자만)"}
            >
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
                {incognito ? <EyeOff size={14} /> : <User size={14} />}
              </motion.span>
              {incognito ? "익명 중" : "익명으로"}
            </motion.button>
          )}
        </div>

        {/* Mobile Nav Actions (Always visible Dark toggle + Hamburger) */}
        <div className="flex md:hidden items-center gap-2">
          {/* Dark mode toggle */}
          <motion.button
            onClick={toggleDark}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            className="flex items-center justify-center rounded-full text-sm font-bold shadow-md transition-colors duration-300"
            style={{
              background: dark
                ? "linear-gradient(90deg,#fbbf24,#f59e0b)"
                : "linear-gradient(90deg,#312e81,#4c1d95)",
              color: dark ? "#1e1b4b" : "#fff",
              width: 40,
              height: 40,
            }}
            title={dark ? "라이트 모드로 변경" : "다크 모드로 변경"}
          >
            <motion.span
              key={dark ? "sun" : "moon"}
              initial={{ rotate: -30, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              {dark ? <Sun size={15} strokeWidth={2.5} /> : <Moon size={15} strokeWidth={2.5} />}
            </motion.span>
          </motion.button>

          {/* Hamburger button */}
          <motion.button
            onClick={() => setMenuOpen((o) => !o)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center rounded-full border transition-all shadow-sm"
            style={{
              background: dark ? "rgba(167,139,250,0.08)" : "rgba(168,85,247,0.05)",
              borderColor: dark ? "rgba(167,139,250,0.2)" : "rgba(168,85,247,0.15)",
              color: dark ? "#c4b5fd" : "#6d28d9",
              width: 40,
              height: 40,
            }}
            title={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>
        </div>

        {/* Mobile dropdown menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute top-full left-0 right-0 z-40 md:hidden flex flex-col gap-3 px-6 py-4 shadow-xl border-b transition-colors duration-500 overflow-hidden"
              style={{
                background: dark ? "rgba(10,6,20,0.95)" : "rgba(253,246,255,0.95)",
                backdropFilter: "blur(16px)",
                borderBottom: dark ? "1px solid rgba(167,139,250,0.15)" : "1px solid rgba(168,85,247,0.12)",
                borderColor: dark ? "rgba(167,139,250,0.15)" : "rgba(168,85,247,0.12)",
              }}
            >
              {/* Home Link */}
              <button
                onClick={() => { navigate("/"); setMenuOpen(false); }}
                className="w-full flex items-center justify-center py-2.5 rounded-2xl text-sm font-bold transition-all shadow-sm"
                style={{
                  background: isGraphicKit
                    ? "linear-gradient(90deg,#a855f7,#ec4899)"
                    : dark ? "rgba(167,139,250,0.08)" : "rgba(168,85,247,0.05)",
                  color: isGraphicKit ? "#fff" : dark ? "#a78bfa" : "#7c3aed",
                  border: isGraphicKit ? "none" : dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.15)",
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}
              >
                홈
              </button>

              {/* Board Link */}
              <button
                onClick={() => { navigate("/board"); setMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-sm"
                style={{
                  background: isBoard
                    ? "linear-gradient(90deg,#a855f7,#ec4899)"
                    : dark ? "rgba(167,139,250,0.08)" : "rgba(168,85,247,0.05)",
                  color: isBoard ? "#fff" : dark ? "#a78bfa" : "#7c3aed",
                  border: isBoard ? "none" : dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.15)",
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}
              >
                <LayoutList size={14} />
                편지함 게시판
              </button>

              {/* Updates Link */}
              <button
                onClick={() => { navigate("/updates"); setMenuOpen(false); }}
                className="w-full flex items-center justify-center py-2.5 rounded-2xl text-sm font-bold transition-all shadow-sm"
                style={{
                  background: isUpdates
                    ? "linear-gradient(90deg,#a855f7,#ec4899)"
                    : dark ? "rgba(167,139,250,0.08)" : "rgba(168,85,247,0.05)",
                  color: isUpdates ? "#fff" : dark ? "#a78bfa" : "#7c3aed",
                  border: isUpdates ? "none" : dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.15)",
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}
              >
                업데이트 요약
              </button>

              {/* Admin Link */}
              <button
                onClick={() => { navigate("/admin"); setMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-sm"
                style={{
                  background: isAdmin
                    ? "linear-gradient(90deg,#a855f7,#ec4899)"
                    : dark ? "rgba(167,139,250,0.08)" : "rgba(168,85,247,0.05)",
                  color: isAdmin ? "#fff" : dark ? "#a78bfa" : "#7c3aed",
                  border: isAdmin ? "none" : dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.15)",
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}
              >
                관리자
              </button>

              {/* Apostles Test Link */}
              <button
                onClick={() => { navigate("/test-apostles"); setMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-sm"
                style={{
                  background: isApostlesTest
                    ? "linear-gradient(90deg,#a855f7,#ec4899)"
                    : dark ? "rgba(167,139,250,0.08)" : "rgba(168,85,247,0.05)",
                  color: isApostlesTest ? "#fff" : dark ? "#a78bfa" : "#7c3aed",
                  border: isApostlesTest ? "none" : dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.15)",
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}
              >
                사도 테스트
              </button>

              {/* User Profile Badge (Full Width on mobile) */}
              {nickname && (
                <div
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border text-xs font-black transition-all shadow-sm"
                  style={{
                    background: dark ? "rgba(167,139,250,0.08)" : "rgba(168,85,247,0.05)",
                    borderColor: dark ? "rgba(167,139,250,0.2)" : "rgba(168,85,247,0.15)",
                    color: dark ? "#c4b5fd" : "#6d28d9",
                    fontFamily: "'Noto Sans KR', sans-serif",
                    padding: '10px 12px',
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="truncate max-w-[280px]"><GlitchText text={nickname} /></span>
                </div>
              )}

              {/* Admin Incognito Toggle (Full Width on mobile) */}
              {role === "admin" && (
                <motion.button
                  onClick={toggleIncognito}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-bold shadow-sm transition-all"
                  style={{
                    background: incognito ? "linear-gradient(90deg,#6b7280,#374151)" : dark ? "rgba(167,139,250,0.08)" : "rgba(168,85,247,0.05)",
                    color: incognito ? "#fff" : dark ? "#a78bfa" : "#7c3aed",
                    border: incognito ? "1px solid rgba(255,255,255,0.06)" : dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.15)",
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}
                  title={incognito ? "익명 모드 종료" : "익명으로 (관리자만)"}
                >
                  {incognito ? <EyeOff size={14} /> : <User size={14} />}
                  <span>{incognito ? "익명 모드 사용 중" : "익명으로 글쓰기"}</span>
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Page content — offset for fixed nav */}
      <div className="pt-16">
        <Outlet context={{ dark, nickname, userUuid, role, incognito, currentWeek }} />
      </div>
    </div>
  );
}
