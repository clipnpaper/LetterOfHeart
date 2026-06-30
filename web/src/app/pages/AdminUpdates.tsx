import { useState, useEffect, useRef, forwardRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useOutletContext } from "react-router";
import {
  Plus, Trash2, GripVertical, Eye, EyeOff, Save,
  ChevronDown, ChevronUp, X, Check, Edit3, Copy,
  ExternalLink,
} from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Accordion from "@radix-ui/react-accordion";
import { InlineRichText, RichText } from "./Updates";
import {
  loadUpdates, saveUpdates, deleteUpdate, newPost, newBlock,
  CATEGORY_META,
  type UpdatePost, type ContentBlock, type BlockType,
  type TextBlock, type AccordionBlock, type LinkBlock,
  type ListBlock, type UpdateCategory,
  type CharacterPresetBlock, type SkinPresetBlock, type ClonePresetBlock, type ShortcutPresetBlock,
  type PvpPresetBlock, type PvpGroupRule,
} from "../updateStore";
import { CHARACTER_IMAGES, CharacterPersonality, CharacterRace } from "../characterImages";


// ─── Small shared atoms ───────────────────────────────────────────────────────

function Label({ children, dark }: { children: React.ReactNode; dark: boolean }) {
  return (
    <p className="text-xs font-bold mb-1.5"
      style={{ color: dark ? "#a78bfa" : "#7c3aed", fontFamily: "'Noto Sans KR', sans-serif" }}>
      {children}
    </p>
  );
}

function Field({ dark, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { dark: boolean }) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-purple-400"
      style={{
        background: dark ? "rgba(167,139,250,0.08)" : "rgba(168,85,247,0.06)",
        border: dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.15)",
        color: dark ? "#e9d5ff" : "#2d1b4e",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}
    />
  );
}

const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { dark: boolean }>(
  ({ dark, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        {...props}
        className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-purple-400 resize-y"
        style={{
          background: dark ? "rgba(167,139,250,0.08)" : "rgba(168,85,247,0.06)",
          border: dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.15)",
          color: dark ? "#e9d5ff" : "#2d1b4e",
          fontFamily: "'Noto Sans KR', sans-serif",
          minHeight: 80,
        }}
      />
    );
  }
);

Textarea.displayName = "Textarea";

function Select({ dark, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { dark: boolean }) {
  return (
    <select
      {...props}
      className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-purple-400"
      style={{
        background: dark ? "rgba(167,139,250,0.08)" : "rgba(168,85,247,0.06)",
        border: dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.15)",
        color: dark ? "#e9d5ff" : "#2d1b4e",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}
    >
      {children}
    </select>
  );
}

// ─── Block editors ────────────────────────────────────────────────────────────

function TextBlockEditor({ block, dark, onChange, onTriggerFormatModal }: {
  block: ContentBlock; dark: boolean;
  onChange: (b: ContentBlock) => void;
  onTriggerFormatModal: (type: "link" | "tooltip" | "accordion" | "image", selection: { start: number; end: number; text: string }) => void;
}) {
  const [lastSelection, setLastSelection] = useState<{ start: number; end: number; text: string }>({ start: 0, end: 0, text: "" });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleTextareaSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const start = e.currentTarget.selectionStart;
    const end = e.currentTarget.selectionEnd;
    const text = e.currentTarget.value.substring(start, end);
    setLastSelection({ start, end, text });
  };

  const handleToolbarClick = (type: "link" | "tooltip" | "accordion" | "image") => {
    onTriggerFormatModal(type, lastSelection);
  };

  const handleDividerClick = () => {
    const start = lastSelection.start;
    const end = lastSelection.end;
    const text = block.content || "";
    const replacement = "\n---\n";
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    onChange({ ...block, content: newValue });
    const nextPos = start + replacement.length;
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextPos, nextPos);
      setLastSelection({ start: nextPos, end: nextPos, text: "" });
    }, 50);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5 mb-1 flex-wrap">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleToolbarClick("link")}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:scale-105"
          style={{ background: dark ? "rgba(167,139,250,0.12)" : "rgba(168,85,247,0.08)", color: dark ? "#a78bfa" : "#7c3aed" }}
        >
          🔗 링크 추가
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleToolbarClick("tooltip")}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:scale-105"
          style={{ background: dark ? "rgba(167,139,250,0.12)" : "rgba(168,85,247,0.08)", color: dark ? "#a78bfa" : "#7c3aed" }}
        >
          💬 툴팁 추가
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleToolbarClick("accordion")}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:scale-105"
          style={{ background: dark ? "rgba(167,139,250,0.12)" : "rgba(168,85,247,0.08)", color: dark ? "#a78bfa" : "#7c3aed" }}
        >
          📂 아코디언 추가
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleToolbarClick("image")}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:scale-105"
          style={{ background: dark ? "rgba(167,139,250,0.12)" : "rgba(168,85,247,0.08)", color: dark ? "#a78bfa" : "#7c3aed" }}
        >
          🖼️ 이미지 추가
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleDividerClick}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:scale-105"
          style={{ background: dark ? "rgba(167,139,250,0.12)" : "rgba(168,85,247,0.08)", color: dark ? "#a78bfa" : "#7c3aed" }}
        >
          ➖ 구분선 추가
        </button>
      </div>
      <div>
        <Label dark={dark}>본문 내용</Label>
        <Textarea
          ref={textareaRef}
          dark={dark}
          rows={5}
          value={block.content || ""}
          onChange={(e) => onChange({ ...block, content: e.target.value })}
          onSelect={handleTextareaSelect}
          placeholder="본문을 입력하세요... 원하는 글씨를 마우스로 드래그한 후 상단 툴바를 눌러 추가 기능을 부여할 수 있습니다."
        />
      </div>

      {/* Inline format help legend */}
      <div
        className="p-3.5 rounded-xl border text-[11px] leading-relaxed"
        style={{
          background: dark ? "rgba(167,139,250,0.04)" : "rgba(168,85,247,0.03)",
          borderColor: dark ? "rgba(167,139,250,0.15)" : "rgba(168,85,247,0.12)",
          color: dark ? "#a78bfa" : "#7c3aed",
          fontFamily: "'Noto Sans KR', sans-serif"
        }}
      >
        <p className="font-extrabold mb-1">💡 작성 가이드 (인라인 서식 지원)</p>
        <ul className="list-disc list-inside flex flex-col gap-0.5 opacity-80 font-medium">
          <li><strong>하이퍼링크:</strong> <code>[표시할 글자](연결할 URL 주소)</code> 형식으로 기입</li>
          <li><strong>키워드 툴팁:</strong> <code>{"[대상 단어]{마우스 오버 시 노출할 툴팁 설명}"}</code> 형식으로 기입</li>
        </ul>
      </div>
    </div>
  );
}

function AccordionBlockEditor({ block, dark, onChange }: {
  block: AccordionBlock; dark: boolean;
  onChange: (b: AccordionBlock) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <Label dark={dark}>아코디언 제목</Label>
        <Field
          dark={dark}
          value={block.title}
          placeholder="클릭하면 펼쳐질 제목..."
          onChange={(e) => onChange({ ...block, title: e.target.value })}
        />
      </div>
      <div>
        <Label dark={dark}>펼쳐지는 내용</Label>
        <Textarea
          dark={dark}
          rows={5}
          value={block.body}
          placeholder="자세한 내용을 입력하세요..."
          onChange={(e) => onChange({ ...block, body: e.target.value })}
        />
      </div>
    </div>
  );
}

function LinkBlockEditor({ block, dark, onChange }: {
  block: LinkBlock; dark: boolean;
  onChange: (b: LinkBlock) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <Label dark={dark}>링크 텍스트</Label>
        <Field dark={dark} value={block.label} placeholder="버튼에 표시될 텍스트" onChange={(e) => onChange({ ...block, label: e.target.value })} />
      </div>
      <div>
        <Label dark={dark}>URL</Label>
        <Field dark={dark} value={block.url} placeholder="https://..." onChange={(e) => onChange({ ...block, url: e.target.value })} />
      </div>
      <div>
        <Label dark={dark}>부연 설명 (선택)</Label>
        <Field dark={dark} value={block.desc} placeholder="링크 아래 표시될 짧은 설명" onChange={(e) => onChange({ ...block, desc: e.target.value })} />
      </div>
    </div>
  );
}

function ListBlockEditor({ block, dark, onChange }: {
  block: ListBlock; dark: boolean;
  onChange: (b: ListBlock) => void;
}) {
  function updateItem(i: number, val: string) {
    const items = [...block.items];
    items[i] = val;
    onChange({ ...block, items });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <Label dark={dark}>목록 제목 (선택)</Label>
          <Field dark={dark} value={block.title} placeholder="목록 제목..." onChange={(e) => onChange({ ...block, title: e.target.value })} />
        </div>
        <div>
          <Label dark={dark}>스타일</Label>
          <Select dark={dark} value={block.style} onChange={(e) => onChange({ ...block, style: e.target.value as ListBlock["style"] })}>
            <option value="bullet">• 불릿</option>
            <option value="numbered">01. 번호</option>
            <option value="badge">● 뱃지</option>
          </Select>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label dark={dark}>항목</Label>
          <button
            onClick={() => onChange({ ...block, items: [...block.items, ""] })}
            className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: "linear-gradient(90deg,#a855f7,#ec4899)", color: "#fff" }}
          >
            <Plus size={11} /> 항목 추가
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          {block.items.map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-xs font-bold w-5 text-center shrink-0" style={{ color: "#a855f7" }}>{i + 1}</span>
              <Field dark={dark} value={item} placeholder={`항목 ${i + 1}`} onChange={(e) => updateItem(i, e.target.value)} />
              <button
                onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}
                className="p-1.5 rounded-lg"
                style={{ color: "#f43f5e", background: "rgba(244,63,94,0.1)" }}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Single block card ────────────────────────────────────────────────────────

// ─── Preset Editors ───────────────────────────────────────────────────────────

function CharacterPresetBlockEditor({ block, dark, onChange }: {
  block: CharacterPresetBlock; dark: boolean;
  onChange: (b: CharacterPresetBlock) => void;
}) {
  const [activeTab, setActiveTab] = useState<"normal" | "low" | "high">("normal");

  // Fallbacks for safety and backwards compatibility
  const name = block.name || "";
  const rarity = block.rarity || "3성(일반)";
  const personality = block.personality || "활발";
  const race = block.race || "요정";
  const role = block.role || "딜러";
  const attackType = block.attackType || "물리";
  const position = block.position || "전열";
  const desc = block.desc || "";
  const imageUrl = block.imageUrl || "";
  const costumeImageUrl = block.costumeImageUrl || "";
  const themeTheaterUrl = block.themeTheaterUrl || "";
  const pickupEventUrl = block.pickupEventUrl || "";

  const preset = CHARACTER_IMAGES[name];
  const hasPresetImages = !!preset;

  const handleLoadPresetImages = () => {
    if (!preset) return;

    // Reverse lookup for enums to string keys
    const pStr = preset.personality !== undefined ? CharacterPersonality[preset.personality] : undefined;
    const rStr = preset.race !== undefined ? CharacterRace[preset.race] : undefined;

    onChange({
      ...block,
      imageUrl: preset.default || imageUrl,
      ...(pStr ? { personality: pStr as any } : {}),
      ...(rStr ? { race: rStr as any } : {}),
    });
  };

  const normalSkill = block.normalSkill || { name: "", desc: "", imageUrl: "" };
  const lowSkill = block.lowSkill || { name: "", desc: "", imageUrl: "" };
  const highSkill = block.highSkill || { name: "", desc: "", imageUrl: "" };

  const currentSkill = activeTab === "normal" ? normalSkill : activeTab === "low" ? lowSkill : highSkill;

  const updateCurrentSkill = (updatedFields: Partial<typeof normalSkill>) => {
    const updatedSkill = { ...currentSkill, ...updatedFields };
    if (activeTab === "normal") {
      onChange({ ...block, normalSkill: updatedSkill });
    } else if (activeTab === "low") {
      onChange({ ...block, lowSkill: updatedSkill });
    } else {
      onChange({ ...block, highSkill: updatedSkill });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "imageUrl" | "costumeImageUrl" | "skillUrl") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      alert("이미지 크기는 최대 6MB까지 업로드 가능합니다.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file, file.name);
    try {
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      if (!response.ok) throw new Error("업로드 실패");
      const result = await response.json();
      if (field === "imageUrl") {
        onChange({ ...block, imageUrl: result.url });
      } else if (field === "costumeImageUrl") {
        onChange({ ...block, costumeImageUrl: result.url });
      } else if (field === "skillUrl") {
        updateCurrentSkill({ imageUrl: result.url });
      }
    } catch (err: any) {
      alert(`업로드 실패: ${err.message}`);
    }
  };

  const insertTooltipHelper = () => {
    const keyword = window.prompt("툴팁을 표시할 단어를 입력하세요 (예: 치명타):");
    if (!keyword) return;
    const tip = window.prompt(`'${keyword}' 단어 위에 마우스를 올렸을 때 표시할 설명을 입력하세요:`);
    if (!tip) return;

    const textToInsert = `[${keyword}]{${tip}}`;
    const textarea = document.getElementById(`skill-desc-${activeTab}`) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const newDesc = text.substring(0, start) + textToInsert + text.substring(end);
      updateCurrentSkill({ desc: newDesc });
      setTimeout(() => {
        textarea.focus();
        const nextPos = start + textToInsert.length;
        textarea.setSelectionRange(nextPos, nextPos);
      }, 50);
    } else {
      updateCurrentSkill({ desc: (currentSkill.desc || "") + textToInsert });
    }
  };

  const selectColor = dark ? "#e9d5ff" : "#2d1b4e";

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Apostle Basic Info */}
      <div className="border border-purple-300/10 rounded-2xl p-4 flex flex-col gap-3">
        <p className="text-xs font-black text-purple-400">👤 사도 기본 정보</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label dark={dark}>사도 이름</Label>
            <div className="flex gap-1.5 items-center">
              <Field dark={dark} value={name} placeholder="예: 에르핀" onChange={(e) => onChange({ ...block, name: e.target.value })} />
              {hasPresetImages && (
                <button
                  type="button"
                  onClick={handleLoadPresetImages}
                  className="px-2.5 py-1.5 rounded-xl text-[10px] font-black text-white shrink-0 transition-all hover:scale-105"
                  style={{ background: "linear-gradient(90deg,#a855f7,#ec4899)", fontFamily: "'Noto Sans KR', sans-serif" }}
                >
                  🖼️ 불러오기
                </button>
              )}
            </div>
          </div>
          <div>
            <Label dark={dark}>등급 (Rarity)</Label>
            <Select dark={dark} value={rarity} onChange={(e) => onChange({ ...block, rarity: e.target.value })}>
              <option value="3성(엘다인)">3성 (엘다인)</option>
              <option value="3성(일반)">3성 (일반)</option>
              <option value="2성">2성</option>
              <option value="1성">1성</option>
            </Select>
          </div>
          <div>
            <Label dark={dark}>성격</Label>
            <Select dark={dark} value={personality} onChange={(e) => onChange({ ...block, personality: e.target.value })}>
              <option value="광기">광기</option>
              <option value="냉정">냉정</option>
              <option value="순수">순수</option>
              <option value="활발">활발</option>
              <option value="우울">우울</option>
              <option value="공명">공명</option>
            </Select>
          </div>
          <div>
            <Label dark={dark}>종족</Label>
            <Select dark={dark} value={race} onChange={(e) => onChange({ ...block, race: e.target.value })}>
              <option value="요정">요정</option>
              <option value="수인">수인</option>
              <option value="엘프">엘프</option>
              <option value="정령">정령</option>
              <option value="유령">유령</option>
              <option value="용족">용족</option>
              <option value="마녀">마녀</option>
              <option value="미스틱">미스틱</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          <div>
            <Label dark={dark}>역할군</Label>
            <div className="flex gap-4 py-2">
              {["탱커", "딜러", "서포터"].map((r) => (
                <label key={r} className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold" style={{ color: selectColor }}>
                  <input
                    type="radio"
                    name={`role-${block.name || 'char'}`}
                    checked={role === r}
                    onChange={() => onChange({ ...block, role: r })}
                    className="w-3.5 h-3.5 accent-purple-600 cursor-pointer"
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label dark={dark}>공격 타입</Label>
            <div className="flex gap-4 py-2">
              {["물리", "마법"].map((t) => (
                <label key={t} className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold" style={{ color: selectColor }}>
                  <input
                    type="radio"
                    name={`attackType-${block.name || 'char'}`}
                    checked={attackType === t}
                    onChange={() => onChange({ ...block, attackType: t })}
                    className="w-3.5 h-3.5 accent-purple-600 cursor-pointer"
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label dark={dark}>배치 열</Label>
            <Select dark={dark} value={position} onChange={(e) => onChange({ ...block, position: e.target.value })}>
              <option value="전열">전열</option>
              <option value="중열">중열</option>
              <option value="후열">후열</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_2fr] gap-3">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <Label dark={dark}>대표 이미지 URL</Label>
              <label className="cursor-pointer text-[10px] font-bold px-2 py-0.5 rounded transition-opacity hover:opacity-80 flex items-center gap-1"
                style={{ background: dark ? "rgba(167,139,250,0.15)" : "rgba(168,85,247,0.1)", color: dark ? "#a78bfa" : "#7c3aed" }}>
                📁 파일 선택
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml, image/jfif"
                  onChange={(e) => handleImageUpload(e, "imageUrl")}
                  className="hidden"
                />
              </label>
            </div>
            <Field dark={dark} value={imageUrl} placeholder="https://... 또는 직접 업로드" onChange={(e) => onChange({ ...block, imageUrl: e.target.value })} />
          </div>
          <div>
            <Label dark={dark}>한 줄 소개</Label>
            <Field dark={dark} value={desc} placeholder="예: 빵을 아주 좋아하는 엘프들의 여왕입니다." onChange={(e) => onChange({ ...block, desc: e.target.value })} />
          </div>
        </div>

        {/* 4. Event Links (placed directly under basic info) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-purple-300/10 pt-3">
          <div>
            <Label dark={dark}>테마극장 이벤트 링크</Label>
            <Field dark={dark} value={themeTheaterUrl} placeholder="https://..." onChange={(e) => onChange({ ...block, themeTheaterUrl: e.target.value })} />
          </div>
          <div>
            <Label dark={dark}>픽업 모집 이벤트 링크</Label>
            <Field dark={dark} value={pickupEventUrl} placeholder="https://..." onChange={(e) => onChange({ ...block, pickupEventUrl: e.target.value })} />
          </div>
        </div>
      </div>

      {/* 2. Apostle Skill Info (Accordion in user view) */}
      <div className="border border-purple-300/10 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black text-purple-400">⚔️ 사도 스킬 정보 (에디터 내 탭 전환)</p>
          <div className="flex gap-1">
            {(["normal", "low", "high"] as const).map((tab) => {
              const labelMap = { normal: "일반 공격", low: "저학년 스킬", high: "고학년 스킬" };
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all"
                  style={{
                    background: isActive ? "linear-gradient(90deg,#a855f7,#ec4899)" : dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                    color: isActive ? "#fff" : selectColor,
                  }}
                >
                  {labelMap[tab]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 bg-purple-500/5 rounded-xl p-3 border border-purple-500/10">
          {activeTab !== "normal" && (
            <div>
              <Label dark={dark}>{activeTab === "low" ? "저학년" : "고학년"} 스킬 이름</Label>
              <Field dark={dark} value={currentSkill.name || ""} placeholder="스킬 이름을 입력하세요" onChange={(e) => updateCurrentSkill({ name: e.target.value })} />
            </div>
          )}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <Label dark={dark}>스킬 대표 이미지 URL</Label>
              <label className="cursor-pointer text-[10px] font-bold px-2 py-0.5 rounded transition-opacity hover:opacity-80 flex items-center gap-1"
                style={{ background: dark ? "rgba(167,139,250,0.15)" : "rgba(168,85,247,0.1)", color: dark ? "#a78bfa" : "#7c3aed" }}>
                📁 파일 선택
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml, image/jfif"
                  onChange={(e) => handleImageUpload(e, "skillUrl")}
                  className="hidden"
                />
              </label>
            </div>
            <Field dark={dark} value={currentSkill.imageUrl || ""} placeholder="https://... 또는 직접 업로드" onChange={(e) => updateCurrentSkill({ imageUrl: e.target.value })} />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <Label dark={dark}>스킬 설명 (설명 내부 키워드 툴팁 지원)</Label>
              <button
                type="button"
                onClick={insertTooltipHelper}
                className="px-2 py-0.5 rounded text-[9px] font-bold transition-all flex items-center gap-1"
                style={{ background: dark ? "rgba(167,139,250,0.15)" : "rgba(168,85,247,0.1)", color: dark ? "#a78bfa" : "#7c3aed" }}
              >
                💬 툴팁 서식 추가
              </button>
            </div>
            <Textarea
              id={`skill-desc-${activeTab}`}
              dark={dark}
              rows={3}
              value={currentSkill.desc || ""}
              placeholder="스킬 설명을 입력하세요. '[치명타]{치명타 확률이 증가합니다}' 형식으로 작성하거나 툴팁 추가 버튼을 사용하세요."
              onChange={(e) => updateCurrentSkill({ desc: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* 3. Apostle Costume (사복) */}
      <div className="border border-purple-300/10 rounded-2xl p-4 flex flex-col gap-3">
        <p className="text-xs font-black text-purple-400">👗 사도 사복 정보</p>
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <Label dark={dark}>사복 이미지 URL</Label>
            <label className="cursor-pointer text-[10px] font-bold px-2 py-0.5 rounded transition-opacity hover:opacity-80 flex items-center gap-1"
              style={{ background: dark ? "rgba(167,139,250,0.15)" : "rgba(168,85,247,0.1)", color: dark ? "#a78bfa" : "#7c3aed" }}>
              📁 파일 선택
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml, image/jfif"
                onChange={(e) => handleImageUpload(e, "costumeImageUrl")}
                className="hidden"
              />
            </label>
          </div>
          <Field dark={dark} value={costumeImageUrl} placeholder="https://... 또는 직접 업로드 (대표 이미지 하나로 구성)" onChange={(e) => onChange({ ...block, costumeImageUrl: e.target.value })} />
        </div>
      </div>


    </div>
  );
}

function SkinPresetBlockEditor({ block, dark, onChange }: {
  block: SkinPresetBlock; dark: boolean;
  onChange: (b: SkinPresetBlock) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label dark={dark}>스킨 이름</Label>
          <Field dark={dark} value={block.name || ""} placeholder="예: 여름 해변의 여왕" onChange={(e) => onChange({ ...block, name: e.target.value })} />
        </div>
        <div>
          <Label dark={dark}>착용 대상 사도</Label>
          <Field dark={dark} value={block.character || ""} placeholder="예: 에르핀" onChange={(e) => onChange({ ...block, character: e.target.value })} />
        </div>
      </div>
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <Label dark={dark}>스킨 이미지 URL</Label>
          <label className="cursor-pointer text-[10px] font-bold px-2 py-0.5 rounded transition-opacity hover:opacity-80 flex items-center gap-1"
            style={{ background: dark ? "rgba(167,139,250,0.15)" : "rgba(168,85,247,0.1)", color: dark ? "#a78bfa" : "#7c3aed" }}>
            📁 파일 선택
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml, image/jfif"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 6 * 1024 * 1024) {
                  alert("이미지 크기는 최대 6MB까지 업로드 가능합니다.");
                  return;
                }
                const formData = new FormData();
                formData.append("file", file, file.name);
                try {
                  const response = await fetch("/api/upload", { method: "POST", body: formData });
                  if (!response.ok) throw new Error("업로드 실패");
                  const result = await response.json();
                  onChange({ ...block, imageUrl: result.url });
                } catch (err: any) {
                  alert(`업로드 실패: ${err.message}`);
                }
              }}
              className="hidden"
            />
          </label>
        </div>
        <Field dark={dark} value={block.imageUrl || ""} placeholder="https://... 또는 직접 업로드" onChange={(e) => onChange({ ...block, imageUrl: e.target.value })} />
      </div>
      <div>
        <Label dark={dark}>설명</Label>
        <Field dark={dark} value={block.desc || ""} placeholder="예: 해변가에서 휴가를 만끽하는 에르핀의 스페셜 코스튬입니다." onChange={(e) => onChange({ ...block, desc: e.target.value })} />
      </div>
    </div>
  );
}

interface SearchableApostleSelectProps {
  value: string;
  onChange: (val: string) => void;
  characterNames: string[];
  align?: "left" | "right";
}

function SearchableApostleSelect({ value, onChange, characterNames, align = "left" }: SearchableApostleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setSearch("");
  };

  const filtered = characterNames.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={handleToggle}
        className="w-full px-1 py-1 rounded bg-slate-900 border border-purple-500/20 text-white text-[11px] text-left outline-none cursor-pointer flex justify-between items-center gap-1 hover:border-purple-500/40 transition-colors"
      >
        <span className="truncate">{value || "(없음)"}</span>
        <span className="text-[7px] opacity-60 shrink-0">▼</span>
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 mt-1 w-[130px] max-h-[220px] rounded-lg border border-purple-500/30 bg-slate-950 p-1.5 shadow-xl flex flex-col gap-1.5 ${align === "right" ? "right-0" : "left-0"
            }`}
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="검색..."
            autoFocus
            className="w-full px-2 py-0.5 rounded bg-slate-900 border border-purple-500/30 text-white text-[11px] outline-none placeholder:text-gray-500"
          />

          <div className="overflow-y-auto flex-1 flex flex-col max-h-[160px] custom-scrollbar gap-0.5">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] transition-colors ${value === "" ? "bg-purple-600/30 text-purple-300 font-bold" : "text-gray-300 hover:bg-purple-500/10"
                }`}
            >
              (없음)
            </button>

            {filtered.map((cName) => (
              <button
                key={cName}
                type="button"
                onClick={() => {
                  onChange(cName);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] transition-colors ${value === cName ? "bg-purple-600/30 text-purple-300 font-bold" : "text-gray-300 hover:bg-purple-500/10"
                  }`}
              >
                {cName}
              </button>
            ))}

            {filtered.length === 0 && (
              <span className="text-[10px] text-gray-500 text-center py-2">검색 결과 없음</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ClonePresetBlockEditor({ block, dark, onChange }: {
  block: ClonePresetBlock; dark: boolean;
  onChange: (b: ClonePresetBlock) => void;
}) {
  const characterNames = Object.keys(CHARACTER_IMAGES).sort();

  const rotations = block.rotations && block.rotations.length > 0 ? block.rotations : [
    { stages: "1, 7, 13", before: ["", "", "", "", ""], after: ["", "", "", "", ""] },
    { stages: "2, 8, 14", before: ["", "", "", "", ""], after: ["", "", "", "", ""] },
    { stages: "3, 9, 15", before: ["", "", "", "", ""], after: ["", "", "", "", ""] },
    { stages: "4, 10, 16", before: ["", "", "", "", ""], after: ["", "", "", "", ""] },
    { stages: "5, 11, 17", before: ["", "", "", "", ""], after: ["", "", "", "", ""] },
    { stages: "6, 12, 18", before: ["", "", "", "", ""], after: ["", "", "", "", ""] },
  ];

  const updateTitle = (val: string) => {
    onChange({ ...block, title: val });
  };

  const updateApostle = (stageIdx: number, type: "before" | "after", slotIdx: number, val: string) => {
    const nextRotations = rotations.map((rot, rIdx) => {
      if (rIdx !== stageIdx) return rot;
      const nextList = [...(rot[type] || [])];
      nextList[slotIdx] = val;
      return { ...rot, [type]: nextList };
    });
    onChange({ ...block, rotations: nextRotations });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <div>
        <Label dark={dark}>프리셋 제목</Label>
        <Field
          dark={dark}
          type="text"
          value={block.title || ""}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder="클론 팩토리 보상 로테이션"
        />
      </div>

      {/* Accordion list of stages to edit */}
      <div className="flex flex-col gap-3">
        {rotations.map((rot, stageIdx) => (
          <div
            key={stageIdx}
            className="p-4 rounded-2xl border"
            style={{
              background: dark ? "rgba(167,139,250,0.04)" : "rgba(168,85,247,0.02)",
              borderColor: dark ? "rgba(167,139,250,0.15)" : "rgba(168,85,247,0.15)",
            }}
          >
            <span className="text-xs font-black text-purple-400 block mb-3">
              🧬 스테이지 {rot.stages}
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {/* Before */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-red-400">🔴 변경 전 사도 (5명)</span>
                <div className="grid grid-cols-5 gap-1.5">
                  {(rot.before || []).map((name, slotIdx) => (
                    <SearchableApostleSelect
                      key={slotIdx}
                      value={name}
                      characterNames={characterNames}
                      onChange={(val) => updateApostle(stageIdx, "before", slotIdx, val)}
                      align={slotIdx >= 3 ? "right" : "left"}
                    />
                  ))}
                </div>
              </div>

              {/* After */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-green-400">🟢 변경 후 사도 (5명)</span>
                <div className="grid grid-cols-5 gap-1.5">
                  {(rot.after || []).map((name, slotIdx) => (
                    <SearchableApostleSelect
                      key={slotIdx}
                      value={name}
                      characterNames={characterNames}
                      onChange={(val) => updateApostle(stageIdx, "after", slotIdx, val)}
                      align={slotIdx >= 3 ? "right" : "left"}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShortcutPresetBlockEditor({ block, dark, onChange }: {
  block: ShortcutPresetBlock; dark: boolean;
  onChange: (b: ShortcutPresetBlock) => void;
}) {
  const updateTitle = (val: string) => {
    onChange({ ...block, title: val });
  };

  const updateShortcut = (idx: number, key: "label" | "url", val: string) => {
    const nextShortcuts = [...(block.shortcuts || [])];
    nextShortcuts[idx] = { ...nextShortcuts[idx], [key]: val };
    onChange({ ...block, shortcuts: nextShortcuts });
  };

  const addShortcut = () => {
    const nextShortcuts = [...(block.shortcuts || []), { label: "", url: "" }];
    onChange({ ...block, shortcuts: nextShortcuts });
  };

  const removeShortcut = (idx: number) => {
    const nextShortcuts = (block.shortcuts || []).filter((_, i) => i !== idx);
    onChange({ ...block, shortcuts: nextShortcuts });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <div>
        <Label dark={dark}>프리셋 제목</Label>
        <Field
          dark={dark}
          type="text"
          value={block.title || ""}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder="바로가기"
        />
      </div>

      {/* Shortcuts List */}
      <div>
        <Label dark={dark}>바로가기 링크 목록 ({(block.shortcuts || []).length})</Label>
        <div className="flex flex-col gap-2">
          {(block.shortcuts || []).map((sh, idx) => (
            <div key={idx} className="flex gap-2 items-center bg-slate-900/40 p-2 rounded-xl border border-purple-500/10">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={sh.label}
                  onChange={(e) => updateShortcut(idx, "label", e.target.value)}
                  placeholder="링크 이름 (예: 공식 카페)"
                  className="px-2 py-1 rounded bg-slate-950 border border-purple-500/20 text-white text-xs outline-none"
                />
                <input
                  type="text"
                  value={sh.url}
                  onChange={(e) => updateShortcut(idx, "url", e.target.value)}
                  placeholder="링크 주소 (예: https://...)"
                  className="px-2 py-1 rounded bg-slate-950 border border-purple-500/20 text-white text-xs outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => removeShortcut(idx)}
                className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addShortcut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold self-start mt-1 transition-all hover:scale-105"
            style={{
              background: dark ? "rgba(167,139,250,0.1)" : "rgba(168,85,247,0.08)",
              color: dark ? "#a78bfa" : "#7c3aed",
              border: dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.15)",
            }}
          >
            <Plus size={11} /> 링크 추가
          </button>
        </div>
      </div>
    </div>
  );
}

function PvpPresetBlockEditor({ block, dark, onChange }: {
  block: PvpPresetBlock; dark: boolean;
  onChange: (b: PvpPresetBlock) => void;
}) {
  const updateTitle = (val: string) => {
    onChange({ ...block, title: val });
  };

  const updateField = (key: keyof PvpPresetBlock, val: any) => {
    onChange({ ...block, [key]: val });
  };

  const updateRule = (idx: number, key: keyof PvpGroupRule, val: any) => {
    const nextRules = [...(block.groupRules || [])];
    nextRules[idx] = { ...nextRules[idx], [key]: val };
    onChange({ ...block, groupRules: nextRules });
  };

  const addRule = () => {
    const nextRules = [...(block.groupRules || []), { period: "", groupName: "", minDays: 0, maxDays: 0 }];
    onChange({ ...block, groupRules: nextRules });
  };

  const removeRule = (idx: number) => {
    const nextRules = (block.groupRules || []).filter((_, i) => i !== idx);
    onChange({ ...block, groupRules: nextRules });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <div>
        <Label dark={dark}>프리셋 제목</Label>
        <Field
          dark={dark}
          type="text"
          value={block.title || ""}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder="PvP 승자의 줘팸터 신규 정규 시즌"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label dark={dark}>진행 기간 (Season Period)</Label>
          <Field
            dark={dark}
            type="text"
            value={block.seasonPeriod || ""}
            onChange={(e) => updateField("seasonPeriod", e.target.value)}
            placeholder="06/18(목) 정기점검 이후 ~ 07/16(목) 10:59"
          />
        </div>
        <div>
          <Label dark={dark}>정산 시간 (Settlement Time)</Label>
          <Field
            dark={dark}
            type="text"
            value={block.settlementTime || ""}
            onChange={(e) => updateField("settlementTime", e.target.value)}
            placeholder="07/16(목) 11:00 ~ 점검 종료 전까지 (PvP 입장 불가)"
          />
        </div>
        <div>
          <Label dark={dark}>그룹 판정 기준일 (Baseline Date)</Label>
          <Field
            dark={dark}
            type="date"
            value={block.standardDate || ""}
            onChange={(e) => updateField("standardDate", e.target.value)}
            placeholder="2026-06-18"
          />
        </div>
      </div>

      <div>
        <Label dark={dark}>휴가 사도 (Vacation Apostles)</Label>
        <Field
          dark={dark}
          type="text"
          value={block.vocationApostles || ""}
          onChange={(e) => updateField("vocationApostles", e.target.value)}
          placeholder="모든 사도들이 휴가를 반납했습니다."
        />
      </div>

      {/* Group Rules */}
      <div>
        <Label dark={dark}>그룹 생성 규칙 목록 ({(block.groupRules || []).length})</Label>
        <div className="flex flex-col gap-3">
          {(block.groupRules || []).map((rule, idx) => (
            <div key={idx} className="flex flex-col gap-2 bg-slate-900/40 p-3 rounded-xl border border-purple-500/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-purple-300 font-bold">가입일 조건 설명</span>
                  <input
                    type="text"
                    value={rule.period}
                    onChange={(e) => updateRule(idx, "period", e.target.value)}
                    placeholder="가입일 조건 (예: 계정 생성일 7일 이내)"
                    className="px-2.5 py-1.5 rounded bg-slate-950 border border-purple-500/20 text-white text-xs outline-none w-full"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-purple-300 font-bold">매칭 그룹명</span>
                  <input
                    type="text"
                    value={rule.groupName}
                    onChange={(e) => updateRule(idx, "groupName", e.target.value)}
                    placeholder="매칭 그룹명 (예: 새싹 교주 1그룹)"
                    className="px-2.5 py-1.5 rounded bg-slate-950 border border-purple-500/20 text-white text-xs outline-none w-full"
                  />
                </div>
              </div>
              <div className="flex gap-2 items-center justify-between mt-1">
                <div className="flex gap-4 items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-purple-400 font-bold">최소 경과 일수:</span>
                    <input
                      type="number"
                      value={rule.minDays ?? 0}
                      onChange={(e) => updateRule(idx, "minDays", parseInt(e.target.value) || 0)}
                      className="w-16 px-1.5 py-0.5 rounded bg-slate-950 border border-purple-500/25 text-white text-xs outline-none text-center font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-purple-400 font-bold">최대 경과 일수:</span>
                    <input
                      type="number"
                      value={rule.maxDays ?? 0}
                      onChange={(e) => updateRule(idx, "maxDays", parseInt(e.target.value) || 0)}
                      className="w-16 px-1.5 py-0.5 rounded bg-slate-950 border border-purple-500/25 text-white text-xs outline-none text-center font-bold"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeRule(idx)}
                  className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors text-[10px] font-bold flex items-center gap-1"
                >
                  <Trash2 size={10} /> 제거
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addRule}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold self-start mt-1 transition-all hover:scale-105"
            style={{
              background: dark ? "rgba(167,139,250,0.1)" : "rgba(168,85,247,0.08)",
              color: dark ? "#a78bfa" : "#7c3aed",
              border: dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.15)",
            }}
          >
            <Plus size={11} /> 규칙 추가
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label dark={dark}>봇 / 유저 정보 (Bot Info)</Label>
          <Field
            dark={dark}
            type="text"
            value={block.botInfo || ""}
            onChange={(e) => updateField("botInfo", e.target.value)}
            placeholder="모든 그룹은 봇 3000명으로 시작해 최대 유저 2000명까지 늘어날 수 있습니다."
          />
        </div>
        <div>
          <Label dark={dark}>엘다인 편성 제한 (Eldain Limit Description)</Label>
          <Field
            dark={dark}
            type="text"
            value={block.eldainLimitDesc || ""}
            onChange={(e) => updateField("eldainLimitDesc", e.target.value)}
            placeholder="엘다인 덱 편성 제한 개수가 사라집니다."
          />
        </div>
        <div>
          <Label dark={dark}>고학년 스킬 사용 (High Skill Description)</Label>
          <Textarea
            dark={dark}
            value={block.highSkillDesc || ""}
            onChange={(e) => updateField("highSkillDesc", e.target.value)}
            placeholder="PvP 승자의 줘팸터에서 고학년 스킬을 사용할 수 있습니다..."
          />
        </div>
      </div>
    </div>
  );
}

// ─── Single block card ────────────────────────────────────────────────────────

function IntroBlockEditor({ block, dark, onChange, onTriggerFormatModal }: {
  block: ContentBlock; dark: boolean;
  onChange: (b: ContentBlock) => void;
  onTriggerFormatModal: (type: "link" | "tooltip" | "accordion" | "image", selection: { start: number; end: number; text: string }) => void;
}) {
  const [lastSelection, setLastSelection] = useState<{ start: number; end: number; text: string }>({ start: 0, end: 0, text: "" });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleTextareaSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const start = e.currentTarget.selectionStart;
    const end = e.currentTarget.selectionEnd;
    const text = e.currentTarget.value.substring(start, end);
    setLastSelection({ start, end, text });
  };

  const handleToolbarClick = (type: "link" | "tooltip" | "accordion" | "image") => {
    onTriggerFormatModal(type, lastSelection);
  };

  const handleDividerClick = () => {
    const start = lastSelection.start;
    const end = lastSelection.end;
    const text = block.content || "";
    const replacement = "\n---\n";
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    onChange({ ...block, content: newValue });
    const nextPos = start + replacement.length;
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextPos, nextPos);
      setLastSelection({ start: nextPos, end: nextPos, text: "" });
    }, 50);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5 mb-1 flex-wrap">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleToolbarClick("link")}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:scale-105"
          style={{ background: dark ? "rgba(167,139,250,0.12)" : "rgba(168,85,247,0.08)", color: dark ? "#a78bfa" : "#7c3aed" }}
        >
          🔗 링크 추가
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleToolbarClick("tooltip")}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:scale-105"
          style={{ background: dark ? "rgba(167,139,250,0.12)" : "rgba(168,85,247,0.08)", color: dark ? "#a78bfa" : "#7c3aed" }}
        >
          💬 툴팁 추가
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleToolbarClick("accordion")}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:scale-105"
          style={{ background: dark ? "rgba(167,139,250,0.12)" : "rgba(168,85,247,0.08)", color: dark ? "#a78bfa" : "#7c3aed" }}
        >
          📂 아코디언 추가
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleToolbarClick("image")}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:scale-105"
          style={{ background: dark ? "rgba(167,139,250,0.12)" : "rgba(168,85,247,0.08)", color: dark ? "#a78bfa" : "#7c3aed" }}
        >
          🖼️ 이미지 추가
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleDividerClick}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:scale-105"
          style={{ background: dark ? "rgba(167,139,250,0.12)" : "rgba(168,85,247,0.08)", color: dark ? "#a78bfa" : "#7c3aed" }}
        >
          ➖ 구분선 추가
        </button>
      </div>
      <div>
        <Label dark={dark}>📢 본문 내용 카드 내용 (포스트 상단 또는 본문 중간 요약용)</Label>
        <Textarea
          ref={textareaRef}
          dark={dark}
          rows={5}
          value={block.content || ""}
          onChange={(e) => onChange({ ...block, content: e.target.value })}
          onSelect={handleTextareaSelect}
          placeholder="이 블록은 포스트 본문 카드 형태로 렌더링되며, 자유롭게 순서를 드래그하여 배치할 수 있습니다. (링크 및 툴팁 서식 지원)"
        />
      </div>
    </div>
  );
}

const BLOCK_LABELS: Record<BlockType, string> = {
  text: "📝 일반 텍스트",
  intro: "📢 본문 내용 카드",
  accordion: "📂 아코디언 상자",
  link: "🔗 외부 링크 배너",
  list: "📋 목록 상자",
  divider: "➖ 구분선",
  character_preset: "👥 신규 사도 출시 프리셋",
  skin_preset: "👗 신규 스킨 출시 프리셋",
  clone_preset: "🧬 클론 팩토리 로테이션 프리셋",
  shortcut_preset: "🔗 바로가기 프리셋",
  pvp_preset: "⚔️ PvP 승자의 줘팸터 프리셋",
};

function BlockCard({ block, idx, dark, total, onChange, onMove, onDelete, onTriggerFormatModal }: {
  block: ContentBlock; idx: number; dark: boolean; total: number;
  onChange: (b: ContentBlock) => void;
  onMove: (from: number, dir: -1 | 1) => void;
  onDelete: () => void;
  onTriggerFormatModal: (type: "link" | "tooltip" | "accordion" | "image", selection: { start: number; end: number; text: string }) => void;
}) {
  const [open, setOpen] = useState(true);

  const surface = dark ? "rgba(30,20,50,0.7)" : "rgba(255,255,255,0.8)";
  const border = dark ? "rgba(167,139,250,0.2)" : "rgba(168,85,247,0.15)";

  return (
    <div
      className="rounded-2xl overflow-hidden transition-colors animate-none"
      style={{ background: surface, border: `1px solid ${border}` }}
    >
      {/* Block header */}
      <div
        className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
        style={{ borderBottom: open ? `1px solid ${border}` : "none" }}
      >
        <GripVertical size={14} style={{ color: dark ? "#6d5b8a" : "#c4b5fd" }} />
        <span className="text-xs font-bold flex-1"
          style={{ color: dark ? "#e9d5ff" : "#3b0764", fontFamily: "'Noto Sans KR', sans-serif" }}>
          {BLOCK_LABELS[block.type]}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); onMove(idx, -1); }} disabled={idx === 0}
            className="p-1 rounded-lg disabled:opacity-30 hover:bg-purple-100/20 transition-colors">
            <ChevronUp size={13} style={{ color: dark ? "#a78bfa" : "#7c3aed" }} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onMove(idx, 1); }} disabled={idx === total - 1}
            className="p-1 rounded-lg disabled:opacity-30 hover:bg-purple-100/20 transition-colors">
            <ChevronDown size={13} style={{ color: dark ? "#a78bfa" : "#7c3aed" }} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 rounded-lg hover:bg-red-100/20 transition-colors">
            <Trash2 size={13} style={{ color: "#f43f5e" }} />
          </button>
          {open ? <ChevronUp size={13} style={{ color: dark ? "#6d5b8a" : "#c4b5fd" }} />
            : <ChevronDown size={13} style={{ color: dark ? "#6d5b8a" : "#c4b5fd" }} />}
        </div>
      </div>

      {/* Editor body */}
      {open && block.type !== "divider" && (
        <div className="px-4 py-4">
          {block.type === "text" && (
            <TextBlockEditor block={block} dark={dark} onChange={onChange} onTriggerFormatModal={onTriggerFormatModal} />
          )}
          {block.type === "intro" && (
            <IntroBlockEditor block={block} dark={dark} onChange={onChange} onTriggerFormatModal={onTriggerFormatModal} />
          )}
          {block.type === "accordion" && (
            <AccordionBlockEditor block={block} dark={dark} onChange={onChange} />
          )}
          {block.type === "link" && (
            <LinkBlockEditor block={block} dark={dark} onChange={onChange} />
          )}
          {block.type === "list" && (
            <ListBlockEditor block={block} dark={dark} onChange={onChange} />
          )}
          {block.type === "character_preset" && (
            <CharacterPresetBlockEditor block={block} dark={dark} onChange={onChange} />
          )}
          {block.type === "skin_preset" && (
            <SkinPresetBlockEditor block={block} dark={dark} onChange={onChange} />
          )}
          {block.type === "clone_preset" && (
            <ClonePresetBlockEditor block={block as ClonePresetBlock} dark={dark} onChange={onChange as any} />
          )}
          {block.type === "shortcut_preset" && (
            <ShortcutPresetBlockEditor block={block as ShortcutPresetBlock} dark={dark} onChange={onChange as any} />
          )}
          {block.type === "pvp_preset" && (
            <PvpPresetBlockEditor block={block as PvpPresetBlock} dark={dark} onChange={onChange as any} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Post editor panel ────────────────────────────────────────────────────────

// ─── Format helper ───────────────────────────────────────────────────────────

interface FormatInsertModalProps {
  type: "link" | "tooltip" | "accordion" | "image";
  selectionText: string;
  dark: boolean;
  onClose: () => void;
  onApply: (replacement: string) => void;
}

function FormatInsertModal({
  type,
  selectionText,
  dark,
  onClose,
  onApply,
}: FormatInsertModalProps) {
  const [text, setText] = useState(selectionText || "");
  const [url, setUrl] = useState(type === "link" || type === "image" ? "https://" : "");
  const [body, setBody] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const subTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 6 * 1024 * 1024) {
      alert("이미지 크기는 최대 6MB까지 업로드 가능합니다.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file, file.name);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setUrl(result.url);

      if (!text) {
        const lastDot = file.name.lastIndexOf('.');
        const baseName = lastDot !== -1 ? file.name.substring(0, lastDot) : file.name;
        setText(baseName);
      }
    } catch (err: any) {
      console.error("Upload error", err);
      alert(`업로드 실패: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const insertSubFormat = (
    subType: "link" | "image" | "tooltip",
    currentVal: string,
    setVal: (v: string) => void
  ) => {
    if (!subTextareaRef.current) return;
    const start = subTextareaRef.current.selectionStart;
    const end = subTextareaRef.current.selectionEnd;
    const selected = currentVal.substring(start, end);

    if (subType === "link") {
      const targetUrl = window.prompt("연결할 URL 주소를 입력하세요:", "https://");
      if (targetUrl === null) return;
      const replacement = `[${selected || "링크텍스트"}](${targetUrl})`;
      const newVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);
      setVal(newVal);
      const nextPos = start + replacement.length;
      setTimeout(() => {
        subTextareaRef.current?.focus();
        subTextareaRef.current?.setSelectionRange(nextPos, nextPos);
      }, 50);
    } else if (subType === "image") {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml, image/jfif";

      fileInput.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        if (file.size > 6 * 1024 * 1024) {
          alert("이미지 크기는 최대 6MB까지 업로드 가능합니다.");
          return;
        }

        try {
          const formData = new FormData();
          formData.append("file", file, file.name);

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("업로드 실패");
          }

          const result = await response.json();
          const imageUrl = result.url;

          const lastDot = file.name.lastIndexOf('.');
          const baseName = lastDot !== -1 ? file.name.substring(0, lastDot) : file.name;
          const altText = selected || baseName || "이미지 설명";

          const replacement = `![${altText}](${imageUrl})`;
          const newVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);
          setVal(newVal);

          const nextPos = start + replacement.length;
          setTimeout(() => {
            subTextareaRef.current?.focus();
            subTextareaRef.current?.setSelectionRange(nextPos, nextPos);
          }, 50);
        } catch (err: any) {
          alert(`이미지 업로드 실패: ${err.message}`);
        }
      };

      fileInput.click();
    } else if (subType === "tooltip") {
      const tooltipTip = window.prompt("툴팁에 표시할 설명을 입력하세요:");
      if (tooltipTip === null) return;
      const replacement = `[${selected || "단어"}]\{${tooltipTip}\}`;
      const newVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);
      setVal(newVal);
      const nextPos = start + replacement.length;
      setTimeout(() => {
        subTextareaRef.current?.focus();
        subTextareaRef.current?.setSelectionRange(nextPos, nextPos);
      }, 50);
    }
  };

  const handleApply = () => {
    let result = "";
    if (type === "link") {
      result = `[${text || "링크텍스트"}](${url})`;
    } else if (type === "image") {
      result = `![${text || "이미지 설명"}](${url})`;
    } else if (type === "tooltip") {
      result = `[${text || "단어"}]\{${body}\}`;
    } else if (type === "accordion") {
      result = `[[${text || "아코디언 제목"}]]\{${body}\}`;
    }
    onApply(result);
  };

  const overlayBg = "rgba(0, 0, 0, 0.4)";
  const modalBg = dark ? "#1e1040" : "#ffffff";
  const borderStyle = dark ? "1px solid rgba(167,139,250,0.3)" : "1px solid rgba(168,85,247,0.2)";
  const textColor = dark ? "#e9d5ff" : "#2d1b4e";
  const subTextColor = dark ? "#a78bfa" : "#7c3aed";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all"
      style={{ background: overlayBg }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto relative animate-none"
        style={{
          background: modalBg,
          border: borderStyle,
          color: textColor,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-purple-300/10">
          <h3 className="text-base font-black flex items-center gap-2" style={{ fontFamily: "'Jua', sans-serif" }}>
            {type === "link" && "🔗 하이퍼링크 생성기"}
            {type === "image" && "🖼️ 이미지 / GIF 생성기"}
            {type === "tooltip" && "💬 키워드 툴팁 생성기"}
            {type === "accordion" && "📂 아코디언 상자 생성기"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-purple-100/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Content */}
        <div className="flex flex-col gap-4">
          {/* Field 1: Text / Label / Title / Alt */}
          <div>
            <label className="text-xs font-bold mb-1.5 block" style={{ color: subTextColor }}>
              {type === "link" && "링크 표시 글자"}
              {type === "image" && "이미지/GIF 설명 (Alt)"}
              {type === "tooltip" && "대상 단어 (마우스 오버 대상)"}
              {type === "accordion" && "아코디언 제목"}
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-purple-400"
              style={{
                background: dark ? "rgba(167,139,250,0.08)" : "rgba(168,85,247,0.06)",
                border: dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.15)",
                color: textColor,
              }}
              placeholder={
                type === "link" ? "예: 공식카페 바로가기" :
                  type === "image" ? "예: 신규 사도 일러스트" :
                    type === "tooltip" ? "예: 볼따구" : "예: 1주차 상세 업데이트 내용"
              }
            />
          </div>

          {/* Field 2: URL (only for Link and Image) */}
          {(type === "link" || type === "image") && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold block" style={{ color: subTextColor }}>
                  {type === "link" && "연결할 URL 주소"}
                  {type === "image" && "이미지 / GIF URL 주소 또는 파일 직접 업로드"}
                </label>
                {type === "image" && (
                  <label className="cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded-xl transition-all hover:scale-105 flex items-center gap-1.5 select-none"
                    style={{
                      background: dark ? "rgba(167,139,250,0.15)" : "rgba(168,85,247,0.1)",
                      color: subTextColor,
                      border: dark ? "1px solid rgba(167,139,250,0.25)" : "1px solid rgba(168,85,247,0.15)"
                    }}>
                    📁 파일 직접 올리기
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml, image/jfif"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={isUploading ? "업로드 중..." : url}
                  disabled={isUploading}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-purple-400"
                  style={{
                    background: dark ? "rgba(167,139,250,0.08)" : "rgba(168,85,247,0.06)",
                    border: dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.15)",
                    color: textColor,
                    opacity: isUploading ? 0.6 : 1,
                  }}
                  placeholder={type === "link" ? "https://..." : "https://... 또는 우측의 파일 직접 올리기를 선택하세요."}
                />
                {isUploading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Field 3: Body / Contents (only for Tooltip and Accordion) */}
          {(type === "tooltip" || type === "accordion") && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold block" style={{ color: subTextColor }}>
                  {type === "tooltip" && "툴팁 설명 (마우스 오버 시 표시할 내용)"}
                  {type === "accordion" && "아코디언 상세 내용"}
                </label>
                {/* Visual Format Sub-Helpers for nested elements */}
                <div className="flex gap-1">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertSubFormat("link", body, setBody)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold hover:opacity-80 transition-opacity"
                    style={{ background: dark ? "rgba(167,139,250,0.15)" : "rgba(168,85,247,0.1)", color: subTextColor }}
                  >
                    🔗 링크
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertSubFormat("image", body, setBody)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold hover:opacity-80 transition-opacity"
                    style={{ background: dark ? "rgba(167,139,250,0.15)" : "rgba(168,85,247,0.1)", color: subTextColor }}
                  >
                    🖼️ 이미지
                  </button>
                  {type === "accordion" && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insertSubFormat("tooltip", body, setBody)}
                      className="px-2 py-0.5 rounded text-[10px] font-bold hover:opacity-80 transition-opacity"
                      style={{ background: dark ? "rgba(167,139,250,0.15)" : "rgba(168,85,247,0.1)", color: subTextColor }}
                    >
                      💬 툴팁
                    </button>
                  )}
                </div>
              </div>
              <textarea
                ref={subTextareaRef}
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-purple-400 resize-y"
                style={{
                  background: dark ? "rgba(167,139,250,0.08)" : "rgba(168,85,247,0.06)",
                  border: dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.15)",
                  color: textColor,
                }}
                placeholder={
                  type === "tooltip"
                    ? "툴팁에 노출할 텍스트를 적어주세요. 상단 단축버튼으로 이미지와 링크를 내부에 넣을 수 있습니다."
                    : "아코디언이 열렸을 때 펼쳐질 내용입니다. 단축버튼으로 이미지, 링크, 툴팁을 추가할 수 있습니다."
                }
              />
            </div>
          )}

          {/* Real-time Interactive Preview Section */}
          <div
            className="rounded-2xl p-4 border flex flex-col gap-2 bg-opacity-30"
            style={{
              background: dark ? "rgba(167,139,250,0.02)" : "rgba(168,85,247,0.02)",
              borderColor: dark ? "rgba(167,139,250,0.1)" : "rgba(168,85,247,0.08)",
            }}
          >
            <p className="text-[10px] font-black tracking-wider uppercase opacity-60" style={{ color: subTextColor }}>
              👁️ 실시간 미리보기 (Live Preview)
            </p>
            <div className="min-h-12 flex items-center justify-center text-sm">
              <Tooltip.Provider>
                {type === "link" && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-bold underline transition-colors"
                    style={{
                      color: dark ? "#f0abfc" : "#7c3aed",
                      textDecorationColor: dark ? "#a855f7" : "#c084fc",
                      background: dark ? "rgba(168,85,247,0.12)" : "rgba(168,85,247,0.07)",
                    }}
                  >
                    {text || "링크텍스트"}
                    <ExternalLink size={10} className="inline shrink-0" />
                  </a>
                )}

                {type === "image" && (
                  <div className="max-w-full max-h-40 overflow-hidden rounded-xl border border-purple-300/10 p-1 flex items-center justify-center">
                    {url && url !== "https://" ? (
                      <img
                        src={url}
                        alt={text || "미리보기 이미지"}
                        className="max-w-full max-h-36 object-contain rounded-lg"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://placehold.co/300x150?text=Invalid+Image+URL";
                        }}
                      />
                    ) : (
                      <span className="text-xs opacity-40">이미지 URL을 입력하세요.</span>
                    )}
                  </div>
                )}

                {type === "tooltip" && (
                  <div className="flex flex-col items-center">
                    <p className="text-[10px] opacity-40 mb-1">단어 위에 마우스를 올려보세요:</p>
                    <Tooltip.Root delayDuration={50}>
                      <Tooltip.Trigger asChild>
                        <span
                          className="cursor-help rounded px-1.5 py-0.5 font-bold underline decoration-dotted underline-offset-4 transition-colors"
                          style={{
                            color: dark ? "#f0abfc" : "#7c3aed",
                            textDecorationColor: dark ? "#a855f7" : "#c084fc",
                            background: dark ? "rgba(168,85,247,0.12)" : "rgba(168,85,247,0.07)",
                          }}
                        >
                          {text || "단어"}
                        </span>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          side="top"
                          sideOffset={6}
                          className="z-50 max-w-xs rounded-2xl px-4 py-2.5 shadow-xl text-xs leading-relaxed"
                          style={{
                            background: dark ? "#1e1040" : "#fff",
                            color: dark ? "#e9d5ff" : "#2d1b4e",
                            border: dark
                              ? "1px solid rgba(167,139,250,0.3)"
                              : "1px solid rgba(168,85,247,0.2)",
                            fontFamily: "'Noto Sans KR', sans-serif",
                          }}
                        >
                          <span className="font-bold" style={{ color: "#a855f7" }}>
                            {text || "단어"}
                          </span>
                          <span className="mt-1 block text-[11px]">
                            {body ? (
                              <InlineRichText content={body} dark={dark} />
                            ) : (
                              <span className="opacity-40 italic">설명이 비어있습니다.</span>
                            )}
                          </span>
                          <Tooltip.Arrow style={{ fill: dark ? "#1e1040" : "#fff" }} />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </div>
                )}

                {type === "accordion" && (
                  <div className="w-full">
                    <Accordion.Root type="single" collapsible className="w-full">
                      <Accordion.Item value="preview-item" className="border-none">
                        <Accordion.Trigger
                          className="group flex w-full items-center justify-between rounded-xl px-4 py-2.5 font-bold text-xs text-left transition-all"
                          style={{
                            background: dark ? "rgba(30,20,50,0.6)" : "rgba(255,255,255,0.7)",
                            border: `1px solid ${dark ? "rgba(167,139,250,0.15)" : "rgba(168,85,247,0.12)"
                              }`,
                            color: dark ? "#e9d5ff" : "#3b0764",
                          }}
                        >
                          {text || "아코디언 제목"}
                          <ChevronDown
                            size={14}
                            className="transition-transform duration-300 group-data-[state=open]:rotate-180 shrink-0 ml-2"
                            style={{ color: "#a855f7" }}
                          />
                        </Accordion.Trigger>
                        <Accordion.Content className="overflow-hidden">
                          <div
                            className="px-4 py-3 rounded-b-xl -mt-2 text-xs leading-6"
                            style={{
                              background: dark ? "rgba(20,12,40,0.7)" : "rgba(250,245,255,0.9)",
                              border: `1px solid ${dark ? "rgba(167,139,250,0.15)" : "rgba(168,85,247,0.12)"
                                }`,
                              borderTop: "none",
                              color: dark ? "#c4b5fd" : "#4c1d95",
                            }}
                          >
                            {body ? (
                              <RichText content={body} dark={dark} />
                            ) : (
                              <span className="opacity-40 italic">아코디언 본문이 비어있습니다.</span>
                            )}
                          </div>
                        </Accordion.Content>
                      </Accordion.Item>
                    </Accordion.Root>
                  </div>
                )}
              </Tooltip.Provider>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex gap-2 justify-end pt-2 border-t border-purple-300/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-purple-100/10"
            style={{
              border: dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.15)",
              color: textColor,
            }}
          >
            취소
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 rounded-xl text-xs font-black text-white transition-all hover:scale-105"
            style={{
              background: "linear-gradient(90deg,#a855f7,#ec4899)",
            }}
          >
            적용하기
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── Post editor panel ────────────────────────────────────────────────────────

function PostEditor({ post, dark, onSave, onCancel }: {
  post: UpdatePost; dark: boolean;
  onSave: (p: UpdatePost) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<UpdatePost>(JSON.parse(JSON.stringify(post)));
  const [saved, setSaved] = useState(false);

  const [activeModal, setActiveModal] = useState<"link" | "tooltip" | "accordion" | "image" | null>(null);
  const [modalSelection, setModalSelection] = useState<{ start: number; end: number; text: string } | null>(null);
  const [modalBlockIdx, setModalBlockIdx] = useState<number | null>(null);

  function setField<K extends keyof UpdatePost>(k: K, v: UpdatePost[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  function addBlock(type: BlockType) {
    setDraft((d) => ({ ...d, blocks: [...d.blocks, newBlock(type)] }));
  }

  function updateBlock(i: number, b: ContentBlock) {
    setDraft((d) => {
      const blocks = [...d.blocks];
      blocks[i] = b;
      return { ...d, blocks };
    });
  }

  function deleteBlock(i: number) {
    setDraft((d) => ({ ...d, blocks: d.blocks.filter((_, j) => j !== i) }));
  }

  function moveBlock(from: number, dir: -1 | 1) {
    setDraft((d) => {
      const blocks = [...d.blocks];
      const to = from + dir;
      if (to < 0 || to >= blocks.length) return d;
      [blocks[from], blocks[to]] = [blocks[to], blocks[from]];
      return { ...d, blocks };
    });
  }

  function handleSave() {
    onSave(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const surface = dark ? "rgba(30,20,50,0.8)" : "rgba(255,255,255,0.9)";
  const border = dark ? "rgba(167,139,250,0.18)" : "rgba(168,85,247,0.12)";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col gap-4"
    >
      {/* Top actions */}
      <div className="flex items-center gap-2 justify-between">
        <button onClick={onCancel} className="flex items-center gap-1 text-xs font-bold opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: dark ? "#a78bfa" : "#7c3aed", fontFamily: "'Noto Sans KR', sans-serif" }}>
          ← 목록
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setField("published", !draft.published)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{
              background: draft.published ? "rgba(16,185,129,0.15)" : "rgba(167,139,250,0.1)",
              color: draft.published ? "#10b981" : dark ? "#a78bfa" : "#7c3aed",
              border: draft.published ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(16,185,129,0.3)",
            }}
          >
            {draft.published ? <><Eye size={12} /> 발행됨</> : <><EyeOff size={12} /> 비공개</>}
          </button>
          <motion.button
            onClick={handleSave}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black text-white transition-all"
            style={{ background: saved ? "#10b981" : "linear-gradient(90deg,#a855f7,#ec4899)" }}
          >
            {saved ? <><Check size={12} /> 저장됨</> : <><Save size={12} /> 저장</>}
          </motion.button>
        </div>
      </div>

      {/* Basic info */}
      <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: surface, border: `1px solid ${border}` }}>
        <p className="text-sm font-black" style={{ fontFamily: "'Jua', sans-serif", color: dark ? "#e9d5ff" : "#2d1b4e" }}>
          기본 정보
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label dark={dark}>날짜</Label>
            <Field dark={dark} type="date" value={draft.date} onChange={(e) => setField("date", e.target.value)} />
          </div>
          <div>
            <Label dark={dark}>카테고리</Label>
            <Select dark={dark} value={draft.category} onChange={(e) => setField("category", e.target.value as UpdateCategory)}>
              <option value="trickcal">🍀 트릭컬 업데이트</option>
              <option value="postcard">📮 마음의 편지함</option>
            </Select>
          </div>
        </div>
        <div>
          <Label dark={dark}>제목</Label>
          <Field dark={dark} value={draft.title} placeholder="업데이트 제목..." onChange={(e) => setField("title", e.target.value)} />
        </div>
        <div>
          <Label dark={dark}>요약문 (목록 미리보기)</Label>
          <Textarea dark={dark} rows={2} value={draft.summary} placeholder="한두 줄 요약..." onChange={(e) => setField("summary", e.target.value)} />
        </div>
      </div>

      {/* 2. Update blocks list */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-black" style={{ fontFamily: "'Jua', sans-serif", color: dark ? "#e9d5ff" : "#2d1b4e" }}>
            본문 구성 블록 목록 ({draft.blocks.length})
          </p>
        </div>

        <AnimatePresence>
          {draft.blocks.map((block, i) => {
            return (
              <motion.div
                key={`${block.type}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <BlockCard
                  block={block}
                  idx={i}
                  dark={dark}
                  total={draft.blocks.length}
                  onChange={(b) => updateBlock(i, b)}
                  onMove={moveBlock}
                  onDelete={() => deleteBlock(i)}
                  onTriggerFormatModal={(type, selection) => {
                    setModalBlockIdx(i);
                    setModalSelection(selection);
                    setActiveModal(type);
                  }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add block buttons panel */}
        <div
          className="rounded-2xl p-4 mt-2"
          style={{ background: dark ? "rgba(167,139,250,0.05)" : "rgba(168,85,247,0.04)", border: `1.5px dashed ${dark ? "rgba(167,139,250,0.2)" : "rgba(168,85,247,0.15)"}` }}
        >
          <p className="text-xs font-bold mb-3 text-center"
            style={{ color: dark ? "#6d5b8a" : "#c4b5fd", fontFamily: "'Noto Sans KR', sans-serif" }}>
            ➕ 본문 구성 블록 추가
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => addBlock("text")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{
                background: dark ? "rgba(167,139,250,0.1)" : "rgba(168,85,247,0.08)",
                color: dark ? "#a78bfa" : "#7c3aed",
                border: dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.15)",
              }}
            >
              <Plus size={11} /> ✍️ 본문 텍스트
            </button>
            <button
              onClick={() => addBlock("character_preset")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{
                background: dark ? "rgba(167,139,250,0.1)" : "rgba(168,85,247,0.08)",
                color: dark ? "#a78bfa" : "#7c3aed",
                border: dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.15)",
              }}
            >
              <Plus size={11} /> 👥 신규 사도 출시
            </button>
            <button
              onClick={() => addBlock("skin_preset")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{
                background: dark ? "rgba(167,139,250,0.1)" : "rgba(168,85,247,0.08)",
                color: dark ? "#a78bfa" : "#7c3aed",
                border: dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.15)",
              }}
            >
              <Plus size={11} /> 👗 신규 스킨 출시
            </button>
            <button
              onClick={() => addBlock("clone_preset")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{
                background: dark ? "rgba(167,139,250,0.1)" : "rgba(168,85,247,0.08)",
                color: dark ? "#a78bfa" : "#7c3aed",
                border: dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.15)",
              }}
            >
              <Plus size={11} /> 🧬 클론 팩토리 로테이션
            </button>
            <button
              onClick={() => addBlock("accordion")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{
                background: dark ? "rgba(167,139,250,0.1)" : "rgba(168,85,247,0.08)",
                color: dark ? "#a78bfa" : "#7c3aed",
                border: dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.15)",
              }}
            >
              <Plus size={11} /> 📂 아코디언 상자
            </button>
            <button
              onClick={() => addBlock("list")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{
                background: dark ? "rgba(167,139,250,0.1)" : "rgba(168,85,247,0.08)",
                color: dark ? "#a78bfa" : "#7c3aed",
                border: dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.15)",
              }}
            >
              <Plus size={11} /> 📋 목록 상자
            </button>
            <button
              onClick={() => addBlock("link")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{
                background: dark ? "rgba(167,139,250,0.1)" : "rgba(168,85,247,0.08)",
                color: dark ? "#a78bfa" : "#7c3aed",
                border: dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.15)",
              }}
            >
              <Plus size={11} /> 🔗 외부 링크 배너
            </button>
            <button
              onClick={() => addBlock("divider")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{
                background: dark ? "rgba(167,139,250,0.1)" : "rgba(168,85,247,0.08)",
                color: dark ? "#a78bfa" : "#7c3aed",
                border: dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.15)",
              }}
            >
              <Plus size={11} /> ➖ 구분선 추가
            </button>
            <button
              onClick={() => addBlock("shortcut_preset")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{
                background: dark ? "rgba(167,139,250,0.1)" : "rgba(168,85,247,0.08)",
                color: dark ? "#a78bfa" : "#7c3aed",
                border: dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.15)",
              }}
            >
              <Plus size={11} /> 🔗 바로가기 프리셋
            </button>
            <button
              onClick={() => addBlock("pvp_preset")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{
                background: dark ? "rgba(167,139,250,0.1)" : "rgba(168,85,247,0.08)",
                color: dark ? "#a78bfa" : "#7c3aed",
                border: dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.15)",
              }}
            >
              <Plus size={11} /> ⚔️ PvP 줘팸터 프리셋
            </button>
          </div>
        </div>
      </div>

      {/* Render Custom Formatting Helper Modal */}
      {activeModal && modalSelection && modalBlockIdx !== null && (
        <FormatInsertModal
          type={activeModal}
          selectionText={modalSelection.text}
          dark={dark}
          onClose={() => {
            setActiveModal(null);
            setModalSelection(null);
            setModalBlockIdx(null);
          }}
          onApply={(replacement) => {
            const block = draft.blocks[modalBlockIdx];
            const start = modalSelection.start;
            const end = modalSelection.end;
            const text = block.content || "";
            const newValue = text.substring(0, start) + replacement + text.substring(end);
            updateBlock(modalBlockIdx, { ...block, content: newValue });
            setActiveModal(null);
            setModalSelection(null);
            setModalBlockIdx(null);
          }}
        />
      )}
    </motion.div>
  );
}

// ─── Main Admin page ──────────────────────────────────────────────────────────

export function AdminUpdates() {
  const { dark } = useOutletContext<{ dark: boolean }>();
  const [posts, setPosts] = useState<UpdatePost[]>([]);
  const [editing, setEditing] = useState<UpdatePost | null>(null);

  useEffect(() => {
    loadUpdates()
      .then((data) => setPosts((data || []).sort((a, b) => b.date.localeCompare(a.date))))
      .catch(console.error);
  }, []);

  function handleSave(updated: UpdatePost) {
    saveUpdates(updated)
      .then((savedPost) => {
        const next = posts.some((p) => p.id === savedPost.id)
          ? posts.map((p) => (p.id === savedPost.id ? savedPost : p))
          : [savedPost, ...posts];
        setPosts(next.sort((a, b) => b.date.localeCompare(a.date)));
        setEditing(savedPost);
      })
      .catch((err) => {
        alert("저장 실패: " + err.message);
      });
  }

  function handleDelete(id: string) {
    if (!window.confirm("정말로 이 업데이트를 삭제하시겠습니까?")) return;
    deleteUpdate(id)
      .then(() => {
        const next = posts.filter((p) => p.id !== id);
        setPosts(next);
        if (editing?.id === id) setEditing(null);
      })
      .catch((err) => {
        alert("삭제 실패: " + err.message);
      });
  }

  function handleNew() {
    const maxWeek = posts.reduce((m, p) => Math.max(m, p.week), 0);
    const blank = { ...newPost(), week: maxWeek + 1 };
    setEditing(blank);
  }

  const labelColor = dark ? "#a78bfa" : "#a855f7";
  const titleColor = dark ? "#e9d5ff" : "#2d1b4e";
  const surface = dark ? "rgba(30,20,50,0.8)" : "rgba(255,255,255,0.85)";
  const border = dark ? "rgba(167,139,250,0.15)" : "rgba(168,85,247,0.1)";

  return (
    <div className="flex flex-col items-center py-10 px-4 min-h-screen">
      <div className={`w-full transition-all duration-300 ${editing ? "max-w-5xl" : "max-w-3xl"}`}>

        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-xs font-bold tracking-widest uppercase mb-1"
            style={{ color: labelColor, fontFamily: "'Noto Sans KR', sans-serif" }}>
            ADMIN PANEL
          </p>
          <h1 className="text-4xl font-black" style={{ fontFamily: "'Jua', sans-serif", color: titleColor }}>
            업데이트 관리
          </h1>
          <p className="text-sm mt-1" style={{ color: dark ? "#7c5c9a" : "#a78bfa", fontFamily: "'Noto Sans KR', sans-serif" }}>
            트릭컬 업데이트 요약을 작성하고 발행합니다.
          </p>
        </motion.div>

        <div className={editing ? "w-full" : "grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 items-start"}>

          {/* Left: post list (Hidden when editing) */}
          {!editing && (
            <div className="flex flex-col gap-3">
              <button
                onClick={handleNew}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl font-bold text-sm text-white transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(90deg,#a855f7,#ec4899)", fontFamily: "'Noto Sans KR', sans-serif" }}
              >
                <Plus size={15} /> 새 업데이트 작성
              </button>

              <div className="rounded-2xl overflow-hidden" style={{ background: surface, border: `1px solid ${border}`, backdropFilter: "blur(12px)" }}>
                {posts.length === 0 && (
                  <p className="text-xs text-center py-8" style={{ color: dark ? "#6d5b8a" : "#c4b5fd", fontFamily: "'Noto Sans KR', sans-serif" }}>
                    업데이트 글이 없습니다.
                  </p>
                )}
                {posts.map((post) => {
                  const meta = CATEGORY_META[post.category];
                  const isActive = editing?.id === post.id;
                  return (
                    <div
                      key={post.id}
                      className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors group"
                      style={{
                        borderBottom: `1px solid ${border}`,
                        background: isActive ? (dark ? "rgba(168,85,247,0.1)" : "rgba(168,85,247,0.06)") : "transparent",
                      }}
                      onClick={() => setEditing(post)}
                    >
                      <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white text-base mt-0.5 shadow-sm"
                        style={{
                          background: post.category === "postcard"
                            ? "linear-gradient(135deg,#db2777,#ec4899)"
                            : "linear-gradient(135deg,#10b981,#059669)",
                        }}>
                        {meta.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate"
                          style={{ color: dark ? "#e9d5ff" : "#2d1b4e", fontFamily: "'Noto Sans KR', sans-serif" }}>
                          {post.title || "(제목 없음)"}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: `${meta.color}22`, color: meta.color }}>
                            {meta.emoji}
                          </span>
                          {!post.published && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-yellow-100 text-yellow-600">비공개</span>
                          )}
                          <span className="text-[10px]" style={{ color: dark ? "#6d5b8a" : "#c4b5fd" }}>
                            블록 {post.blocks.length}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all"
                        style={{ color: "#f43f5e", background: "rgba(244,63,94,0.1)" }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Right: editor */}
          <div className={editing ? "w-full" : ""}>
            {editing ? (
              <PostEditor
                key={editing.id}
                post={editing}
                dark={dark}
                onSave={handleSave}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div
                className="rounded-2xl flex flex-col items-center justify-center py-20 gap-3"
                style={{ background: surface, border: `1.5px dashed ${border}`, backdropFilter: "blur(12px)" }}
              >
                <Edit3 size={32} style={{ color: dark ? "#4c3670" : "#e9d5ff" }} />
                <p className="text-sm font-bold text-center" style={{ color: dark ? "#6d5b8a" : "#c4b5fd", fontFamily: "'Noto Sans KR', sans-serif" }}>
                  왼쪽 목록에서 수정할 글을 선택하거나<br />새 업데이트를 작성하세요.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
