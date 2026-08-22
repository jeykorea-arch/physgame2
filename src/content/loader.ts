import type { ContentContract, LessonContent } from "./types";
import { validateContentContract, validateLessonContent } from "./validator";

const base = import.meta.env.BASE_URL;

let cachedContract: ContentContract | null = null;
const cachedLessons = new Map<number, LessonContent>();

export class ContentLoadError extends Error {}

export async function loadContentContract(): Promise<ContentContract> {
  if (cachedContract) return cachedContract;
  const res = await fetch(`${base}data/content_contract.json`);
  if (!res.ok) throw new ContentLoadError(`content_contract.json을 불러오지 못했다: ${res.status}`);
  const contract = (await res.json()) as ContentContract;
  const issues = validateContentContract(contract);
  if (issues.length > 0) {
    throw new ContentLoadError(`콘텐츠 계약 검증 실패: ${issues.map((i) => i.message).join("; ")}`);
  }
  cachedContract = contract;
  return contract;
}

export async function loadLessonContent(lessonId: 1 | 2 | 3): Promise<LessonContent> {
  const cached = cachedLessons.get(lessonId);
  if (cached) return cached;
  const contract = await loadContentContract();
  const res = await fetch(`${base}data/content/lesson${lessonId}.json`);
  if (!res.ok) throw new ContentLoadError(`lesson${lessonId}.json을 불러오지 못했다: ${res.status}`);
  const lesson = (await res.json()) as LessonContent;
  const issues = validateLessonContent(contract, lesson);
  if (issues.length > 0) {
    throw new ContentLoadError(`차시 ${lessonId} 콘텐츠 검증 실패: ${issues.map((i) => i.message).join("; ")}`);
  }
  cachedLessons.set(lessonId, lesson);
  return lesson;
}
