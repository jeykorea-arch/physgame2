/// <reference lib="webworker" />
/**
 * PWA 서비스 워커. docs/03 8절: 앱 셸·현재 차시 데이터·필수 2D 자산·비AR 카드를 우선 캐시하고,
 * 세 차시의 모든 대형 자산을 최초 접속에 한꺼번에 받지 않는다.
 */
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare const self: ServiceWorkerGlobalScope;

// 콘텐츠 버전을 캐시 이름에 포함시켜, 버전이 바뀌면 새 캐시 이름을 쓰고 구 캐시는 activate 시 정리되게 한다
// (docs/03 8절: "콘텐츠 버전과 서비스 워커 캐시 이름을 함께 올린다").
const CONTENT_VERSION = import.meta.env.VITE_CONTENT_VERSION ?? "unknown";

// 앱 셸(js/css/html/manifest)만 프리캐시한다. vite-plugin-pwa가 빌드 시 이 배열을 채운다.
// 각 항목은 빌드 해시로 리비전되어 있어 새 빌드는 자동으로 새 캐시 항목이 되고, cleanupOutdatedCaches가 구 항목을 지운다.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// 콘텐츠 JSON은 항상 최신 콘텐츠 버전을 우선 시도하고, 실패(오프라인)했을 때만 캐시로 대체한다(콘텐츠 불일치 방지).
registerRoute(
  ({ url }) => url.pathname.includes("/data/content"),
  new NetworkFirst({
    cacheName: `project-echo-content-${CONTENT_VERSION}`,
    plugins: [new ExpirationPlugin({ maxEntries: 20 })],
  })
);

// 마커 이미지·targets.mind는 차시 진입 시에만 요청되며, 이후에는 캐시를 우선 사용한다(지연 로딩 유지).
registerRoute(
  ({ url }) => url.pathname.includes("/assets/"),
  new CacheFirst({
    cacheName: `project-echo-ar-assets-${CONTENT_VERSION}`,
    plugins: [new ExpirationPlugin({ maxEntries: 10 })],
  })
);

// 그 외 정적 자산은 캐시 우선 + 백그라운드 갱신.
registerRoute(
  ({ request }) => request.destination === "script" || request.destination === "style",
  new StaleWhileRevalidate({ cacheName: `project-echo-static-${CONTENT_VERSION}` })
);

// 콘텐츠 버전이 바뀐 이전 캐시(예: project-echo-content-<구버전>)를 activate 시 제거한다.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const currentNames = new Set([
        `project-echo-content-${CONTENT_VERSION}`,
        `project-echo-ar-assets-${CONTENT_VERSION}`,
        `project-echo-static-${CONTENT_VERSION}`,
      ]);
      await Promise.all(
        keys
          .filter((k) => k.startsWith("project-echo-") && !currentNames.has(k))
          .map((k) => caches.delete(k))
      );
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
