@echo off
chcp 65001 >nul
cd /d "%~dp0"
title SQLTeacher 美化增强版 - 一键还原卸载
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0uninstall.ps1"
if %errorlevel% neq 0 pause
