import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// 콘텐츠 버전은 physgame2/data/content_contract.json을 유일한 원본으로 삼는다(.env 등에 따로
// 적어두지 않는다). CI 빌드에는 로컬 .env가 없으므로, 수동으로 맞춰야 하는 값을 없애 "unknown"으로
// 새는 경로를 원천적으로 막는다.
const contentContract = JSON.parse(readFileSync(new URL("../data/content_contract.json", import.meta.url), "utf-8"));

// 하위 경로 배포(GitHub Pages 등)에서도 자산 경로가 깨지지 않도록 상대 base를 사용한다.
// 실제 배포 경로는 빌드 시 VITE_BASE_PATH 환경변수로 덮어쓸 수 있다.
export default defineConfig(({ mode }) => ({
  base: process.env.VITE_BASE_PATH ?? "./",
  define: {
    "import.meta.env.VITE_CONTENT_VERSION": JSON.stringify(contentContract.content_version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        // 세 차시 대형 자산을 한 번에 프리캐시하지 않는다. 앱 셸만 프리캐시한다.
        globPatterns: ["**/*.{js,css,html,svg,webmanifest}"],
        // MindAR 번들은 AR 시작 시에만 지연 로딩하며 서비스 워커가 자산 캐시 전략으로 별도 처리한다.
        globIgnores: ["**/mindar-image-three*.js"],
      },
      manifest: false, // public/manifest.webmanifest를 직접 관리한다.
      devOptions: { enabled: mode === "development", type: "module" },
    }),
  ],
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
}));
