@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 工作进度提醒 - 启动器

if not exist "dist\index.html" (
    echo 首次运行，正在构建应用...
    call npm run build
)

echo 正在启动应用...
start "" /b npx electron .
exit
