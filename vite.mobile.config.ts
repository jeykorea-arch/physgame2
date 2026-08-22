import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { VitePWA } from "vite-plugin-pwa";

/**
 * 스마트폰 실기기 시험 전용 설정. `npm run dev:mobile`로 실행한다.
 * 카메라(getUserMedia)는 보안 컨텍스트(HTTPS 또는 localhost)에서만 동작하므로,
 * 같은 Wi-Fi의 스마트폰에서 PC의 LAN IP로 접속하려면 자체 서명 인증서로 HTTPS를 켜야 한다.
 * src/main.tsx가 virtual:pwa-register를 가져오므로, 이 설정에도 VitePWA 플러그인을 그대로 둔다
 * (없으면 그 import가 해석되지 않아 개발 서버가 즉시 에러를 낸다).
 */
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,webmanifest}"],
        globIgnores: ["**/mindar-image-three*.js"],
      },
      manifest: false,
      devOptions: { enabled: true, type: "module" },
    }),
  ],
  server: {
    host: true, // 0.0.0.0으로 바인딩해 같은 네트워크의 스마트폰이 접속할 수 있게 한다.
  },
});
