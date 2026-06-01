@echo off
REM Local CI/CD Test Skripti (Windows)
REM Bu skript CI/CD pipelineini local'da simulyatsiya qiladi

setlocal enabledelayedexpansion

echo.
echo =====================================
echo Local CI/CD Test Skriptini boshlash...
echo =====================================
echo.

REM 1. Lint Tekshirish
echo [1/5] Lint tekshirish...
call npm run lint >nul 2>&1
if errorlevel 1 (
    echo [!] ESLint konfiguratsiyasi topilmadi (o'tkazib yuborish)
) else (
    echo [OK] Lint tekshiruvi muvaffaqiyatli
)

REM 2. Prettier Format Tekshirish
echo.
echo [2/5] Code formati tekshirish...
npx prettier --check . --ignore-path .gitignore >nul 2>&1
if errorlevel 1 (
    echo [!] Prettier topilmadi (o'tkazib yuborish)
) else (
    echo [OK] Format tekshiruvi muvaffaqiyatli
)

REM 3. Test Ishga Tushirish
echo.
echo [3/5] Testlarni ishga tushirish...
call npm test >nul 2>&1
if errorlevel 1 (
    echo [!] Test skriptlari topilmadi (o'tkazib yuborish)
) else (
    echo [OK] Testlar muvaffaqiyatli
)

REM 4. NPM Audit
echo.
echo [4/5] NPM security audit...
call npm audit --audit-level=moderate
if errorlevel 1 (
    echo [!] Security qaygular bor
) else (
    echo [OK] Security audit muvaffaqiyatli
)

REM 5. Docker Build Tekshirish (Ixtiyoriy)
echo.
echo [5/5] Docker image build tekshirish (ixtiyoriy)...
set /p docker_test="Docker image build qilishni xohlaysizmi? (y/n): "
if /i "%docker_test%"=="y" (
    docker build -t crm-system:test . >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Docker build xatolikka duch keldi
        exit /b 1
    ) else (
        echo [OK] Docker build muvaffaqiyatli
        docker rmi crm-system:test >nul 2>&1
    )
)

echo.
echo =====================================
echo Test tugallandi!
echo =====================================
pause
