@echo off

echo ==========================================
echo Deployment Started...
echo ==========================================

:: 1. Build
echo [1/3] Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed. Stopping deployment.
    exit /b %errorlevel%
)

:: 2. File Transfer (SCP)
echo [2/3] Transferring files to server...
scp -i "documents\TCG_key.pem" -r ./dist/* ec2-user@54.174.151.132:/var/www/html/

:: 3. Change Permissions (SSH)
echo [3/3] Updating server permissions...
ssh -i "documents\TCG_key.pem" ec2-user@54.174.151.132 "sudo chmod -R 755 /var/www/html/assets"

echo ==========================================
echo Deployment Successful!
echo ==========================================