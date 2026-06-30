import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useOutletContext, useNavigate } from "react-router";
import {
  ChevronLeft, ChevronDown, ExternalLink, Star,
  List, AlignLeft, BookOpen, Hash
} from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Accordion from "@radix-ui/react-accordion";
import {
  loadUpdates, CATEGORY_META,
  type UpdatePost, type ContentBlock, type CharacterPresetBlock, type ClonePresetBlock, type ShortcutPresetBlock,
  type PvpPresetBlock,
} from "../updateStore";

// --- Custom Icon Imports ---
// 등급
import star1 from "../../imports/CharacterIcon/등급/1성.PNG";
import star2 from "../../imports/CharacterIcon/등급/2성.PNG";
import star3 from "../../imports/CharacterIcon/등급/3성.PNG";

// 성격
import resonanceIcon from "../../imports/CharacterIcon/성격/공명.PNG";
import madnessIcon from "../../imports/CharacterIcon/성격/광기.PNG";
import calmIcon from "../../imports/CharacterIcon/성격/냉정.PNG";
import pureIcon from "../../imports/CharacterIcon/성격/순수.PNG";
import gloomIcon from "../../imports/CharacterIcon/성격/우울.PNG";
import activeIcon from "../../imports/CharacterIcon/성격/활발.PNG";

// 배치 열
import allRowsIcon from "../../imports/CharacterIcon/배치 열/모든열.PNG";
import frontRowIcon from "../../imports/CharacterIcon/배치 열/전열.PNG";
import midRowIcon from "../../imports/CharacterIcon/배치 열/중열.PNG";
import backRowIcon from "../../imports/CharacterIcon/배치 열/후열.PNG";

// 역할군
import dealerIcon from "../../imports/CharacterIcon/역할군/딜러.PNG";
import supporterIcon from "../../imports/CharacterIcon/역할군/서포터.PNG";
import tankerIcon from "../../imports/CharacterIcon/역할군/탱커.PNG";

// 종족
import witchIcon from "../../imports/CharacterIcon/종족/마녀.PNG";
import mysticIcon from "../../imports/CharacterIcon/종족/미스틱.PNG";
import beastIcon from "../../imports/CharacterIcon/종족/수인.PNG";
import elfIcon from "../../imports/CharacterIcon/종족/엘프.PNG";
import fairyIcon from "../../imports/CharacterIcon/종족/요정.PNG";
import dragonIcon from "../../imports/CharacterIcon/종족/용족.PNG";
import ghostIcon from "../../imports/CharacterIcon/종족/유령.PNG";
import spiritIcon from "../../imports/CharacterIcon/종족/정령.PNG";

const RARITY_ICONS: Record<string, string> = {
  "1성": star1,
  "2성": star2,
  "3성(일반)": star3,
  "3성(엘다인)": star3,
};
const PERSONALITY_ICONS: Record<string, string> = {
  "공명": resonanceIcon,
  "광기": madnessIcon,
  "냉정": calmIcon,
  "순수": pureIcon,
  "우울": gloomIcon,
  "활발": activeIcon,
};
const POSITION_ICONS: Record<string, string> = {
  "전열": frontRowIcon,
  "중열": midRowIcon,
  "후열": backRowIcon,
};
const ROLE_ICONS: Record<string, string> = {
  "딜러": dealerIcon,
  "서포터": supporterIcon,
  "탱커": tankerIcon,
};
const RACE_ICONS: Record<string, string> = {
  "마녀": witchIcon,
  "미스틱": mysticIcon,
  "수인": beastIcon,
  "엘프": elfIcon,
  "요정": fairyIcon,
  "용족": dragonIcon,
  "유령": ghostIcon,
  "정령": spiritIcon,
};


// ─── Tooltip-aware text renderer ─────────────────────────────────────────────

export function InlineRichText({ content, dark, className = "leading-8 text-sm whitespace-pre-wrap" }: { content: string; dark: boolean; className?: string }) {
  if (!content) return null;

  const regex = /(!\[([^\]]+)\]\(([^)]+)\))|(\[([^\]]+)\]\(([^)]+)\))|(\[([^\]]+)\]\{([^}]+)\})/g;
  const segments: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const matchIndex = match.index;

    // Add plain text before match
    if (matchIndex > lastIndex) {
      segments.push(content.substring(lastIndex, matchIndex));
    }

    if (match[1]) {
      // Image / GIF match
      const altText = match[2];
      const imageUrl = match[3];
      segments.push(
        <span key={matchIndex} className="block my-2 max-w-full overflow-hidden rounded-2xl border border-purple-300/10">
          <img src={imageUrl} alt={altText} className="max-w-full max-h-80 object-contain rounded-2xl" referrerPolicy="no-referrer" />
        </span>
      );
    } else if (match[4]) {
      // Link match
      const linkText = match[5];
      const linkUrl = match[6];
      segments.push(
        <a
          key={matchIndex}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 rounded px-1 font-bold underline transition-colors"
          style={{
            color: dark ? "#f0abfc" : "#7c3aed",
            textDecorationColor: dark ? "#a855f7" : "#c084fc",
            background: dark ? "rgba(168,85,247,0.12)" : "rgba(168,85,247,0.07)",
          }}
        >
          {linkText}
          <ExternalLink size={10} className="inline shrink-0" />
        </a>
      );
    } else if (match[7]) {
      // Tooltip match
      const tooltipText = match[8];
      const tooltipTip = match[9];
      segments.push(
        <Tooltip.Root key={matchIndex} delayDuration={100}>
          <Tooltip.Trigger asChild>
            <span
              className="cursor-help rounded px-1 font-bold underline decoration-dotted underline-offset-4 transition-colors"
              style={{
                color: dark ? "#f0abfc" : "#7c3aed",
                textDecorationColor: dark ? "#a855f7" : "#c084fc",
                background: dark ? "rgba(168,85,247,0.12)" : "rgba(168,85,247,0.07)",
              }}
            >
              {tooltipText}
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
                border: dark ? "1px solid rgba(167,139,250,0.3)" : "1px solid rgba(168,85,247,0.2)",
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              <span className="font-bold" style={{ color: "#a855f7" }}>{tooltipText}</span>
              <span className="mt-1 block text-xs">
                <InlineRichText content={tooltipTip} dark={dark} className="leading-relaxed text-xs whitespace-pre-wrap" />
              </span>
              <Tooltip.Arrow style={{ fill: dark ? "#1e1040" : "#fff" }} />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    segments.push(content.substring(lastIndex));
  }

  return (
    <span className={className}
      style={{ color: dark ? "#c4b5fd" : "#4c1d95", fontFamily: "'Noto Sans KR', sans-serif" }}>
      {segments.map((seg, idx) => (
        <span key={idx}>{seg}</span>
      ))}
    </span>
  );
}

export function RichText({ content, dark }: {
  content: string; dark: boolean;
}) {
  if (!content) return null;

  // Split by divider "---" on a single line
  const dividerRegex = /(?:^|\n)\s*---\s*(?:\n|$)/g;
  const parts = content.split(dividerRegex);

  const renderedParts = parts.map((part, partIdx) => {
    // Match inline accordions [[Title]]{Body}
    const accordionRegex = /\[\[([^\]]+)\]\]\{([^}]+)\}/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = accordionRegex.exec(part)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        elements.push(
          <div key={`txt-${lastIndex}`} className="mb-2">
            <InlineRichText content={part.substring(lastIndex, matchIndex)} dark={dark} />
          </div>
        );
      }

      const title = match[1];
      const body = match[2];

      elements.push(
        <div key={`acc-${matchIndex}`} className="my-3 w-full">
          <Accordion.Root type="single" collapsible className="w-full">
            <Accordion.Item value="item" className="border-none">
              <Accordion.Trigger
                className="group flex w-full items-center justify-between rounded-2xl px-5 py-3.5 font-bold text-sm text-left transition-all"
                style={{
                  background: dark ? "rgba(30,20,50,0.6)" : "rgba(255,255,255,0.7)",
                  border: `1px solid ${dark ? "rgba(167,139,250,0.15)" : "rgba(168,85,247,0.12)"}`,
                  color: dark ? "#e9d5ff" : "#3b0764",
                  fontFamily: "'Jua', sans-serif",
                }}
              >
                {title}
                <ChevronDown
                  size={16}
                  className="transition-transform duration-300 group-data-[state=open]:rotate-180 shrink-0 ml-2"
                  style={{ color: "#a855f7" }}
                />
              </Accordion.Trigger>
              <Accordion.Content className="overflow-hidden">
                <div
                  className="px-5 py-4 rounded-b-2xl -mt-2 text-sm leading-7"
                  style={{
                    background: dark ? "rgba(20,12,40,0.7)" : "rgba(250,245,255,0.9)",
                    border: `1px solid ${dark ? "rgba(167,139,250,0.15)" : "rgba(168,85,247,0.12)"}`,
                    borderTop: "none",
                    color: dark ? "#c4b5fd" : "#4c1d95",
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}
                >
                  {/* Recursive call to support nested tooltips & links inside accordion body */}
                  <RichText content={body} dark={dark} />
                </div>
              </Accordion.Content>
            </Accordion.Item>
          </Accordion.Root>
        </div>
      );

      lastIndex = accordionRegex.lastIndex;
    }

    if (lastIndex < part.length) {
      elements.push(
        <div key={`txt-${lastIndex}`} className="mb-2">
          <InlineRichText content={part.substring(lastIndex)} dark={dark} />
        </div>
      );
    }

    return (
      <div key={`part-${partIdx}`} className="flex flex-col gap-1 w-full">
        {elements}
      </div>
    );
  });

  const finalElements: React.ReactNode[] = [];
  renderedParts.forEach((partEl, idx) => {
    finalElements.push(partEl);
    if (idx < renderedParts.length - 1) {
      finalElements.push(
        <hr
          key={`div-${idx}`}
          className="my-5 border-0 h-px w-full"
          style={{ background: dark ? "rgba(167,139,250,0.15)" : "rgba(168,85,247,0.1)" }}
        />
      );
    }
  });

  return <div className="w-full flex flex-col gap-2">{finalElements}</div>;
}

import { CHARACTER_IMAGES, CharacterPersonality, CharacterRace, BirthRarity, CharacterRole, CharacterPosition } from "../characterImages";

interface StyleProfile {
  bg: string;
  cardBg: string;
  border: string;
  text: string;
  badgeBg: string;
  nameColor: string;
}

const PERSONALITY_STYLES: Record<number, StyleProfile> = {
  [CharacterPersonality.순수]: {
    bg: "#66C17C",
    cardBg: "#3e744d",
    border: "rgba(102, 193, 124, 0.4)",
    text: "text-emerald-950",
    badgeBg: "bg-emerald-950/80 text-emerald-300 border-emerald-500/30",
    nameColor: "#115e59",
  },
  [CharacterPersonality.냉정]: {
    bg: "#83b9eb",
    cardBg: "#3f71a3",
    border: "rgba(131, 185, 235, 0.4)",
    text: "text-blue-950",
    badgeBg: "bg-blue-950/80 text-blue-300 border-blue-500/30",
    nameColor: "#1e3a8a",
  },
  [CharacterPersonality.광기]: {
    bg: "#eb839a",
    cardBg: "#a33f54",
    border: "rgba(235, 131, 154, 0.4)",
    text: "text-red-950",
    badgeBg: "bg-red-950/80 text-red-300 border-red-500/30",
    nameColor: "#7f1d1d",
  },
  [CharacterPersonality.활발]: {
    bg: "#ebdb83",
    cardBg: "#a3933f",
    border: "rgba(235, 219, 131, 0.4)",
    text: "text-yellow-950",
    badgeBg: "bg-yellow-950/80 text-yellow-300 border-yellow-500/30",
    nameColor: "#78350f",
  },
  [CharacterPersonality.우울]: {
    bg: "#c683ec",
    cardBg: "#893fa3",
    border: "rgba(198, 131, 236, 0.4)",
    text: "text-purple-950",
    badgeBg: "bg-purple-950/80 text-purple-300 border-purple-500/30",
    nameColor: "#581c87",
  },
  [CharacterPersonality.공명]: {
    bg: "#a1a1aa",
    cardBg: "#606066",
    border: "rgba(161, 161, 170, 0.4)",
    text: "text-zinc-950",
    badgeBg: "bg-zinc-950/80 text-zinc-300 border-zinc-500/30",
    nameColor: "#27272a",
  },
};

const PERSONALITY_ICONS_ENUM: Record<number, string> = {
  [CharacterPersonality.순수]: pureIcon,
  [CharacterPersonality.냉정]: calmIcon,
  [CharacterPersonality.광기]: madnessIcon,
  [CharacterPersonality.활발]: activeIcon,
  [CharacterPersonality.우울]: gloomIcon,
  [CharacterPersonality.공명]: resonanceIcon,
};

const RACE_ICONS_ENUM: Record<number, string> = {
  [CharacterRace.마녀]: witchIcon,
  [CharacterRace.미스틱]: mysticIcon,
  [CharacterRace.수인]: beastIcon,
  [CharacterRace.엘프]: elfIcon,
  [CharacterRace.요정]: fairyIcon,
  [CharacterRace.용족]: dragonIcon,
  [CharacterRace.유령]: ghostIcon,
  [CharacterRace.정령]: spiritIcon,
};

const RARITY_ICONS_ENUM: Record<number, string> = {
  [BirthRarity.ThreeStarEldain]: star3,
  [BirthRarity.ThreeStar]: star3,
  [BirthRarity.TwoStar]: star2,
  [BirthRarity.OneStar]: star1,
};

const ROLE_ICONS_ENUM: Record<number, string> = {
  [CharacterRole.딜러]: dealerIcon,
  [CharacterRole.서포터]: supporterIcon,
  [CharacterRole.탱커]: tankerIcon,
};

const POSITION_ICONS_ENUM: Record<number, string> = {
  [CharacterPosition.전열]: frontRowIcon,
  [CharacterPosition.중열]: midRowIcon,
  [CharacterPosition.후열]: backRowIcon,
  [CharacterPosition.모든열]: allRowsIcon,
};

function SmallApostleCard({ name, dark }: { name: string; dark: boolean }) {
  const entry = CHARACTER_IMAGES[name];
  if (!entry) {
    return (
      <div className="w-[100px] h-[122px] rounded-2xl flex items-center justify-center bg-black/20 border border-purple-500/10 text-[10px] text-gray-500 font-bold">
        {name || "미지정"}
      </div>
    );
  }

  const style = PERSONALITY_STYLES[entry.personality];
  const pIcon = PERSONALITY_ICONS_ENUM[entry.personality];
  const rIcon = RACE_ICONS_ENUM[entry.race];
  const roleIcon = ROLE_ICONS_ENUM[entry.role];
  const posIcon = POSITION_ICONS_ENUM[entry.position];
  const rarityStar = RARITY_ICONS_ENUM[entry.rarity];

  return (
    <div
      className="w-[100px] h-[122px] rounded-2xl p-1.5 flex flex-col items-center justify-between border relative overflow-hidden shrink-0 shadow-md"
      style={{
        background: style?.cardBg || "#27272a",
        borderColor: style?.border || "rgba(255,255,255,0.1)",
      }}
    >
      {/* Portrait Box */}
      <div
        className="w-[84px] h-[84px] rounded-lg overflow-hidden border border-black/10 relative shadow-inner mt-0.5"
        style={{ background: style?.bg || "#3f3f46" }}
      >
        {entry.default ? (
          <img
            src={entry.default}
            alt={name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400">
            이미지
          </div>
        )}

        {/* Top-Left Personality */}
        {pIcon && (
          <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-black/60 border border-white/10 shadow-md backdrop-blur-sm z-10">
            <img src={pIcon} alt="성격" className="w-3 h-3 object-contain" />
          </div>
        )}

        {/* Top-Right Race */}
        {rIcon && (
          <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-black/60 border border-white/10 shadow-md backdrop-blur-sm z-10">
            <img src={rIcon} alt="종족" className="w-3 h-3 object-contain" />
          </div>
        )}

        {/* Bottom-Left Role */}
        {roleIcon && (
          <div className="absolute bottom-0.5 left-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-black/60 border border-white/10 shadow-md backdrop-blur-sm z-10">
            <img src={roleIcon} alt="역할" className="w-3 h-3 object-contain" />
          </div>
        )}

        {/* Bottom-Right Position */}
        {posIcon && (
          <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-black/60 border border-white/10 shadow-md backdrop-blur-sm z-10">
            <img src={posIcon} alt="배치" className="w-3 h-3 object-contain" />
          </div>
        )}

        {/* Star Rating */}
        <div className="absolute bottom-0.5 left-0 right-0 h-3 flex items-center justify-center z-20">
          {rarityStar && <img src={rarityStar} alt="등급" className="h-full object-contain" />}
        </div>
      </div>

      {/* Apostle Name */}
      <div className="w-full text-center mb-0.5">
        <span
          className="text-[9px] font-black truncate block px-0.5 tracking-wide text-white"
          style={{
            fontFamily: "'Jua', sans-serif",
            textShadow: "0 1px 2px rgba(0,0,0,0.8)",
          }}
        >
          {name}
        </span>
      </div>
    </div>
  );
}

function ClonePresetBlockRenderer({ block, dark }: { block: ClonePresetBlock; dark: boolean }) {
  const border = dark ? "rgba(167,139,250,0.2)" : "rgba(168,85,247,0.15)";
  const title = block.title || "클론 팩토리 보상 로테이션";

  const rotations = block.rotations && block.rotations.length > 0 ? block.rotations : [
    { stages: "1, 7, 13", before: ["", "", "", "", ""], after: ["", "", "", "", ""] },
    { stages: "2, 8, 14", before: ["", "", "", "", ""], after: ["", "", "", "", ""] },
    { stages: "3, 9, 15", before: ["", "", "", "", ""], after: ["", "", "", "", ""] },
    { stages: "4, 10, 16", before: ["", "", "", "", ""], after: ["", "", "", "", ""] },
    { stages: "5, 11, 17", before: ["", "", "", "", ""], after: ["", "", "", "", ""] },
    { stages: "6, 12, 18", before: ["", "", "", "", ""], after: ["", "", "", "", ""] },
  ];

  return (
    <Accordion.Root type="single" collapsible className="my-4">
      <Accordion.Item value="item" className="border-none">
        {/* Accordion Header */}
        <Accordion.Trigger
          className="group flex w-full items-center justify-between rounded-2xl px-5 py-4 font-black text-base text-left transition-all"
          style={{
            background: dark ? "rgba(30,20,50,0.8)" : "rgba(255,255,255,0.9)",
            border: `1px solid ${border}`,
            color: dark ? "#e9d5ff" : "#3b0764",
            fontFamily: "'Jua', sans-serif",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🧬</span>
            <span>{title}</span>
          </div>
          <ChevronDown
            size={18}
            className="transition-transform duration-300 group-data-[state=open]:rotate-180 shrink-0 ml-2"
            style={{ color: "#a855f7" }}
          />
        </Accordion.Trigger>

        {/* Accordion Content */}
        <Accordion.Content className="overflow-hidden">
          <div
            className="px-5 py-5 rounded-b-2xl -mt-2 border-t-0 flex flex-col gap-6"
            style={{
              background: dark ? "rgba(15,10,30,0.85)" : "rgba(253,251,255,0.95)",
              border: `1px solid ${border}`,
              borderTop: "none",
              backdropFilter: "blur(12px)",
            }}
          >
            {rotations.map((rot, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-3.5 pb-5 last:pb-0 last:border-b-0 border-b border-purple-500/10"
              >
                {/* Stage Header */}
                <div className="flex items-center gap-2 font-bold text-sm text-purple-300">
                  <span className="bg-purple-600/20 border border-purple-500/30 text-purple-200 px-2 py-0.5 rounded-lg text-xs font-black">
                    스테이지 {rot.stages}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                  {/* Before */}
                  <div className="flex flex-col gap-2 bg-black/10 p-3 rounded-2xl border border-purple-500/5">
                    <span className="text-xs font-black text-red-400 flex items-center gap-1">
                      🔴 변경 전 (Before)
                    </span>
                    <div className="flex flex-wrap gap-2 justify-start">
                      {(rot.before || []).map((bName, i) => (
                        <SmallApostleCard key={i} name={bName} dark={dark} />
                      ))}
                    </div>
                  </div>

                  {/* After */}
                  <div className="flex flex-col gap-2 bg-black/10 p-3 rounded-2xl border border-purple-500/5">
                    <span className="text-xs font-black text-green-400 flex items-center gap-1">
                      🟢 변경 후 (After)
                    </span>
                    <div className="flex flex-wrap gap-2 justify-start">
                      {(rot.after || []).map((aName, i) => (
                        <SmallApostleCard key={i} name={aName} dark={dark} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
}

function PvpPresetBlockRenderer({ block, dark }: { block: PvpPresetBlock; dark: boolean }) {
  const border = dark ? "rgba(167,139,250,0.2)" : "rgba(168,85,247,0.15)";
  const title = block.title || "PvP 승자의 줘팸터 신규 정규 시즌";
  const eldainDesc = block.eldainLimitDesc || "엘다인 덱 편성 제한 개수가 사라집니다.";
  const highSkillDesc = block.highSkillDesc || "PvP 승자의 줘팸터에서 고학년 스킬을 사용할 수 있습니다.";

  const [creationDate, setCreationDate] = useState<string>("");
  const [calcResult, setCalcResult] = useState<{ groupName: string; days: number } | null>(null);

  const handleCalculate = (dateStr: string) => {
    setCreationDate(dateStr);
    if (!dateStr) {
      setCalcResult(null);
      return;
    }

    const baseline = new Date(block.standardDate || "2026-06-18");
    const target = new Date(dateStr);
    
    const diffTime = baseline.getTime() - target.getTime();
    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    
    const matchingRule = (block.groupRules || []).find(r => {
      const min = r.minDays ?? 0;
      const max = r.maxDays ?? 99999;
      return diffDays >= min && diffDays <= max;
    });

    if (matchingRule) {
      setCalcResult({
        groupName: matchingRule.groupName,
        days: diffDays
      });
    } else {
      setCalcResult({
        groupName: "배정 조건 없음 (가입 기간 확인 필요)",
        days: diffDays
      });
    }
  };

  return (
    <Accordion.Root type="single" collapsible className="my-4">
      <Accordion.Item value="item" className="border-none">
        {/* Accordion Trigger */}
        <Accordion.Trigger
          className="group flex w-full items-center justify-between rounded-2xl px-5 py-4 font-black text-base text-left transition-all"
          style={{
            background: dark ? "rgba(30,20,50,0.8)" : "rgba(255,255,255,0.9)",
            border: `1px solid ${border}`,
            color: dark ? "#e9d5ff" : "#3b0764",
            fontFamily: "'Jua', sans-serif",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">⚔️</span>
            <span>{title}</span>
          </div>
          <ChevronDown
            size={18}
            className="transition-transform duration-300 group-data-[state=open]:rotate-180 shrink-0 ml-2"
            style={{ color: "#a855f7" }}
          />
        </Accordion.Trigger>

        {/* Accordion Content */}
        <Accordion.Content className="overflow-hidden">
          <div
            className="px-5 py-5 rounded-b-2xl -mt-2 border-t-0 flex flex-col gap-5"
            style={{
              background: dark ? "rgba(15,10,30,0.85)" : "rgba(253,251,255,0.95)",
              border: `1px solid ${border}`,
              borderTop: "none",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* 1. Schedule Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Season Period Card */}
              <div
                className="p-4 rounded-2xl border flex flex-col gap-1.5"
                style={{
                  background: dark ? "rgba(139,92,246,0.06)" : "rgba(139,92,246,0.03)",
                  borderColor: dark ? "rgba(139,92,246,0.2)" : "rgba(139,92,246,0.1)",
                }}
              >
                <span className="text-[10px] font-black text-purple-400 tracking-wider uppercase">🗓️ 진행 기간</span>
                <span className="text-sm font-bold leading-relaxed" style={{ color: dark ? "#e9d5ff" : "#2d1b4e" }}>
                  {block.seasonPeriod}
                </span>
              </div>

              {/* Settlement Time Card */}
              <div
                className="p-4 rounded-2xl border flex flex-col gap-1.5"
                style={{
                  background: dark ? "rgba(244,63,94,0.05)" : "rgba(244,63,94,0.03)",
                  borderColor: dark ? "rgba(244,63,94,0.15)" : "rgba(244,63,94,0.08)",
                }}
              >
                <span className="text-[10px] font-black text-rose-400 tracking-wider uppercase">🕒 정산 시간 (입장 불가)</span>
                <span className="text-sm font-bold leading-relaxed" style={{ color: dark ? "#fca5a5" : "#be123c" }}>
                  {block.settlementTime}
                </span>
              </div>
            </div>

            {/* 2. Group Creation Rules Timeline */}
            <div
              className="p-4 rounded-2xl border flex flex-col gap-4"
              style={{
                background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
                borderColor: border,
              }}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-black text-purple-400">🛡️ 그룹 생성 규칙 및 매칭 배정</span>
                {block.botInfo && (
                  <span className="text-[10.5px] opacity-70" style={{ color: dark ? "#c4b5fd" : "#4c1d95" }}>
                    ℹ️ {block.botInfo}
                  </span>
                )}
              </div>

              {/* Timeline list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(block.groupRules || []).map((rule, idx) => {
                  const isNewbie = rule.groupName.includes("새싹");
                  const isApprentice = rule.groupName.includes("견습");
                  const badgeColor = isNewbie 
                    ? "from-emerald-500 to-teal-500" 
                    : isApprentice 
                      ? "from-blue-500 to-cyan-500" 
                      : "from-purple-500 to-pink-500";

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl border text-xs gap-3"
                      style={{
                        background: dark ? "rgba(0,0,0,0.2)" : "#ffffff",
                        borderColor: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                      }}
                    >
                      <span className="font-bold opacity-80" style={{ color: dark ? "#c4b5fd" : "#4c1d95" }}>{rule.period}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black text-white bg-gradient-to-r ${badgeColor} shadow-sm shrink-0`}>
                        {rule.groupName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Matching Calculator */}
            <div
              className="p-4 rounded-2xl border flex flex-col gap-3"
              style={{
                background: dark ? "rgba(167,139,250,0.03)" : "rgba(168,85,247,0.02)",
                borderColor: dark ? "rgba(167,139,250,0.15)" : "rgba(168,85,247,0.15)",
              }}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-black text-purple-400 flex items-center gap-1.5">
                  🔍 내 매칭 그룹 확인기
                </span>
                <span className="text-[10px] opacity-70" style={{ color: dark ? "#c4b5fd" : "#4c1d95" }}>
                  기준일({block.standardDate || "2026-06-18"}) 대비 계정 가입 경과일에 해당하는 줘팸터 매칭 그룹을 실시간 계산합니다.
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="flex flex-col gap-1 shrink-0">
                  <span className="text-[9px] font-bold opacity-60">내 계정 생성일 입력</span>
                  <input
                    type="date"
                    value={creationDate}
                    onChange={(e) => handleCalculate(e.target.value)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-950 border border-purple-500/25 text-white outline-none focus:border-purple-400"
                    style={{
                      colorScheme: "dark",
                    }}
                  />
                </div>

                {calcResult && (
                  <div
                    className="flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-xl border border-purple-500/10 animate-fade-in"
                    style={{
                      background: dark ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.7)",
                    }}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-bold opacity-50">배정 결과</span>
                      <span className="text-sm font-black" style={{ color: dark ? "#c084fc" : "#7e22ce" }}>
                        {calcResult.groupName}
                      </span>
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-lg text-purple-200 bg-purple-500/20 border border-purple-500/30 shrink-0">
                      가입 후 {calcResult.days}일 경과
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Key Operational Changes (Vacation, Eldain, Skills) */}
            <div className="flex flex-col gap-3">
              {/* Vacation Apostles */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl border text-xs"
                style={{
                  background: dark ? "rgba(251,191,36,0.04)" : "rgba(251,191,36,0.03)",
                  borderColor: dark ? "rgba(251,191,36,0.15)" : "rgba(251,191,36,0.1)",
                  color: dark ? "#fbbf24" : "#d97706"
                }}
              >
                <span className="text-sm shrink-0">🏖️</span>
                <div className="flex flex-col gap-0.5">
                  <span className="font-black text-[10px] tracking-wider uppercase opacity-75">휴가 사도 안내</span>
                  <span className="font-bold">{block.vocationApostles}</span>
                </div>
              </div>

              {/* Eldain Deck Limits */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl border text-xs"
                style={{
                  background: dark ? "rgba(167,139,250,0.04)" : "rgba(168,85,247,0.03)",
                  borderColor: dark ? "rgba(167,139,250,0.15)" : "rgba(168,85,247,0.12)",
                  color: dark ? "#c4b5fd" : "#6d28d9"
                }}
              >
                <span className="text-sm shrink-0">👑</span>
                <div className="flex flex-col gap-0.5">
                  <span className="font-black text-[10px] tracking-wider uppercase opacity-75">엘다인 덱 편성 제한 해제</span>
                  <span className="font-bold">{eldainDesc}</span>
                </div>
              </div>

              {/* High Skill Usage details */}
              <div className="flex gap-3 p-3.5 rounded-xl border text-xs items-start"
                style={{
                  background: dark ? "rgba(139,92,246,0.06)" : "rgba(139,92,246,0.04)",
                  borderColor: dark ? "rgba(139,92,246,0.2)" : "rgba(139,92,246,0.12)",
                  color: dark ? "#e9d5ff" : "#3b0764"
                }}
              >
                <span className="text-sm shrink-0 mt-0.5">⚡</span>
                <div className="flex flex-col gap-1">
                  <span className="font-black text-[10px] tracking-wider uppercase opacity-75 text-purple-400">줘팸터 내 고학년 스킬 도입</span>
                  <p className="font-bold leading-relaxed">{highSkillDesc}</p>
                </div>
              </div>
            </div>

          </div>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
}

function ShortcutPresetBlockRenderer({ block, dark }: { block: ShortcutPresetBlock; dark: boolean }) {
  const border = dark ? "rgba(167,139,250,0.2)" : "rgba(168,85,247,0.15)";
  const title = block.title || "바로가기";
  
  const shortcuts = block.shortcuts && block.shortcuts.length > 0 ? block.shortcuts : [];

  return (
    <Accordion.Root type="single" collapsible className="my-4">
      <Accordion.Item value="item" className="border-none">
        {/* Accordion Header */}
        <Accordion.Trigger
          className="group flex w-full items-center justify-between rounded-2xl px-5 py-4 font-black text-base text-left transition-all"
          style={{
            background: dark ? "rgba(30,20,50,0.8)" : "rgba(255,255,255,0.9)",
            border: `1px solid ${border}`,
            color: dark ? "#e9d5ff" : "#3b0764",
            fontFamily: "'Jua', sans-serif",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🔗</span>
            <span>{title}</span>
          </div>
          <ChevronDown
            size={18}
            className="transition-transform duration-300 group-data-[state=open]:rotate-180 shrink-0 ml-2"
            style={{ color: "#a855f7" }}
          />
        </Accordion.Trigger>

        {/* Accordion Content */}
        <Accordion.Content className="overflow-hidden">
          <div
            className="px-5 py-5 rounded-b-2xl -mt-2 border-t-0 flex flex-col gap-4"
            style={{
              background: dark ? "rgba(15,10,30,0.85)" : "rgba(253,251,255,0.95)",
              border: `1px solid ${border}`,
              borderTop: "none",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* 2 Column Grid for Shortcuts */}
            <div className="grid grid-cols-2 gap-3">
              {shortcuts.map((sh, idx) => (
                <a
                  key={idx}
                  href={sh.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2.5 rounded-2xl px-4 py-3.5 group transition-all hover:scale-[1.01] hover:shadow-md"
                  style={{
                    background: dark ? "rgba(30,20,50,0.5)" : "rgba(255,255,255,0.6)",
                    border: `1px solid ${border}`,
                    textDecoration: "none",
                  }}
                >
                  <span
                    className="font-bold text-sm group-hover:underline truncate"
                    style={{
                      color: dark ? "#e9d5ff" : "#3b0764",
                      fontFamily: "'Noto Sans KR', sans-serif"
                    }}
                  >
                    {sh.label || "(라벨 없음)"}
                  </span>
                  <ExternalLink size={14} className="shrink-0" style={{ color: "#a855f7" }} />
                </a>
              ))}
            </div>
          </div>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
}

// ─── Block renderers ──────────────────────────────────────────────────────────

function CharacterPresetBlockRenderer({ block, dark }: { block: CharacterPresetBlock; dark: boolean }) {
  const [imgType, setImgType] = useState<"default" | "costume">("default");
  const [activeSkill, setActiveSkill] = useState<"normal" | "low" | "high" | null>(null);

  // Fallbacks for safety and backwards compatibility
  const name = block.name || "미지정 사도";
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

  const normalSkill = block.normalSkill || { name: "", desc: "", imageUrl: "" };
  const lowSkill = block.lowSkill || { name: "", desc: "", imageUrl: "" };
  const highSkill = block.highSkill || { name: "", desc: "", imageUrl: "" };

  const currentSkill = activeSkill === "normal" ? normalSkill : activeSkill === "low" ? lowSkill : highSkill;

  // Icon mapping
  const rarityIcon = RARITY_ICONS[rarity] || star3;
  const personalityIcon = PERSONALITY_ICONS[personality] || activeIcon;
  const positionIcon = POSITION_ICONS[position] || frontRowIcon;
  const roleIcon = ROLE_ICONS[role] || dealerIcon;
  const raceIcon = RACE_ICONS[race] || fairyIcon;

  const cardBg = dark ? "rgba(30,20,50,0.6)" : "rgba(255,255,255,0.7)";
  const borderCard = dark ? "rgba(167,139,250,0.2)" : "rgba(168,85,247,0.15)";
  const textTitle = dark ? "#e9d5ff" : "#2d1b4e";
  const textSub = dark ? "#c4b5fd" : "#4c1d95";

  // Toggle costume vs default image
  const activeImage = imgType === "costume" && costumeImageUrl ? costumeImageUrl : imageUrl;

  return (
    <div
      className="rounded-3xl p-6 my-4 border flex flex-col gap-5 transition-all shadow-md relative"
      style={{ background: cardBg, borderColor: borderCard, backdropFilter: "blur(12px)" }}
    >
      {/* 1. Header & Basic Info */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left Side: Image with toggle */}
        <div className="relative shrink-0 w-full md:w-44 flex flex-col gap-2 items-center mx-auto md:mx-0">
          <div className="w-44 h-44 rounded-2xl overflow-hidden border border-purple-300/20 relative shadow-inner">
            {activeImage ? (
              <img
                src={activeImage}
                alt={name}
                className="w-full h-full object-cover transition-all duration-300"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs opacity-40 bg-purple-500/5">
                이미지 없음
              </div>
            )}

            {/* Costume switcher overlay */}
            {costumeImageUrl && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex bg-black/60 backdrop-blur-md rounded-xl p-0.5 shadow-md z-10">
                <button
                  onClick={() => setImgType("default")}
                  className={`text-[8px] font-extrabold px-2.5 py-1 rounded-lg transition-all ${imgType === "default" ? "bg-purple-600 text-white" : "text-gray-300 hover:text-white"
                    }`}
                >
                  기본
                </button>
                <button
                  onClick={() => setImgType("costume")}
                  className={`text-[8px] font-extrabold px-2.5 py-1 rounded-lg transition-all ${imgType === "costume" ? "bg-purple-600 text-white" : "text-gray-300 hover:text-white"
                    }`}
                >
                  꼬까옷
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Details & Badges */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 w-full">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full text-white bg-gradient-to-r from-purple-600 to-pink-500 shadow-sm">
                신규 사도 출시
              </span>
              {rarityIcon && (
                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-0.5 shadow-sm">
                  <img src={rarityIcon} alt={rarity} className="w-6 h-6 object-contain" />
                  <span className="text-[11px] font-black text-amber-500">{rarity}</span>
                </div>
              )}
            </div>

            <h3 className="text-2xl font-black mt-1" style={{ fontFamily: "'Jua', sans-serif", color: textTitle }}>
              {name}
            </h3>

            {desc && (
              <p className="text-xs leading-relaxed opacity-90 mt-0.5 font-medium" style={{ color: textSub, fontFamily: "'Noto Sans KR', sans-serif" }}>
                {desc}
              </p>
            )}
          </div>

          {/* Attributes badge list */}
          <div className="flex flex-wrap gap-2 mt-1">
            {/* 성격 */}
            <div className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/15 rounded-xl px-2.5 py-1 shadow-sm">
              <img src={personalityIcon} alt={personality} className="w-3.5 h-3.5 object-contain" />
              <span className="text-xs font-bold" style={{ color: dark ? "#d8b4fe" : "#6b21a8" }}>{personality}</span>
            </div>

            {/* 종족 */}
            <div className="flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/15 rounded-xl px-2.5 py-1 shadow-sm">
              <img src={raceIcon} alt={race} className="w-3.5 h-3.5 object-contain" />
              <span className="text-xs font-bold" style={{ color: dark ? "#c7d2fe" : "#3730a3" }}>{race}</span>
            </div>

            {/* 역할군 */}
            <div className="flex items-center gap-1 bg-pink-500/10 border border-pink-500/15 rounded-xl px-2.5 py-1 shadow-sm">
              <img src={roleIcon} alt={role} className="w-3.5 h-3.5 object-contain" />
              <span className="text-xs font-bold" style={{ color: dark ? "#fbcfe8" : "#9d174d" }}>{role}</span>
            </div>

            {/* 배치 열 */}
            <div className="flex items-center gap-1 bg-sky-500/10 border border-sky-500/15 rounded-xl px-2.5 py-1 shadow-sm">
              <img src={positionIcon} alt={position} className="w-3.5 h-3.5 object-contain" />
              <span className="text-xs font-bold" style={{ color: dark ? "#bae6fd" : "#075985" }}>{position}</span>
            </div>

            {/* 공격 타입 */}
            <div className="flex items-center gap-1 bg-teal-500/10 border border-teal-500/15 rounded-xl px-2.5 py-1 shadow-sm">
              <span className="text-sm leading-none">{attackType === "마법" ? "🔮" : "✊"}</span>
              <span className="text-xs font-bold" style={{ color: dark ? "#99f6e4" : "#115e59" }}>{attackType}</span>
            </div>
          </div>

          {/* Event Links (placed directly under basic info tags) */}
          {(themeTheaterUrl || pickupEventUrl) && (
            <div className="flex gap-2.5 w-full mt-2.5 flex-col sm:flex-row">
              {themeTheaterUrl && (
                <a
                  href={themeTheaterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-2xl text-xs font-black text-center transition-all hover:scale-[1.01]"
                  style={{
                    background: dark ? "rgba(167,139,250,0.12)" : "rgba(168,85,247,0.08)",
                    color: dark ? "#a78bfa" : "#7c3aed",
                    border: `1px solid ${dark ? "rgba(167,139,250,0.2)" : "rgba(168,85,247,0.15)"}`,
                    textDecoration: "none",
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}
                >
                  🎬 테마극장 바로가기
                </a>
              )}
              {pickupEventUrl && (
                <a
                  href={pickupEventUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-2xl text-xs font-black text-center transition-all hover:scale-[1.01]"
                  style={{
                    background: dark ? "rgba(236,72,153,0.12)" : "rgba(236,72,153,0.08)",
                    color: dark ? "#f472b6" : "#db2777",
                    border: `1px solid ${dark ? "rgba(236,72,153,0.2)" : "rgba(236,72,153,0.15)"}`,
                    textDecoration: "none",
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}
                >
                  🔍 픽업 모집 바로가기
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Horizontal Skill Toggle & Accordion */}
      <div className="mt-2 border-t border-purple-300/10 pt-4 flex flex-col gap-3">
        <p className="text-xs font-bold text-purple-400">⚔️ 사도 스킬 정보</p>

        <div className="flex gap-2 w-full flex-col sm:flex-row">
          {(["normal", "low", "high"] as const).map((tab) => {
            const skillItem = tab === "normal" ? normalSkill : tab === "low" ? lowSkill : highSkill;
            const skillName = skillItem.name || "(스킬 이름 미지정)";
            const typeLabel = tab === "normal" ? "일반 공격" : tab === "low" ? "저학년 스킬" : "고학년 스킬";
            const isActive = activeSkill === tab;
            const isNormal = tab === "normal";

            return (
              <button
                key={tab}
                onClick={() => setActiveSkill(isActive ? null : tab)}
                className="flex-1 px-3 py-2 rounded-2xl text-xs font-extrabold transition-all duration-300 flex items-center justify-between border shadow-sm group hover:scale-[1.01]"
                style={{
                  background: isActive ? "linear-gradient(90deg,#a855f7,#ec4899)" : dark ? "rgba(30,20,50,0.5)" : "rgba(255,255,255,0.6)",
                  borderColor: isActive ? "transparent" : borderCard,
                  color: isActive ? "#fff" : dark ? "#c4b5fd" : "#4c1d95",
                }}
              >
                <div className="flex flex-col items-start gap-0.5 min-w-0">
                  <span className={`${isNormal ? "text-xs font-black py-1" : "text-[9px] font-bold uppercase tracking-wider"} ${isActive ? "text-purple-100" : "opacity-60"}`}>
                    {typeLabel}
                  </span>
                  {!isNormal && (
                    <span className="truncate max-w-[130px] font-black">{skillName}</span>
                  )}
                </div>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-300 shrink-0 ml-1 ${isActive ? "rotate-180 text-white" : "text-purple-400 group-hover:translate-y-0.5"
                    }`}
                />
              </button>
            );
          })}
        </div>

        {/* Accordion Content Container */}
        <AnimatePresence initial={false}>
          {activeSkill && currentSkill && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div
                className="rounded-2xl p-4 border flex flex-col md:flex-row gap-4 items-start mt-2"
                style={{
                  background: dark ? "rgba(20,12,40,0.5)" : "rgba(250,245,255,0.7)",
                  borderColor: borderCard,
                }}
              >
                {currentSkill.imageUrl && (
                  <div className="shrink-0 w-32 h-32 rounded-xl overflow-hidden border border-purple-300/20 relative shadow-md mx-auto md:mx-0">
                    <img
                      src={currentSkill.imageUrl}
                      alt={currentSkill.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0 w-full text-left">
                  <h4 className="text-sm font-black mb-1.5 flex items-center gap-1.5 flex-wrap" style={{ color: textTitle }}>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg text-white bg-purple-600 leading-none">
                      {activeSkill === "normal" ? "일반 공격" : activeSkill === "low" ? "저학년 스킬" : "고학년 스킬"}
                    </span>
                    {activeSkill !== "normal" && (currentSkill.name || "(미지정 스킬)")}
                  </h4>
                  {currentSkill.desc ? (
                    <div className="leading-relaxed">
                      <InlineRichText content={currentSkill.desc} dark={dark} className="leading-relaxed text-xs whitespace-pre-wrap" />
                    </div>
                  ) : (
                    <p className="text-xs italic opacity-40">스킬 설명이 없습니다.</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function BlockRenderer({ block, dark, category }: { block: ContentBlock; dark: boolean; category?: string }) {
  const surface = dark ? "rgba(30,20,50,0.6)" : "rgba(255,255,255,0.7)";
  const border = dark ? "rgba(167,139,250,0.15)" : "rgba(168,85,247,0.12)";

  switch (block.type) {

    case "intro": {
      const meta = CATEGORY_META[(category as any) || "major"] || CATEGORY_META.major;
      return (
        <div
          className="rounded-3xl p-6 my-2 transition-all duration-500"
          style={{
            background: dark ? `${meta.color}15` : `${meta.color}08`,
            borderColor: `${meta.color}33`,
            borderWidth: "1px",
            borderStyle: "solid",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-center gap-1.5 mb-2 opacity-80">
            <span className="text-sm">{meta.emoji}</span>
            <span className="text-xs font-black uppercase tracking-wider" style={{ color: meta.color }}>
              {meta.label} 본문 안내
            </span>
          </div>
          <div className="leading-relaxed">
            <InlineRichText content={block.content || ""} dark={dark} className="leading-relaxed text-sm whitespace-pre-wrap" />
          </div>
        </div>
      );
    }

    case "text":
      return (
        <div className="py-1">
          <RichText content={block.content} dark={dark} />
        </div>
      );

    case "list": {
      const titleColor = dark ? "#e9d5ff" : "#3b0764";
      const itemColor = dark ? "#c4b5fd" : "#4c1d95";
      return (
        <div
          className="rounded-2xl p-5 my-1"
          style={{ background: surface, border: `1px solid ${border}`, backdropFilter: "blur(8px)" }}
        >
          {block.title && (
            <p className="font-bold text-sm mb-3" style={{ color: titleColor, fontFamily: "'Jua', sans-serif" }}>
              {block.title}
            </p>
          )}
          <ul className="flex flex-col gap-2">
            {block.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm"
                style={{ color: itemColor, fontFamily: "'Noto Sans KR', sans-serif" }}>
                {block.style === "badge" && (
                  <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                    style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}>
                    {i + 1}
                  </span>
                )}
                {block.style === "numbered" && (
                  <span className="shrink-0 font-black tabular-nums" style={{ color: "#a855f7" }}>
                    {String(i + 1).padStart(2, "0")}.
                  </span>
                )}
                {block.style === "bullet" && (
                  <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: "#a855f7" }} />
                )}
                <span className="leading-7">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    case "accordion":
      return (
        <Accordion.Root type="single" collapsible className="my-1">
          <Accordion.Item value="item">
            <Accordion.Trigger
              className="group flex w-full items-center justify-between rounded-2xl px-5 py-3.5 font-bold text-sm text-left transition-all"
              style={{
                background: surface,
                border: `1px solid ${border}`,
                color: dark ? "#e9d5ff" : "#3b0764",
                fontFamily: "'Jua', sans-serif",
              }}
            >
              {block.title}
              <ChevronDown
                size={16}
                className="transition-transform duration-300 group-data-[state=open]:rotate-180 shrink-0 ml-2"
                style={{ color: "#a855f7" }}
              />
            </Accordion.Trigger>
            <Accordion.Content className="overflow-hidden data-[state=open]:animate-none">
              <div
                className="px-5 py-4 rounded-b-2xl -mt-2 text-sm leading-7"
                style={{
                  background: dark ? "rgba(20,12,40,0.7)" : "rgba(250,245,255,0.9)",
                  border: `1px solid ${border}`,
                  borderTop: "none",
                  color: dark ? "#c4b5fd" : "#4c1d95",
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}
              >
                <RichText content={block.body} dark={dark} />
              </div>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>
      );

    case "link":
      return (
        <a
          href={block.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-4 rounded-2xl px-5 py-4 my-1 group transition-all hover:shadow-lg"
          style={{
            background: surface,
            border: `1px solid ${border}`,
            backdropFilter: "blur(8px)",
            textDecoration: "none",
          }}
        >
          <div>
            <p className="font-bold text-sm group-hover:underline"
              style={{ color: dark ? "#f0abfc" : "#7c3aed", fontFamily: "'Noto Sans KR', sans-serif" }}>
              {block.label}
            </p>
            {block.desc && (
              <p className="text-xs mt-0.5 leading-relaxed"
                style={{ color: dark ? "#7c5c9a" : "#a78bfa", fontFamily: "'Noto Sans KR', sans-serif" }}>
                {block.desc}
              </p>
            )}
          </div>
          <ExternalLink size={16} className="shrink-0" style={{ color: dark ? "#a78bfa" : "#a855f7" }} />
        </a>
      );

    case "divider":
      return <hr className="my-3 border-0 h-px" style={{ background: dark ? "rgba(167,139,250,0.15)" : "rgba(168,85,247,0.1)" }} />;

    case "character_preset": {
      return <CharacterPresetBlockRenderer block={block as CharacterPresetBlock} dark={dark} />;
    }

    case "clone_preset": {
      return <ClonePresetBlockRenderer block={block as ClonePresetBlock} dark={dark} />;
    }

    case "shortcut_preset": {
      return <ShortcutPresetBlockRenderer block={block as ShortcutPresetBlock} dark={dark} />;
    }

    case "pvp_preset": {
      return <PvpPresetBlockRenderer block={block as PvpPresetBlock} dark={dark} />;
    }

    case "skin_preset": {
      const cardBg = dark ? "rgba(30,20,50,0.6)" : "rgba(255,255,255,0.7)";
      const borderCard = dark ? "rgba(167,139,250,0.2)" : "rgba(168,85,247,0.15)";
      return (
        <div
          className="rounded-3xl p-6 my-2 border flex flex-col md:flex-row gap-5 items-stretch transition-all"
          style={{ background: cardBg, borderColor: borderCard, backdropFilter: "blur(12px)" }}
        >
          {block.imageUrl && (
            <div className="shrink-0 w-full md:w-36 h-36 rounded-2xl overflow-hidden border border-pink-300/20 relative">
              <img src={block.imageUrl} alt={block.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          )}
          <div className="flex-1 flex flex-col gap-2 justify-center">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full text-white bg-pink-600">
                신규 스킨
              </span>
              {block.character && (
                <span className="text-xs font-bold text-pink-400">
                  대상 사도: {block.character}
                </span>
              )}
            </div>
            <h3 className="text-lg font-black" style={{ fontFamily: "'Jua', sans-serif", color: dark ? "#e9d5ff" : "#2d1b4e" }}>
              {block.name || "미지정 스킨"}
            </h3>
            {block.desc && (
              <p className="text-xs leading-relaxed" style={{ color: dark ? "#c4b5fd" : "#4c1d95", fontFamily: "'Noto Sans KR', sans-serif" }}>
                {block.desc}
              </p>
            )}
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}

// ─── Post row in the list ─────────────────────────────────────────────────────

function PostRow({ post, dark, onClick }: { post: UpdatePost; dark: boolean; onClick: () => void }) {
  const meta = CATEGORY_META[post.category];
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ x: 4 }}
      className="flex items-start gap-4 py-4 px-5 cursor-pointer rounded-2xl transition-colors group"
      style={{
        borderBottom: dark ? "1px solid rgba(167,139,250,0.1)" : "1px solid rgba(168,85,247,0.08)",
      }}
    >
      {/* Category icon badge */}
      <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shadow-sm"
        style={{
          background: post.category === "postcard"
            ? "linear-gradient(135deg,#db2777,#ec4899)"
            : "linear-gradient(135deg,#10b981,#059669)",
        }}>
        {meta.emoji}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span
            className="text-[10px] font-black px-2 py-0.5 rounded-full"
            style={{ background: `${meta.color}22`, color: meta.color }}
          >
            {meta.emoji} {meta.label}
          </span>
          {!post.published && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">미발행</span>
          )}
        </div>
        <p className="font-bold text-sm group-hover:text-purple-500 transition-colors truncate"
          style={{ color: dark ? "#e9d5ff" : "#2d1b4e", fontFamily: "'Noto Sans KR', sans-serif" }}>
          {post.title}
        </p>
        <p className="text-xs mt-0.5 truncate"
          style={{ color: dark ? "#7c5c9a" : "#a78bfa", fontFamily: "'Noto Sans KR', sans-serif" }}>
          {post.date} · 블록 {post.blocks.length}개
        </p>
      </div>

      <ChevronLeft size={16} className="rotate-180 shrink-0 mt-2 opacity-40 group-hover:opacity-100 transition-opacity"
        style={{ color: dark ? "#a78bfa" : "#7c3aed" }} />
    </motion.div>
  );
}

// ─── Post detail view ─────────────────────────────────────────────────────────

function PostDetail({ post, dark, onBack }: { post: UpdatePost; dark: boolean; onBack: () => void }) {
  const meta = CATEGORY_META[post.category];

  return (
    <Tooltip.Provider>
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 30 }}
        transition={{ duration: 0.3 }}
      >
        <button onClick={onBack}
          className="flex items-center gap-1 text-sm mb-6 font-bold transition-opacity hover:opacity-70"
          style={{ color: dark ? "#a78bfa" : "#7c3aed", fontFamily: "'Noto Sans KR', sans-serif" }}>
          <ChevronLeft size={16} /> 목록으로
        </button>

        {/* Header card */}
        <div
          className="rounded-3xl p-7 mb-4 transition-colors duration-500"
          style={{
            background: `linear-gradient(135deg, ${meta.color}33 0%, ${meta.color}11 100%)`,
            border: `1px solid ${meta.color}44`,
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-black px-3 py-1 rounded-full text-white"
              style={{ background: meta.color }}>
              {meta.emoji} {meta.label}
            </span>
          </div>
          <h1 className="text-2xl font-black mb-2"
            style={{ fontFamily: "'Jua', sans-serif", color: dark ? "#e9d5ff" : "#2d1b4e" }}>
            {post.title}
          </h1>
          {post.summary && (
            <p className="text-sm leading-relaxed mb-3"
              style={{ color: dark ? "#c4b5fd" : "#5b21b6", fontFamily: "'Noto Sans KR', sans-serif" }}>
              {post.summary}
            </p>
          )}
          <p className="text-xs" style={{ color: dark ? "#6d5b8a" : "#c4b5fd", fontFamily: "'Noto Sans KR', sans-serif" }}>
            📅 {post.date}
          </p>
        </div>

        {/* Blocks */}
        <div className="flex flex-col gap-2">
          {post.blocks.map((block, i) => (
            <BlockRenderer key={i} block={block} dark={dark} category={post.category} />
          ))}
        </div>
      </motion.div>
    </Tooltip.Provider>
  );
}

// ─── Main Updates page ────────────────────────────────────────────────────────

export function Updates() {
  const { dark } = useOutletContext<{ dark: boolean }>();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<UpdatePost[]>([]);
  const [selected, setSelected] = useState<UpdatePost | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadUpdates()
      .then((data) => {
        setPosts((data || []).filter((p) => p.published).sort((a, b) => b.date.localeCompare(a.date)));
      })
      .catch(console.error);
  }, []);

  const categories = ["all", "trickcal", "postcard"] as const;
  const filtered = filter === "all" ? posts : posts.filter((p) => p.category === filter);

  const labelColor = dark ? "#a78bfa" : "#a855f7";
  const titleColor = dark ? "#e9d5ff" : "#2d1b4e";

  return (
    <div className="flex flex-col items-center py-10 px-4 min-h-screen">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="mb-8">
          <p className="text-xs font-bold tracking-widest uppercase mb-1"
            style={{ color: labelColor, fontFamily: "'Noto Sans KR', sans-serif" }}>
            TRICKCAL UPDATE SUMMARY
          </p>
          <h1 className="text-4xl font-black" style={{ fontFamily: "'Jua', sans-serif", color: titleColor }}>
            업데이트 요약
          </h1>
          <p className="text-sm mt-1" style={{ color: dark ? "#7c5c9a" : "#a78bfa", fontFamily: "'Noto Sans KR', sans-serif" }}>
            트릭컬 공식 공지를 쉽게 읽을 수 있도록 매주 요약합니다.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {selected ? (
            <PostDetail key="detail" post={selected} dark={dark} onBack={() => setSelected(null)} />
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {/* Category filter */}
              <div className="flex flex-wrap gap-2 mb-5">
                {categories.map((cat) => {
                  const active = filter === cat;
                  const meta = cat !== "all" ? CATEGORY_META[cat] : null;
                  return (
                    <motion.button
                      key={cat}
                      onClick={() => setFilter(cat)}
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                      style={{
                        background: active
                          ? (meta ? meta.color : "linear-gradient(90deg,#a855f7,#ec4899)")
                          : dark ? "rgba(167,139,250,0.1)" : "rgba(168,85,247,0.08)",
                        color: active ? "#fff" : dark ? "#a78bfa" : "#7c3aed",
                        border: active ? "none" : dark ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(168,85,247,0.2)",
                      }}
                    >
                      {cat === "all" ? "전체" : `${meta!.emoji} ${meta!.label}`}
                    </motion.button>
                  );
                })}
              </div>

              {/* Post list */}
              <div
                className="rounded-3xl overflow-hidden transition-colors duration-500"
                style={{
                  background: dark ? "rgba(30,20,50,0.8)" : "rgba(255,255,255,0.85)",
                  border: dark ? "1px solid rgba(167,139,250,0.15)" : "1px solid rgba(168,85,247,0.1)",
                  backdropFilter: "blur(12px)",
                }}
              >
                {filtered.length === 0 ? (
                  <div className="py-16 text-center text-sm"
                    style={{ color: dark ? "#6d5b8a" : "#c4b5fd", fontFamily: "'Noto Sans KR', sans-serif" }}>
                    해당 카테고리의 업데이트가 없습니다.
                  </div>
                ) : (
                  filtered.map((post) => (
                    <PostRow key={post.id} post={post} dark={dark} onClick={() => setSelected(post)} />
                  ))
                )}
              </div>

              {/* Admin shortcut */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => navigate("/admin")}
                  className="text-xs underline underline-offset-4 opacity-40 hover:opacity-70 transition-opacity"
                  style={{ color: dark ? "#a78bfa" : "#7c3aed", fontFamily: "'Noto Sans KR', sans-serif" }}
                >
                  관리자 패널
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
