import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { Sun, Moon, Mail, LayoutList } from "lucide-react";
import { fetchApi } from "./api";

export function Root() {
  const [dark, setDark] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isBoard = location.pathname.startsWith("/board");
  const isAdmin = location.pathname.startsWith("/admin");
  const isGraphicKit = !isBoard && !isAdmin;

  const [nickname, setNickname] = useState("");
  const [userUuid, setUserUuid] = useState("");

  useEffect(() => {
    const uuid = localStorage.getItem("LOH_USER_UUID");
    const name = localStorage.getItem("LOH_USER_NICKNAME");

    fetchApi("/users", {
      method: "POST",
      body: JSON.stringify({
        uuid: uuid || undefined,
        nickname: name || undefined
      })
    })
      .then((res: any) => {
        if (res.uuid) {
          localStorage.setItem("LOH_USER_UUID", res.uuid);
          setUserUuid(res.uuid);
        }
        if (res.nickname) {
          localStorage.setItem("LOH_USER_NICKNAME", res.nickname);
          setNickname(res.nickname);
        }
      })
      .catch(console.error);
  }, [location.pathname]);

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

        {/* Nav links + toggle */}
        <div className="flex items-center gap-3">
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

          {/* User profile badge */}
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black transition-all shadow-sm"
            style={{
              background: dark ? "rgba(167,139,250,0.08)" : "rgba(168,85,247,0.05)",
              borderColor: dark ? "rgba(167,139,250,0.2)" : "rgba(168,85,247,0.15)",
              color: dark ? "#c4b5fd" : "#6d28d9",
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>{nickname}</span>
          </div>

          {/* Dark mode toggle */}
          <motion.button
            onClick={() => setDark((d) => !d)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold shadow-md transition-colors duration-300"
            style={{
              background: dark
                ? "linear-gradient(90deg,#fbbf24,#f59e0b)"
                : "linear-gradient(90deg,#312e81,#4c1d95)",
              color: dark ? "#1e1b4b" : "#fff",
              fontFamily: "'Noto Sans KR', sans-serif",
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
        </div>
      </nav>

      {/* Page content — offset for fixed nav */}
      <div className="pt-16">
        <Outlet context={{ dark, nickname, userUuid }} />
      </div>
    </div>
  );
}
