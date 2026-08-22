// 빌드 전 콘텐츠 계약을 검증하고, PRD 데이터(physgame2/data/*)를 public/data/로 동기화한다.
// 화면 문구와 데이터 문구가 다른 정답을 가리키지 않도록 physgame2/data/*.json을 단일 소스로 삼는다.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  validateContentContract,
  validateMarkerManifest,
  validateLessonContent,
} from "../src/content/validator.ts";

const webAppRoot = path.dirname(fileURLToPath(import.meta.url)).replace(/scripts$/, "");
const projectRoot = path.resolve(webAppRoot, "..");

async function readJson(p) {
  return JSON.parse(await readFile(p, "utf-8"));
}

async function main() {
  const allIssues = [];

  const contract = await readJson(path.join(projectRoot, "data", "content_contract.json"));
  const manifest = await readJson(path.join(projectRoot, "data", "marker_manifest.json"));

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

  const publicDataDir = path.join(webAppRoot, "public", "data");
  await mkdir(publicDataDir, { recursive: true });
  await writeFile(
    path.join(publicDataDir, "content_contract.json"),
    JSON.stringify(contract, null, 2) + "\n"
  );
  await writeFile(
    path.join(publicDataDir, "marker_manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  );

  console.log(`콘텐츠 계약 검증 통과. 차시 ${lessonContents.length}개, 핵심 문항 ${contract.product.required_question_total}개.`);
  console.log("physgame2/data/content_contract.json, marker_manifest.json → web-app/public/data/ 동기화 완료.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
