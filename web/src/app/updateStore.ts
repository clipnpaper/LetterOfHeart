import { fetchApi } from "./api";

export type UpdateCategory = "trickcal" | "postcard" | "major" | "event" | "balance" | "hotfix";

export interface TooltipEntry {
  keyword: string;
  tip: string;
}

export type BlockType = "text" | "intro" | "accordion" | "link" | "list" | "divider" | "character_preset" | "skin_preset" | "clone_preset" | "shortcut_preset" | "pvp_preset";

export interface BaseBlock {
  type: BlockType;
}

export interface TextBlock extends BaseBlock {
  type: "text";
  content: string;
}

export interface IntroBlock extends BaseBlock {
  type: "intro";
  content: string;
}

export interface AccordionBlock extends BaseBlock {
  type: "accordion";
  title: string;
  body: string;
}

export interface LinkBlock extends BaseBlock {
  type: "link";
  label: string;
  url: string;
  desc?: string;
}

export interface ListBlock extends BaseBlock {
  type: "list";
  title?: string;
  style: "bullet" | "numbered" | "badge";
  items: string[];
}

export interface DividerBlock extends BaseBlock {
  type: "divider";
}

export interface SkillInfo {
  name: string;
  desc: string;
  imageUrl?: string;
}

export interface CharacterPresetBlock extends BaseBlock {
  type: "character_preset";
  name: string;
  rarity: string;
  personality: string;
  race: string;
  role: string;
  attackType: string;
  position: string;
  desc: string;
  imageUrl?: string;
  normalSkill?: SkillInfo;
  lowSkill?: SkillInfo;
  highSkill?: SkillInfo;
  costumeImageUrl?: string;
  themeTheaterUrl?: string;
  pickupEventUrl?: string;
  skills?: string; // legacy fallback
}

export interface CloneRotation {
  stages: string;
  before: string[];
  after: string[];
}

export interface ClonePresetBlock extends BaseBlock {
  type: "clone_preset";
  title: string;
  rotations: CloneRotation[];
}

export interface SkinPresetBlock extends BaseBlock {
  type: "skin_preset";
  name: string;
  character: string;
  desc: string;
  imageUrl?: string;
}

export interface ShortcutPresetBlock extends BaseBlock {
  type: "shortcut_preset";
  title?: string;
  shortcuts: {
    label: string;
    url: string;
  }[];
}

export interface PvpGroupRule {
  period: string;
  groupName: string;
  minDays: number;
  maxDays: number;
}

export interface PvpPresetBlock extends BaseBlock {
  type: "pvp_preset";
  title?: string;
  standardDate: string;
  seasonPeriod: string;
  settlementTime: string;
  vocationApostles: string;
  groupRules: PvpGroupRule[];
  botInfo: string;
  eldainLimitDesc: string;
  highSkillDesc: string;
}

export type ContentBlock =
  | TextBlock
  | IntroBlock
  | AccordionBlock
  | LinkBlock
  | ListBlock
  | DividerBlock
  | CharacterPresetBlock
  | SkinPresetBlock
  | ClonePresetBlock
  | ShortcutPresetBlock
  | PvpPresetBlock;

export interface UpdatePost {
  id: string;
  week: number;
  date: string;
  category: UpdateCategory;
  title: string;
  summary: string;
  published: boolean;
  blocks: ContentBlock[];
}

export const CATEGORY_META = {
  trickcal: { label: "트릭컬 업데이트", emoji: "🍀", color: "#10b981" },
  postcard: { label: "마음의 편지함", emoji: "📮", color: "#db2777" },
  // legacy fallbacks
  major: { label: "트릭컬 업데이트", emoji: "🍀", color: "#10b981" },
  event: { label: "트릭컬 업데이트", emoji: "🍀", color: "#10b981" },
  balance: { label: "트릭컬 업데이트", emoji: "🍀", color: "#10b981" },
  hotfix: { label: "트릭컬 업데이트", emoji: "🍀", color: "#10b981" },
};

export function newPost(): UpdatePost {
  return {
    id: Math.random().toString(36).substring(2, 9),
    week: 1,
    date: new Date().toISOString().substring(0, 10),
    category: "trickcal",
    title: "",
    summary: "",
    published: false,
    blocks: [{ type: "text", content: "" }],
  };
}

export function newBlock(type: BlockType): ContentBlock {
  switch (type) {
    case "text":
      return { type: "text", content: "" };
    case "intro":
      return { type: "intro", content: "" };
    case "accordion":
      return { type: "accordion", title: "", body: "" };
    case "link":
      return { type: "link", label: "", url: "", desc: "" };
    case "list":
      return { type: "list", title: "", style: "bullet", items: [] };
    case "divider":
      return { type: "divider" };
    case "character_preset":
      return {
        type: "character_preset",
        name: "",
        rarity: "3성(일반)",
        personality: "활발",
        race: "요정",
        role: "딜러",
        attackType: "물리",
        position: "전열",
        desc: "",
        imageUrl: "",
        normalSkill: { name: "", desc: "", imageUrl: "" },
        lowSkill: { name: "", desc: "", imageUrl: "" },
        highSkill: { name: "", desc: "", imageUrl: "" },
        costumeImageUrl: "",
        themeTheaterUrl: "",
        pickupEventUrl: "",
        skills: "",
      };
    case "skin_preset":
      return {
        type: "skin_preset",
        name: "",
        character: "",
        desc: "",
        imageUrl: "",
      };
    case "clone_preset":
      return {
        type: "clone_preset",
        title: "클론 팩토리 보상 로테이션",
        rotations: [
          { stages: "1, 7, 13", before: ["", "", "", "", ""], after: ["", "", "", "", ""] },
          { stages: "2, 8, 14", before: ["", "", "", "", ""], after: ["", "", "", "", ""] },
          { stages: "3, 9, 15", before: ["", "", "", "", ""], after: ["", "", "", "", ""] },
          { stages: "4, 10, 16", before: ["", "", "", "", ""], after: ["", "", "", "", ""] },
          { stages: "5, 11, 17", before: ["", "", "", "", ""], after: ["", "", "", "", ""] },
          { stages: "6, 12, 18", before: ["", "", "", "", ""], after: ["", "", "", "", ""] },
        ],
      };
    case "shortcut_preset":
      return {
        type: "shortcut_preset",
        title: "바로가기",
        shortcuts: [
          { label: "", url: "" }
        ]
      };
    case "pvp_preset":
      return {
        type: "pvp_preset",
        title: "PvP 승자의 줘팸터 신규 정규 시즌",
        standardDate: "2026-06-18",
        seasonPeriod: "06/18(목) 정기점검 이후 ~ 07/16(목) 10:59",
        settlementTime: "07/16(목) 11:00 ~ 점검 종료 전까지 (PvP 입장 불가)",
        vocationApostles: "모든 사도들이 휴가를 반납했습니다.",
        groupRules: [
          { period: "계정 생성일 7일 이내", groupName: "새싹 교주 1그룹", minDays: 0, maxDays: 7 },
          { period: "계정 생성 8일 ~ 30일 이내", groupName: "새싹 교주 2그룹", minDays: 8, maxDays: 30 },
          { period: "계정 생성 31일 ~ 60일 이내", groupName: "견습 교주 1그룹", minDays: 31, maxDays: 60 },
          { period: "계정 생성 61일 ~ 90일 이내", groupName: "견습 교주 2그룹", minDays: 61, maxDays: 90 },
          { period: "계정 생성 91일 ~ 180일 이내", groupName: "숙련 교주 1그룹", minDays: 91, maxDays: 180 },
          { period: "계정 생성 181일 ~ 270일 이내", groupName: "숙련 교주 2그룹", minDays: 181, maxDays: 270 },
          { period: "계정 생성 271일 ~ 365일 이내", groupName: "숙련 교주 3그룹", minDays: 271, maxDays: 365 },
          { period: "계정 생성 365일 이후", groupName: "숙련 교주 4그룹", minDays: 366, maxDays: 99999 }
        ],
        botInfo: "모든 그룹은 봇 3000명으로 시작해 최대 유저 2000명까지 늘어날 수 있습니다.",
        eldainLimitDesc: "엘다인 덱 편성 제한 개수가 사라집니다.",
        highSkillDesc: "PvP 승자의 줘팸터에서 고학년 스킬을 사용할 수 있습니다. (기존 레벨은 유지되며 스킬 효과 및 피해량 밸런싱 조정)",
      };
  }
}

export async function loadUpdates(): Promise<UpdatePost[]> {
  return fetchApi<UpdatePost[]>("/updates");
}

export async function saveUpdates(post: UpdatePost): Promise<UpdatePost> {
  return fetchApi<UpdatePost>("/admin/updates", {
    method: "POST",
    body: JSON.stringify(post),
  });
}

export async function deleteUpdate(id: string): Promise<{ success: boolean }> {
  return fetchApi<{ success: boolean }>(`/admin/updates/${id}`, {
    method: "DELETE",
  });
}
