// 빌드마다 콘텐츠·마커 버전과 빌드 시각을 dist/version.json에 기록한다.
// 이전 정상 빌드로 되돌릴 때 "이 dist가 어느 콘텐츠 버전인지" 확인하는 용도다(docs/09 5번 산출물).
import { readFile, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const webAppRoot = path.dirname(fileURLToPath(import.meta.url)).replace(/scripts$/, "");
const projectRoot = path.resolve(webAppRoot, "..");

function tryGitCommit() {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: projectRoot, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return null; // git 저장소가 아직 없으면 null. 별도 승인 없이 git init을 실행하지 않는다.
  }
}

async function main() {
  const contract = JSON.parse(await readFile(path.join(projectRoot, "data", "content_contract.json"), "utf-8"));
  const manifest = JSON.parse(await readFile(path.join(projectRoot, "data", "marker_manifest.json"), "utf-8"));
  const pkg = JSON.parse(await readFile(path.join(webAppRoot, "package.json"), "utf-8"));

  const versionInfo = {
    appVersion: pkg.version,
    contentVersion: contract.content_version,
    markerVersion: manifest.version,
    targetsMindBytes: manifest.targets_bytes,
    builtAt: new Date().toISOString(),
    gitCommit: tryGitCommit(),
  };

  await writeFile(path.join(webAppRoot, "dist", "version.json"), JSON.stringify(versionInfo, null, 2) + "\n");
  console.log("dist/version.json 기록:", versionInfo);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
