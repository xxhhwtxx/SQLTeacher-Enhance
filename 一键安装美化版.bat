@echo off
chcp 65001 >nul
cd /d "%~dp0"
title SQLTeacher 美化强化版 - 安装向导
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
if %errorlevel% neq 0 pause
