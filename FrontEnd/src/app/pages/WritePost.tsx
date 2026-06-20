import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Trash, ChevronUp, ChevronDown, Plus, Image, Youtube, Type, ChevronLeft, Sparkles, Save } from "lucide-react";
import { fetchApi } from "../api";

type Block = {
  id: string;
  type: "text" | "media" | "embed";
  value: string;
};

export function WritePost() {
  const { dark, nickname, userUuid } = useOutletContext<{ dark: boolean; nickname: string; userUuid: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [showAlert, setShowAlert] = useState<{ show: boolean; message: string }>({ show: false, message: "" });

  // 1. 초기 로드: 임시 저장 데이터 확인
  useEffect(() => {
    const savedDraft = localStorage.getItem("LOH_WRITE_DRAFT");
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.title || (parsed.blocks && parsed.blocks.length > 0)) {
          const confirmRestore = window.confirm(
            "이전에 작성 중이던 임시 저장 글이 있습니다. 이어서 작성하시겠습니까?"
          );
          if (confirmRestore) {
            setTitle(parsed.title || "");
            setBlocks(parsed.blocks || []);
          } else {
            localStorage.removeItem("LOH_WRITE_DRAFT");
          }
        }
      } catch (e) {
        console.error("Draft restore error", e);
      }
    }
  }, []);

  // 2. 자동 임시 저장 (제목이나 블록이 변경될 때마다)
  useEffect(() => {
    if (title || blocks.length > 0) {
      localStorage.setItem("LOH_WRITE_DRAFT", JSON.stringify({ title, blocks }));
    }
  }, [title, blocks]);

  // 블록 추가 함수
  function addBlock(type: "text" | "media" | "embed") {
    const newBlock: Block = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      value: "",
    };
    setBlocks((prev) => [...prev, newBlock]);
  }

  // 블록 값 변경 함수
  function handleBlockChange(id: string, value: string) {
    setBlocks((prev) =>
      prev.map((block) => (block.id === id ? { ...block, value } : block))
    );
  }

  // 블록 삭제 함수
  function deleteBlock(id: string) {
    setBlocks((prev) => prev.filter((block) => block.id !== id));
  }

  // 블록 위로 이동
  function moveUp(index: number) {
    if (index === 0) return;
    setBlocks((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  }

  // 블록 아래로 이동
  function moveDown(index: number) {
    if (index === blocks.length - 1) return;
    setBlocks((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
  }

  // 유효성 검사 및 글 등록
  function handleSubmit() {
    if (!title.trim()) {
      setShowAlert({ show: true, message: "제목을 입력해주세요!" });
      return;
    }
    if (blocks.length === 0) {
      setShowAlert({ show: true, message: "내용 블록을 최소 하나 이상 추가해주세요!" });
      return;
    }
    const isAllBlocksEmpty = blocks.every((b) => !b.value.trim());
    if (isAllBlocksEmpty) {
      setShowAlert({ show: true, message: "비어있지 않은 내용 블록이 하나 이상 필요합니다!" });
      return;
    }

    // 로컬 스토리지 대신 백엔드 서버에 글 등록
    const CURRENT_WEEK = 1; // Board.tsx와 맞춤

    fetchApi("/posts", {
      method: "POST",
      body: JSON.stringify({
        title: title.trim(),
        author: nickname,
        authorUuid: userUuid,
        content: JSON.stringify(blocks),
        week: CURRENT_WEEK
      })
    })
      .then(() => {
        // 임시 저장 데이터 제거
        localStorage.removeItem("LOH_WRITE_DRAFT");
        // 게시판으로 이동
        navigate("/board");
      })
      .catch(err => {
        setShowAlert({ show: true, message: `글 등록 실패: ${err.message}` });
      });
  }

  const labelColor = dark ? "#a78bfa" : "#a855f7";
  const titleColor = dark ? "#e9d5ff" : "#2d1b4e";

  return (
    <div className="flex flex-col items-center py-10 px-4 min-h-screen">
      <div className="w-full max-w-2xl">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => navigate("/board")}
          className="flex items-center gap-1 text-sm mb-6 font-bold transition-opacity hover:opacity-70"
          style={{ color: dark ? "#a78bfa" : "#7c3aed" }}
        >
          <ChevronLeft size={16} /> 목록으로 돌아가기
        </button>

        {/* 페이지 타이틀 */}
        <div className="mb-8">
          <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: labelColor }}>
            WRITE NEW POST
          </p>
          <h1 className="text-4xl font-black" style={{ fontFamily: "'Jua', sans-serif", color: titleColor }}>
            마음의 편지 쓰기 ✉️
          </h1>
          <p className="text-xs mt-2" style={{ color: dark ? "#7c5c9a" : "#a78bfa" }}>
            작성 시 귀여운 익명 닉네임이 자동으로 부여됩니다. 안전하게 마음을 털어놓아 보세요.
          </p>
        </div>

        {/* 글 작성 카드 */}
        <div
          className="rounded-3xl p-8 shadow-xl transition-colors duration-500 flex flex-col gap-6"
          style={{
            background: dark ? "rgba(30,20,50,0.8)" : "rgba(255,255,255,0.85)",
            border: dark ? "1px solid rgba(167,139,250,0.15)" : "1px solid rgba(168,85,247,0.1)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* 작성자 정보 */}
          <div className="flex items-center gap-2 text-sm font-bold pb-4" style={{ borderBottom: dark ? "1px solid rgba(167,139,250,0.1)" : "1px solid rgba(168,85,247,0.08)" }}>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-purple-600">
              <Sparkles size={11} /> 익명 작가
            </span>
            <span style={{ color: dark ? "#e9d5ff" : "#4c1d95" }}>당신의 이름: </span>
            <span className="font-extrabold" style={{ color: dark ? "#c084fc" : "#a855f7" }}>"{nickname}"</span>
          </div>

          {/* 제목 입력 */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold" style={{ color: dark ? "#a78bfa" : "#7c3aed" }}>제목</label>
            <input
              type="text"
              placeholder="마음을 담은 제목을 입력해주세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-5 py-3.5 rounded-2xl text-base font-bold transition-all focus:outline-none"
              style={{
                background: dark ? "rgba(10,6,20,0.4)" : "rgba(168,85,247,0.03)",
                color: dark ? "#e9d5ff" : "#3b0764",
                border: dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.15)",
              }}
            />
          </div>

          {/* 블록 에디터 영역 */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold" style={{ color: dark ? "#a78bfa" : "#7c3aed" }}>본문 내용 (블록 에디터)</label>

            {blocks.length === 0 ? (
              <div
                className="rounded-2xl py-10 px-4 text-center border-dashed border-2 flex flex-col items-center justify-center gap-2"
                style={{
                  borderColor: dark ? "rgba(167,139,250,0.2)" : "rgba(168,85,247,0.15)",
                  color: dark ? "#6d5b8a" : "#c4b5fd"
                }}
              >
                <p className="text-sm font-medium">아직 본문 내용이 없습니다.</p>
                <p className="text-xs">아래 버튼들을 클릭해 텍스트, 미디어, 유튜브 링크 블록을 추가해 내용을 완성해 보세요!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <AnimatePresence>
                  {blocks.map((block, index) => (
                    <motion.div
                      key={block.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-2xl p-4 flex gap-3 relative transition-all"
                      style={{
                        background: dark ? "rgba(10,6,20,0.5)" : "rgba(255,255,255,0.7)",
                        border: dark ? "1px solid rgba(167,139,250,0.1)" : "1px solid rgba(168,85,247,0.08)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                      }}
                    >
                      {/* 블록 제어 패널 */}
                      <div className="flex flex-col gap-1 items-center justify-center">
                        <button
                          type="button"
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                          className="p-1 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-950 transition-colors disabled:opacity-30"
                          style={{ color: dark ? "#a78bfa" : "#7c3aed" }}
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveDown(index)}
                          disabled={index === blocks.length - 1}
                          className="p-1 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-950 transition-colors disabled:opacity-30"
                          style={{ color: dark ? "#a78bfa" : "#7c3aed" }}
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>

                      {/* 블록 입력 폼 */}
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: dark ? "#a78bfa" : "#7c3aed" }}>
                          {block.type === "text" && (
                            <>
                              <Type size={12} /> 텍스트 블록
                            </>
                          )}
                          {block.type === "media" && (
                            <>
                              <Image size={12} /> 미디어 블록 (이미지/비디오 URL)
                            </>
                          )}
                          {block.type === "embed" && (
                            <>
                              <Youtube size={12} /> 유튜브 임베드 블록 (유튜브 URL)
                            </>
                          )}
                        </div>

                        {block.type === "text" ? (
                          <textarea
                            placeholder="이곳에 따뜻한 글을 적어보세요..."
                            value={block.value}
                            onChange={(e) => handleBlockChange(block.id, e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none resize-y"
                            style={{
                              background: dark ? "rgba(30,20,50,0.5)" : "rgba(168,85,247,0.02)",
                              color: dark ? "#e9d5ff" : "#4c1d95",
                              border: dark ? "1px solid rgba(167,139,250,0.15)" : "1px solid rgba(168,85,247,0.1)",
                            }}
                          />
                        ) : (
                          <input
                            type="text"
                            placeholder={
                              block.type === "media"
                                ? "이미지 또는 비디오의 URL 링크를 붙여넣으세요 (예: https://example.com/photo.jpg)"
                                : "유튜브 비디오 링크를 붙여넣으세요 (예: https://www.youtube.com/watch?v=...)"
                            }
                            value={block.value}
                            onChange={(e) => handleBlockChange(block.id, e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none"
                            style={{
                              background: dark ? "rgba(30,20,50,0.5)" : "rgba(168,85,247,0.02)",
                              color: dark ? "#e9d5ff" : "#4c1d95",
                              border: dark ? "1px solid rgba(167,139,250,0.15)" : "1px solid rgba(168,85,247,0.1)",
                            }}
                          />
                        )}
                      </div>

                      {/* 블록 삭제 버튼 */}
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => deleteBlock(block.id)}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* 블록 생성 버튼 패널 */}
          <div className="flex flex-col gap-2.5 mt-2">
            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: dark ? "#6d5b8a" : "#c4b5fd" }}>블록 추가하기</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => addBlock("text")}
                className="flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-bold border transition-all hover:scale-102"
                style={{
                  background: dark ? "rgba(167,139,250,0.05)" : "rgba(168,85,247,0.04)",
                  borderColor: dark ? "rgba(167,139,250,0.2)" : "rgba(168,85,247,0.15)",
                  color: dark ? "#a78bfa" : "#7c3aed",
                }}
              >
                <Type size={13} /> 텍스트 추가
              </button>
              <button
                type="button"
                onClick={() => addBlock("media")}
                className="flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-bold border transition-all hover:scale-102"
                style={{
                  background: dark ? "rgba(167,139,250,0.05)" : "rgba(168,85,247,0.04)",
                  borderColor: dark ? "rgba(167,139,250,0.2)" : "rgba(168,85,247,0.15)",
                  color: dark ? "#a78bfa" : "#7c3aed",
                }}
              >
                <Image size={13} /> 미디어 추가
              </button>
              <button
                type="button"
                onClick={() => addBlock("embed")}
                className="flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-bold border transition-all hover:scale-102"
                style={{
                  background: dark ? "rgba(167,139,250,0.05)" : "rgba(168,85,247,0.04)",
                  borderColor: dark ? "rgba(167,139,250,0.2)" : "rgba(168,85,247,0.15)",
                  color: dark ? "#a78bfa" : "#7c3aed",
                }}
              >
                <Youtube size={13} /> 유튜브 추가
              </button>
            </div>
          </div>

          {/* 에러 메시지 팝업 */}
          <AnimatePresence>
            {showAlert.show && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-2xl text-sm font-bold text-center border bg-red-50 border-red-200 text-red-600 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400"
              >
                ⚠️ {showAlert.message}
                <button
                  onClick={() => setShowAlert({ show: false, message: "" })}
                  className="ml-3 underline cursor-pointer text-xs"
                >
                  닫기
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 완료 버튼 */}
          <div className="flex justify-end gap-3 mt-4 pt-4" style={{ borderTop: dark ? "1px solid rgba(167,139,250,0.1)" : "1px solid rgba(168,85,247,0.08)" }}>
            <button
              type="button"
              onClick={() => navigate("/board")}
              className="px-6 py-3 rounded-full text-sm font-bold transition-all hover:opacity-80"
              style={{
                color: dark ? "#a78bfa" : "#7c3aed",
                background: dark ? "rgba(167,139,250,0.08)" : "rgba(168,85,247,0.05)",
              }}
            >
              취소
            </button>
            <motion.button
              type="button"
              onClick={handleSubmit}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-8 py-3 rounded-full text-sm font-bold text-white shadow-lg"
              style={{ background: "linear-gradient(90deg,#a855f7,#ec4899)" }}
            >
              <Save size={15} /> 작성 완료
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
