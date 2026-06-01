@echo off
REM Verify GitHub Secrets Setup
REM Run this to check if everything is configured correctly

setlocal enabledelayedexpansion

echo.
echo =====================================
echo GitHub Secrets Verification
echo =====================================
echo.

echo [STEP 1] Go to GitHub Repository
echo - Navigate to: https://github.com/YOUR_USERNAME/crm-system
echo - Click: Settings (top right)
echo - Left sidebar: Secrets and variables ^> Actions
echo.

echo [STEP 2] Add These Secrets:
echo.
echo Secret 1:
echo   Name:  EC2_HOST
echo   Value: 54.152.64.110
echo.
echo Secret 2:
echo   Name:  EC2_USERNAME
echo   Value: ubuntu
echo.
echo Secret 3:
echo   Name:  EC2_PRIVATE_KEY
echo   Value: (Your entire .pem file content)
echo.

echo [STEP 3] Verify Installation
echo After adding secrets:
echo   1. Go to Actions tab
echo   2. Click the failed workflow run
echo   3. Click "Re-run failed jobs"
echo   4. Watch the deployment logs
echo.

echo [TROUBLESHOOTING]
echo If it still fails:
echo   1. Check EC2 is running: ping 54.152.64.110
echo   2. Check SSH access: ssh -i your-key.pem ubuntu@54.152.64.110
echo   3. Verify .env file exists on EC2
echo   4. Check Docker is installed: ssh ... docker --version
echo.

echo =====================================
pause
