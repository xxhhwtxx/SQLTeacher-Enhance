﻿# uninstall.ps1 - SQLTeacher 美化版还原/卸载脚本
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "SQLTeacher 美化增强版 - 一键还原卸载"

Clear-Host
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "            SQLTeacher 美化版 一键卸载与还原向导            " -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$choice = Read-Host "确定要移除美化版快捷方式与扩展组件并恢复原版吗？(Y/N)"
if ($choice -ne "Y" -and $choice -ne "y") {
    Write-Host "已取消操作。" -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    exit
}

# 1. 移除美化版快捷方式
$desktop = [System.Environment]::GetFolderPath('Desktop')
$scPath = "$desktop\SQLTeacher (毛玻璃美化版).lnk"
if (Test-Path $scPath) {
    Remove-Item -Path $scPath -Force -ErrorAction SilentlyContinue
    Write-Host "[√] 已移除桌面快捷方式【SQLTeacher (毛玻璃美化版)】" -ForegroundColor Green
}

# 2. 清理 better-ui 目录
$targetDir = "$env:LOCALAPPDATA\SQLTeacher\better-ui"
if (Test-Path $targetDir) {
    Remove-Item -Path $targetDir -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "[√] 已清理扩展组件目录" -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "         🎉 恢复完成！您的官方原版软件未受任何破坏。         " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "您随时可以通过原有的官方桌面图标正常打开 SQLTeacher。" -ForegroundColor Gray
Write-Host ""
Start-Sleep -Seconds 2
