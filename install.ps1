# install.ps1 - SQLTeacher 美化强化版自动安装程序
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "SQLTeacher 美化强化版 - 安装向导"

Clear-Host
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "        🌟 SQLTeacher 豪华美化强化扩展包 安装向导 🌟        " -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. 建立目标目录
$targetDir = "$env:LOCALAPPDATA\SQLTeacher\better-ui"
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

$scriptDir = $PSScriptRoot
Write-Host "[1/3] 正在复制核心组件与增强引擎..." -ForegroundColor Green
Copy-Item -Path "$scriptDir\SQLTeacher-Plus.exe" -Destination "$targetDir\SQLTeacher-Plus.exe" -Force
Copy-Item -Path "$scriptDir\theme.css" -Destination "$targetDir\theme.css" -Force
Copy-Item -Path "$scriptDir\better-enhancements.js" -Destination "$targetDir\better-enhancements.js" -Force

# 2. 智能探测 SQLTeacher 主程序路径
Write-Host "[2/3] 正在智能扫描电脑中的 SQLTeacher 安装路径..." -ForegroundColor Green
$detectedExe = $null

# 检查注册表
$regRoots = @(
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
    "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall",
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall"
)
foreach ($r in $regRoots) {
    if (Test-Path $r) {
        Get-ChildItem -Path $r -ErrorAction SilentlyContinue | ForEach-Object {
            $name = (Get-ItemProperty -Path $_.PSPath -Name DisplayName -ErrorAction SilentlyContinue).DisplayName
            if ($name -like "*SQLTeacher*") {
                $loc = (Get-ItemProperty -Path $_.PSPath -Name InstallLocation -ErrorAction SilentlyContinue).InstallLocation
                if ($loc -and (Test-Path "$loc\sqlteacher-desktop.exe")) {
                    $detectedExe = "$loc\sqlteacher-desktop.exe"
                }
            }
        }
    }
    if ($detectedExe) { break }
}

# 检查标准路径
if (-not $detectedExe) {
    $standardPaths = @(
        "D:\Program Files\SQLTeacher\sqlteacher-desktop.exe",
        "C:\Program Files\SQLTeacher\sqlteacher-desktop.exe",
        "C:\Program Files (x86)\SQLTeacher\sqlteacher-desktop.exe",
        "D:\Program Files (x86)\SQLTeacher\sqlteacher-desktop.exe",
        "E:\Program Files\SQLTeacher\sqlteacher-desktop.exe",
        "$env:LOCALAPPDATA\Programs\SQLTeacher\sqlteacher-desktop.exe"
    )
    foreach ($p in $standardPaths) {
        if (Test-Path $p) {
            $detectedExe = $p
            break
        }
    }
}

if ($detectedExe) {
    Write-Host "    [√] 成功自动匹配 SQLTeacher: $detectedExe" -ForegroundColor Cyan
    $cfg = @{ sqlteacher_path = $detectedExe } | ConvertTo-Json
    Set-Content -Path "$targetDir\config.json" -Value $cfg -Encoding UTF8
} else {
    Write-Host "    [i] 未在默认目录检测到安装，将在首次启动时弹出窗口供您指定。" -ForegroundColor Yellow
}

# 3. 创建桌面快捷方式
Write-Host "[3/3] 正在生成桌面专属快捷方式..." -ForegroundColor Green
$wsh = New-Object -ComObject WScript.Shell
$desktop = [System.Environment]::GetFolderPath('Desktop')
$scPath = "$desktop\SQLTeacher (毛玻璃美化版).lnk"
$sc = $wsh.CreateShortcut($scPath)
$sc.TargetPath = "$targetDir\SQLTeacher-Plus.exe"
$workDir = $targetDir
if ($detectedExe) {
    $workDir = Split-Path $detectedExe
}
$sc.WorkingDirectory = $workDir
if ($detectedExe) { $sc.IconLocation = "$detectedExe,0" }
$sc.Description = "SQLTeacher 豪华毛玻璃与全能美化增强版"
$sc.Save()

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "               🎉 安装完成！所有增强已就绪！               " -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "桌面已生成快捷方式: 【SQLTeacher (毛玻璃美化版)】" -ForegroundColor White
Write-Host ""
Write-Host "包含全新旗舰动效与特色模块:" -ForegroundColor Gray
Write-Host "  🍏 顶级交互: Apple 弹簧阻尼弹性弹出 + 底面暗黑玻璃镜像反射 + 触觉物理微压缩" -ForegroundColor Gray
Write-Host "  🃏 3D 画廊: 扇形层叠壁纸画廊，负边距倾角层叠 + 悬停平滑展开" -ForegroundColor Gray
Write-Host "  🌸 灵动生机: 繁花六瓣呼吸旋转番茄钟 + 专注盛放庆祝 + 25m/50m/5m 心流模式" -ForegroundColor Gray
Write-Host "  🖼️ 动态壁纸: 4K/超清视频壁纸 (MP4/WebM) + 静态图片 28s 呼吸运镜 + 独立明暗对比度" -ForegroundColor Gray
Write-Host "  🔥 打击音效: Power Mode 粒子连击 + 原生机械键盘音效 + 沉浸白噪音" -ForegroundColor Gray
Write-Host "  🛠️ 辅助神器: SQL底层逻辑流水线全景图 + Ray.so 打卡图生成 + 刷题绿格子打卡墙" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "是否立即启动体验美化版？(Y/N，直接回车默认为 Y)"
if ($choice -eq "" -or $choice -eq "Y" -or $choice -eq "y") {
    Write-Host "正在启动 SQLTeacher 美化版..." -ForegroundColor Cyan
    $launchDir = $targetDir
    if ($detectedExe) {
        $launchDir = Split-Path $detectedExe
    }
    Start-Process -FilePath "$targetDir\SQLTeacher-Plus.exe" -WorkingDirectory $launchDir
}
Write-Host '祝您使用愉快！' -ForegroundColor Green
Start-Sleep -Seconds 2
