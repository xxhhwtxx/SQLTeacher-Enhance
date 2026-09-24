@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 正在推送代码至 GitHub (xxhhwtxx/SQLTeacher-Enhance)...
echo ============================================================
echo   🚀 正在上传 SQLTeacher-Enhance 完整代码与实机截图到 GitHub
echo   目标仓库: https://github.com/xxhhwtxx/SQLTeacher-Enhance
echo ============================================================
echo.
echo 提示: 如果弹出浏览器或授权窗口，请点击 [Authorize] 授权即可。
echo 正在同步推送中，请稍候...
echo.
git push -u origin main
if %errorlevel% equ 0 (
    echo.
    echo ============================================================
    echo   🎉 上传成功！完整开源代码与高清图文文档已全部就绪！
    echo   仓库主页: https://github.com/xxhhwtxx/SQLTeacher-Enhance
    echo ============================================================
) else (
    echo.
    echo [!] 如果提示权限，请确保在弹出的网页中完成 GitHub 授权。
)
echo.
pause
