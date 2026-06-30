import { useState } from "react";
import { CHARACTER_IMAGES, CharacterPersonality, CharacterRace, BirthRarity, CharacterRole, CharacterPosition } from "../characterImages";

// Icon Imports
import star1 from "@/imports/CharacterIcon/등급/1성.PNG";
import star2 from "@/imports/CharacterIcon/등급/2성.PNG";
import star3 from "@/imports/CharacterIcon/등급/3성.PNG";

import resonanceIcon from "@/imports/CharacterIcon/성격/공명.PNG";
import madnessIcon from "@/imports/CharacterIcon/성격/광기.PNG";
import calmIcon from "@/imports/CharacterIcon/성격/냉정.PNG";
import pureIcon from "@/imports/CharacterIcon/성격/순수.PNG";
import gloomIcon from "@/imports/CharacterIcon/성격/우울.PNG";
import activeIcon from "@/imports/CharacterIcon/성격/활발.PNG";

import witchIcon from "@/imports/CharacterIcon/종족/마녀.PNG";
import mysticIcon from "@/imports/CharacterIcon/종족/미스틱.PNG";
import beastIcon from "@/imports/CharacterIcon/종족/수인.PNG";
import elfIcon from "@/imports/CharacterIcon/종족/엘프.PNG";
import fairyIcon from "@/imports/CharacterIcon/종족/요정.PNG";
import dragonIcon from "@/imports/CharacterIcon/종족/용족.PNG";
import ghostIcon from "@/imports/CharacterIcon/종족/유령.PNG";
import spiritIcon from "@/imports/CharacterIcon/종족/정령.PNG";

import dealerIcon from "@/imports/CharacterIcon/역할군/딜러.PNG";
import supporterIcon from "@/imports/CharacterIcon/역할군/서포터.PNG";
import tankerIcon from "@/imports/CharacterIcon/역할군/탱커.PNG";

import allRowsIcon from "@/imports/CharacterIcon/배치 열/모든열.PNG";
import frontRowIcon from "@/imports/CharacterIcon/배치 열/전열.PNG";
import midRowIcon from "@/imports/CharacterIcon/배치 열/중열.PNG";
import backRowIcon from "@/imports/CharacterIcon/배치 열/후열.PNG";

// Icon Maps
const PERSONALITY_ICONS: Record<number, string> = {
  [CharacterPersonality.순수]: pureIcon,
  [CharacterPersonality.냉정]: calmIcon,
  [CharacterPersonality.광기]: madnessIcon,
  [CharacterPersonality.활발]: activeIcon,
  [CharacterPersonality.우울]: gloomIcon,
  [CharacterPersonality.공명]: resonanceIcon,
};

const RACE_ICONS: Record<number, string> = {
  [CharacterRace.마녀]: witchIcon,
  [CharacterRace.미스틱]: mysticIcon,
  [CharacterRace.수인]: beastIcon,
  [CharacterRace.엘프]: elfIcon,
  [CharacterRace.요정]: fairyIcon,
  [CharacterRace.용족]: dragonIcon,
  [CharacterRace.유령]: ghostIcon,
  [CharacterRace.정령]: spiritIcon,
};

const RARITY_ICONS: Record<number, string> = {
  [BirthRarity.ThreeStarEldain]: star3,
  [BirthRarity.ThreeStar]: star3,
  [BirthRarity.TwoStar]: star2,
  [BirthRarity.OneStar]: star1,
};

const ROLE_ICONS: Record<number, string> = {
  [CharacterRole.딜러]: dealerIcon,
  [CharacterRole.서포터]: supporterIcon,
  [CharacterRole.탱커]: tankerIcon,
};

const POSITION_ICONS: Record<number, string> = {
  [CharacterPosition.전열]: frontRowIcon,
  [CharacterPosition.중열]: midRowIcon,
  [CharacterPosition.후열]: backRowIcon,
  [CharacterPosition.모든열]: allRowsIcon,
};

const PERSONALITY_NAMES: Record<number, string> = {
  [CharacterPersonality.순수]: "순수",
  [CharacterPersonality.냉정]: "냉정",
  [CharacterPersonality.광기]: "광기",
  [CharacterPersonality.활발]: "활발",
  [CharacterPersonality.우울]: "우울",
  [CharacterPersonality.공명]: "공명",
};

const RACE_NAMES: Record<number, string> = {
  [CharacterRace.마녀]: "마녀",
  [CharacterRace.미스틱]: "미스틱",
  [CharacterRace.수인]: "수인",
  [CharacterRace.엘프]: "엘프",
  [CharacterRace.요정]: "요정",
  [CharacterRace.용족]: "용족",
  [CharacterRace.유령]: "유령",
  [CharacterRace.정령]: "정령",
};

const ROLE_NAMES: Record<number, string> = {
  [CharacterRole.딜러]: "딜러",
  [CharacterRole.서포터]: "서포터",
  [CharacterRole.탱커]: "탱커",
};

const POSITION_NAMES: Record<number, string> = {
  [CharacterPosition.전열]: "전열",
  [CharacterPosition.중열]: "중열",
  [CharacterPosition.후열]: "후열",
  [CharacterPosition.모든열]: "모든열",
};

// Styling profiles by personality
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

// Sort priorities mapping
const PERSONALITY_SORT_ORDER = [
  CharacterPersonality.순수,
  CharacterPersonality.냉정,
  CharacterPersonality.광기,
  CharacterPersonality.활발,
  CharacterPersonality.우울,
  CharacterPersonality.공명,
];

const RACE_SORT_ORDER = [
  CharacterRace.요정,
  CharacterRace.수인,
  CharacterRace.엘프,
  CharacterRace.정령,
  CharacterRace.유령,
  CharacterRace.용족,
  CharacterRace.마녀,
  CharacterRace.미스틱,
];

const RARITY_SORT_ORDER = [
  BirthRarity.ThreeStarEldain,
  BirthRarity.ThreeStar,
  BirthRarity.TwoStar,
  BirthRarity.OneStar,
];

const ROLE_SORT_ORDER = [
  CharacterRole.탱커,
  CharacterRole.딜러,
  CharacterRole.서포터,
];

const POSITION_SORT_ORDER = [
  CharacterPosition.전열,
  CharacterPosition.중열,
  CharacterPosition.후열,
  CharacterPosition.모든열,
];

// Option sets with icons
const PERSONALITY_OPTIONS = [
  { value: CharacterPersonality.순수, label: "순수", icon: pureIcon },
  { value: CharacterPersonality.냉정, label: "냉정", icon: calmIcon },
  { value: CharacterPersonality.광기, label: "광기", icon: madnessIcon },
  { value: CharacterPersonality.활발, label: "활발", icon: activeIcon },
  { value: CharacterPersonality.우울, label: "우울", icon: gloomIcon },
  { value: CharacterPersonality.공명, label: "공명", icon: resonanceIcon },
];

const RACE_OPTIONS = [
  { value: CharacterRace.요정, label: "요정", icon: fairyIcon },
  { value: CharacterRace.수인, label: "수인", icon: beastIcon },
  { value: CharacterRace.엘프, label: "엘프", icon: elfIcon },
  { value: CharacterRace.정령, label: "정령", icon: spiritIcon },
  { value: CharacterRace.유령, label: "유령", icon: ghostIcon },
  { value: CharacterRace.용족, label: "용족", icon: dragonIcon },
  { value: CharacterRace.마녀, label: "마녀", icon: witchIcon },
  { value: CharacterRace.미스틱, label: "미스틱", icon: mysticIcon },
];

const ROLE_OPTIONS = [
  { value: CharacterRole.탱커, label: "탱커", icon: tankerIcon },
  { value: CharacterRole.딜러, label: "딜러", icon: dealerIcon },
  { value: CharacterRole.서포터, label: "서포터", icon: supporterIcon },
];

const POSITION_OPTIONS = [
  { value: CharacterPosition.전열, label: "전열", icon: frontRowIcon },
  { value: CharacterPosition.중열, label: "중열", icon: midRowIcon },
  { value: CharacterPosition.후열, label: "후열", icon: backRowIcon },
  { value: CharacterPosition.모든열, label: "모든열", icon: allRowsIcon },
];

const RARITY_OPTIONS = [
  { value: BirthRarity.ThreeStarEldain, label: "3성 엘다인", icon: star3 },
  { value: BirthRarity.ThreeStar, label: "3성", icon: star3 },
  { value: BirthRarity.TwoStar, label: "2성", icon: star2 },
  { value: BirthRarity.OneStar, label: "1성", icon: star1 },
];

// Interactive Filter Dropdown Component
interface FilterDropdownProps<T extends number> {
  label: string;
  options: { value: T; label: string; icon?: string }[];
  selected: T[];
  onChange: (selected: T[]) => void;
  placeholder: string;
}

function FilterDropdown<T extends number>({
  label,
  options,
  selected,
  onChange,
  placeholder,
}: FilterDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (val: T) => {
    if (selected.includes(val)) {
      onChange(selected.filter((x) => x !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  return (
    <div className="relative flex flex-col gap-1.5 w-full">
      <label className="text-[11px] font-bold text-purple-300/80">{label}</label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-purple-950/40 border border-purple-500/30 rounded-xl px-3 py-2 text-white text-xs hover:bg-purple-900/30 transition-all text-left min-h-[38px]"
      >
        <div className="flex gap-1.2 flex-wrap items-center overflow-hidden">
          {selected.length === 0 ? (
            <span className="text-purple-300/60">{placeholder}</span>
          ) : (
            selected.map((val) => {
              const opt = options.find((o) => o.value === val);
              return opt?.icon ? (
                <img
                  key={val}
                  src={opt.icon}
                  alt={opt.label}
                  className="w-5.5 h-5.5 object-contain rounded-full bg-black/40 border border-purple-500/30"
                  title={opt.label}
                />
              ) : (
                <span key={val} className="px-1.5 py-0.5 rounded bg-purple-500/20 text-[10px] font-black border border-purple-500/30">
                  {opt?.label || val}
                </span>
              );
            })
          )}
        </div>
        <span className="text-purple-400 text-[10px] ml-1">{isOpen ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown Options Box */}
      {isOpen && (
        <>
          {/* Overlay to close on outside click */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-[62px] left-0 w-full bg-slate-950/95 border border-purple-500/30 rounded-xl p-2 z-50 shadow-2xl flex flex-col gap-1 max-h-60 overflow-y-auto backdrop-blur-md">
            {options.map((opt) => {
              const isChecked = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleOption(opt.value)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold transition-all text-left ${isChecked
                    ? "bg-purple-600/30 text-white"
                    : "text-purple-300 hover:bg-purple-900/30"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    {opt.icon && (
                      <img
                        src={opt.icon}
                        alt={opt.label}
                        className="w-4 h-4 object-contain rounded-full bg-black/20"
                      />
                    )}
                    <span>{opt.label}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    readOnly
                    className="accent-purple-500 cursor-pointer pointer-events-none w-3.5 h-3.5"
                  />
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function ApostlesTest() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"personality" | "race" | "rarity" | "role" | "position" | "name">("personality");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterPersonality, setFilterPersonality] = useState<number[]>([]);
  const [filterRace, setFilterRace] = useState<number[]>([]);
  const [filterRole, setFilterRole] = useState<number[]>([]);
  const [filterPosition, setFilterPosition] = useState<number[]>([]);
  const [filterRarity, setFilterRarity] = useState<number[]>([]);

  // Sort and filter apostles
  const sortedApostles = Object.entries(CHARACTER_IMAGES)
    .filter(([name, entry]) => {
      // 1. Text search
      if (!name.toLowerCase().includes(search.toLowerCase())) return false;

      // 2. Personality filter
      if (filterPersonality.length > 0 && !filterPersonality.includes(entry.personality)) return false;

      // 3. Race filter
      if (filterRace.length > 0 && !filterRace.includes(entry.race)) return false;

      // 4. Role filter
      if (filterRole.length > 0 && !filterRole.includes(entry.role)) return false;

      // 5. Position filter
      if (filterPosition.length > 0 && !filterPosition.includes(entry.position)) return false;

      // 6. Rarity filter
      if (filterRarity.length > 0 && !filterRarity.includes(entry.rarity)) return false;

      return true;
    })
    .sort((a, b) => {
      const [nameA, entryA] = a;
      const [nameB, entryB] = b;

      const compareValues = (key: string, eA: any, eB: any, nA: string, nB: string) => {
        if (key === "personality") {
          const pA = PERSONALITY_SORT_ORDER.indexOf(eA.personality);
          const pB = PERSONALITY_SORT_ORDER.indexOf(eB.personality);
          return pA - pB;
        }
        if (key === "race") {
          const rA = RACE_SORT_ORDER.indexOf(eA.race);
          const rB = RACE_SORT_ORDER.indexOf(eB.race);
          return rA - rB;
        }
        if (key === "rarity") {
          const rarityA = RARITY_SORT_ORDER.indexOf(eA.rarity);
          const rarityB = RARITY_SORT_ORDER.indexOf(eB.rarity);
          return rarityA - rarityB;
        }
        if (key === "role") {
          const roleA = ROLE_SORT_ORDER.indexOf(eA.role);
          const roleB = ROLE_SORT_ORDER.indexOf(eB.role);
          return roleA - roleB;
        }
        if (key === "position") {
          const posA = POSITION_SORT_ORDER.indexOf(eA.position);
          const posB = POSITION_SORT_ORDER.indexOf(eB.position);
          return posA - posB;
        }
        if (key === "name") {
          return nA.localeCompare(nB, "ko");
        }
        return 0;
      };

      // Define evaluation sequence starting with user-selected primary sort key
      const sequence = [sortKey];
      const defaultSequence = ["personality", "race", "rarity", "role", "position", "name"];
      defaultSequence.forEach((k) => {
        if (!sequence.includes(k)) sequence.push(k);
      });

      for (const key of sequence) {
        const diff = compareValues(key, entryA, entryB, nameA, nameB);
        if (diff !== 0) {
          return sortOrder === "asc" ? diff : -diff;
        }
      }
      return 0;
    });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl mt-16">
      <div className="flex flex-col gap-6">
        {/* Title and Intro */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-purple-500/20 pb-4">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500" style={{ fontFamily: "'Jua', sans-serif" }}>
              사도 정보 불러오기 & 정렬 테스트
            </h1>
            <p className="text-sm text-purple-300/80 mt-1" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
              필터링 기능을 사용해 특정 사도들을 선별하고 원하는 기준으로 우선 정렬해보세요.
            </p>
          </div>

          <div className="w-full md:w-64">
            <input
              type="text"
              placeholder="사도 이름 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-purple-950/30 border border-purple-500/30 text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-500 text-sm transition-all"
            />
          </div>
        </div>

        {/* Dynamic Sort Toolbar */}
        <div className="flex flex-col gap-4 bg-purple-950/15 border border-purple-500/10 rounded-2xl p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-xs font-black text-purple-300">정렬 기준:</span>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { key: "personality", label: "성격 순" },
                    { key: "race", label: "종족 순" },
                    { key: "rarity", label: "등급 순" },
                    { key: "role", label: "역할 순" },
                    { key: "position", label: "배치열 순" },
                    { key: "name", label: "가나다 순" },
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSortKey(key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${sortKey === key
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                      : "bg-purple-950/30 border border-purple-500/20 text-purple-300 hover:bg-purple-900/30"
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-3 py-1.5 rounded-xl text-xs font-black bg-purple-950/40 border border-purple-500/30 text-white hover:bg-purple-900/40 transition-all flex items-center gap-1.5"
              >
                <span>{sortOrder === "asc" ? "정방향 ▲" : "역방향 ▼"}</span>
              </button>

              <button
                onClick={() => {
                  setSearch("");
                  setSortKey("personality");
                  setSortOrder("asc");
                  setFilterPersonality([]);
                  setFilterRace([]);
                  setFilterRole([]);
                  setFilterPosition([]);
                  setFilterRarity([]);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-pink-950/40 border border-pink-500/20 text-pink-300 hover:bg-pink-900/30 transition-all"
              >
                필터 초기화
              </button>
            </div>
          </div>

          <div className="h-px bg-purple-500/10 w-full" />

          {/* Filter Menu Options */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {/* Personality filter */}
            <FilterDropdown
              label="성격"
              options={PERSONALITY_OPTIONS}
              selected={filterPersonality}
              onChange={setFilterPersonality}
              placeholder="전체 성격"
            />

            {/* Race filter */}
            <FilterDropdown
              label="종족"
              options={RACE_OPTIONS}
              selected={filterRace}
              onChange={setFilterRace}
              placeholder="전체 종족"
            />

            {/* Role filter */}
            <FilterDropdown
              label="역할"
              options={ROLE_OPTIONS}
              selected={filterRole}
              onChange={setFilterRole}
              placeholder="전체 역할군"
            />

            {/* Position filter */}
            <FilterDropdown
              label="배치열"
              options={POSITION_OPTIONS}
              selected={filterPosition}
              onChange={setFilterPosition}
              placeholder="전체 배치열"
            />

            {/* Rarity filter */}
            <FilterDropdown
              label="태생 등급"
              options={RARITY_OPTIONS}
              selected={filterRarity}
              onChange={setFilterRarity}
              placeholder="전체 등급"
            />
          </div>
        </div>

        {/* Grid of Apostles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-x-0 gap-y-3 justify-items-center">
          {sortedApostles.map(([name, entry]) => {
            const style = PERSONALITY_STYLES[entry.personality];
            const pIcon = PERSONALITY_ICONS[entry.personality];
            const rIcon = RACE_ICONS[entry.race];
            const roleIcon = ROLE_ICONS[entry.role];
            const posIcon = POSITION_ICONS[entry.position];
            const rarityStar = RARITY_ICONS[entry.rarity];

            return (
              <div
                key={name}
                className="w-[140px] h-[162px] rounded-2xl p-2 flex flex-col items-center justify-between border relative group overflow-hidden transition-all duration-300 hover:scale-110"
                style={{
                  background: style.cardBg,
                  borderColor: style.border,
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
                }}
              >
                {/* Visual glow indicator based on personality */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
                  style={{ background: style.bg }}
                />

                {/* Character Portrait Box */}
                <div
                  className="w-[122px] h-[122px] rounded-xl overflow-hidden border border-black/10 relative shadow-inner mt-0.5"
                  style={{ background: style.bg }}
                >
                  {entry.default ? (
                    <img
                      src={entry.default}
                      alt={name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">
                      이미지 없음
                    </div>
                  )}

                  {/* Top-Left Personality Badge */}
                  {pIcon && (
                    <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full flex items-center justify-center bg-black/60 border border-white/20 shadow-md backdrop-blur-sm z-10">
                      <img
                        src={pIcon}
                        alt={PERSONALITY_NAMES[entry.personality]}
                        className="w-4.5 h-4.5 object-contain"
                      />
                    </div>
                  )}

                  {/* Top-Right Race Badge */}
                  {rIcon && (
                    <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center bg-black/60 border border-white/20 shadow-md backdrop-blur-sm z-10">
                      <img
                        src={rIcon}
                        alt={RACE_NAMES[entry.race]}
                        className="w-4.5 h-4.5 object-contain"
                      />
                    </div>
                  )}

                  {/* Bottom-Left Role Badge */}
                  {roleIcon && (
                    <div className="absolute bottom-1.5 left-1.5 w-6 h-6 rounded-full flex items-center justify-center bg-black/60 border border-white/20 shadow-md backdrop-blur-sm z-10">
                      <img
                        src={roleIcon}
                        alt={ROLE_NAMES[entry.role]}
                        className="w-4.5 h-4.5 object-contain"
                      />
                    </div>
                  )}

                  {/* Bottom-Right Position Badge */}
                  {posIcon && (
                    <div className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center bg-black/60 border border-white/20 shadow-md backdrop-blur-sm z-10">
                      <img
                        src={posIcon}
                        alt={POSITION_NAMES[entry.position]}
                        className="w-4.5 h-4.5 object-contain"
                      />
                    </div>
                  )}

                  {/* Star Rating Overlay inside portrait box at the bottom */}
                  <div className="absolute bottom-1 left-0 right-0 h-4 flex items-center justify-center z-20">
                    {rarityStar ? (
                      <img src={rarityStar} alt="등급" className="h-full object-contain" />
                    ) : (
                      <div className="text-[9px] text-white font-bold bg-black/40 px-1 rounded">등급 없음</div>
                    )}
                  </div>
                </div>

                {/* Apostle Name (Inside the Card Box at the bottom) */}
                <div className="w-full text-center mb-1">
                  <span
                    className="text-sm font-black truncate block px-1 tracking-wide"
                    style={{
                      fontFamily: "'Jua', sans-serif",
                      color: "#fff",
                      textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                    }}
                  >
                    {name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {sortedApostles.length === 0 && (
          <div className="text-center py-12 text-purple-300/40 text-sm">
            검색 결과에 맞는 사도가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}


