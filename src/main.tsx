import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./app/App";
import "./app/styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 서비스 워커 등록 실패는 핵심 온라인 수업 진행을 막지 않는다(registerSW 내부에서 실패를 삼킨다).
registerSW({ immediate: true });

