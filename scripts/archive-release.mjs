// dist/를 releases/<contentVersion>-<타임스탬프>/로 복사해 보관한다.
// git 저장소가 아직 없으므로(사용자 승인 없이 만들지 않음), 이 폴더 보관이 현재의 롤백 수단이다.
// 문제가 생기면 releases/의 이전 폴더를 그대로 다시 배포하면 된다.
import { cp, mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const webAppRoot = path.dirname(fileURLToPath(import.meta.url)).replace(/scripts$/, "");

async function main() {
  const versionInfoPath = path.join(webAppRoot, "dist", "version.json");
  let versionInfo;
  try {
    versionInfo = JSON.parse(await readFile(versionInfoPath, "utf-8"));
  } catch {
    console.error("dist/version.json이 없다. 먼저 `npm run build`를 실행해라.");
    process.exit(1);
  }

  const stamp = versionInfo.builtAt.replace(/[:.]/g, "-");
  const destName = `${versionInfo.contentVersion}_${stamp}`;
  const destDir = path.join(webAppRoot, "releases", destName);

  await mkdir(path.join(webAppRoot, "releases"), { recursive: true });
  await cp(path.join(webAppRoot, "dist"), destDir, { recursive: true });

  console.log(`보관 완료: releases/${destName}`);
  console.log("이 폴더를 그대로 다시 배포하면 이 시점의 빌드로 롤백된다.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
