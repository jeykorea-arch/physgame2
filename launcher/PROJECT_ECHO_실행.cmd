@echo off
chcp 65001 >nul
title PROJECT ECHO
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js를 찾지 못했습니다.
  echo https://nodejs.org/ 에서 Node.js LTS를 설치한 뒤 다시 실행해 주세요.
  pause
  exit /b 1
)

node "%~dp0server.mjs"
if errorlevel 1 pause
