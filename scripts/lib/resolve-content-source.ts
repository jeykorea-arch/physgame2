// physgame2/data/*는 사람이 직접 관리하는 PRD 원본이지만, 배포되는 저장소는 web-app/만 담고 있어
// 그 폴더가 항상 있지는 않다(예: GitHub Actions 체크아웃). 있으면 그것을 원본으로 쓰고, 없으면 이미
// web-app/public/data/에 동기화되어 커밋된 사본을 그대로 원본처럼 취급한다.
import { existsSync } from "node:fs";
import path from "node:path";

export interface ResolvedDataSource {
  usingPrdSource: boolean;
  contentContractPath: string;
  markerManifestPath: string;
}

export function resolveDataSource(webAppRoot: string): ResolvedDataSource {
  const prdDataDir = path.join(webAppRoot, "..", "data");
  const usingPrdSource = existsSync(path.join(prdDataDir, "content_contract.json"));
  const dataDir = usingPrdSource ? prdDataDir : path.join(webAppRoot, "public", "data");
  return {
    usingPrdSource,
    contentContractPath: path.join(dataDir, "content_contract.json"),
    markerManifestPath: path.join(dataDir, "marker_manifest.json"),
  };
}
