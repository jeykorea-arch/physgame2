// 빌드 전 콘텐츠 계약을 검증한다. physgame2/data/*(PRD 원본)가 있으면 그것을 원본으로 삼아
// public/data/에 동기화하고, 배포 저장소처럼 web-app만 체크아웃된 환경(physgame2/data/ 없음)에서는
// 이미 커밋되어 있는 public/data/의 사본을 그대로 검증만 한다(동기화 대상 자체가 없다).
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { resolveDataSource } from "./lib/resolve-content-source.ts";
import {
  validateContentContract,
  validateMarkerManifest,
  validateLessonContent,
} from "../src/content/validator.ts";

const webAppRoot = path.dirname(fileURLToPath(import.meta.url)).replace(/scripts$/, "");

async function readJson(p) {
  return JSON.parse(await readFile(p, "utf-8"));
}

async function main() {
  const allIssues = [];
  const { usingPrdSource, contentContractPath, markerManifestPath } = resolveDataSource(webAppRoot);

  const contract = await readJson(contentContractPath);
  const manifest = await readJson(markerManifestPath);

  allIssues.push(...validateContentContract(contract));
  allIssues.push(...validateMarkerManifest(contract, manifest));

  const lessonContents = [];
  for (const lessonId of [1, 2, 3]) {
    const lessonPath = path.join(webAppRoot, "public", "data", "content", `lesson${lessonId}.json`);
    const lesson = await readJson(lessonPath);
    lessonContents.push(lesson);
    allIssues.push(...validateLessonContent(contract, lesson));
  }

  if (allIssues.length > 0) {
    console.error(`콘텐츠 계약 검증 실패: ${allIssues.length}건`);
    for (const issue of allIssues) {
      console.error(`  [${issue.code}] ${issue.message}`);
    }
    process.exit(1);
  }

  if (usingPrdSource) {
    const publicDataDir = path.join(webAppRoot, "public", "data");
    await mkdir(publicDataDir, { recursive: true });
    await writeFile(path.join(publicDataDir, "content_contract.json"), JSON.stringify(contract, null, 2) + "\n");
    await writeFile(path.join(publicDataDir, "marker_manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
    console.log(`콘텐츠 계약 검증 통과. 차시 ${lessonContents.length}개, 핵심 문항 ${contract.product.required_question_total}개.`);
    console.log("physgame2/data/content_contract.json, marker_manifest.json → web-app/public/data/ 동기화 완료.");
  } else {
    console.log(`콘텐츠 계약 검증 통과. 차시 ${lessonContents.length}개, 핵심 문항 ${contract.product.required_question_total}개.`);
    console.log("physgame2/data/가 없어(배포 저장소) public/data/에 이미 있는 사본만 검증했다.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
