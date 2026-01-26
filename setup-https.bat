@echo off
echo Setting up HTTPS for local network access...
echo.

echo 1. First, create a Cloudflare API token:
echo    - Go to https://dash.cloudflare.com/profile/api-tokens
echo    - Create a custom token with:
echo      * Zone:Zone:Read permission
echo      * Zone:DNS:Edit permission
echo      * Include your domain zone
echo.

set /p TOKEN="Enter your Cloudflare API token: "

echo CLOUDFLARE_API_TOKEN=%TOKEN% > .env

echo.
echo 2. Make sure you have a domain pointed to your local IP:
echo    - Your local IP: 192.168.132.142
echo    - Create an A record in DNS (e.g., workout.yourdomain.com -> 192.168.132.142)
echo.

echo 3. Update Caddyfile with your domain name...
echo.

set /p DOMAIN="Enter your domain (e.g., workout.yourdomain.com): "

powershell -Command "(Get-Content Caddyfile) -replace '192.168.132.142:443', '%DOMAIN%:443' | Set-Content Caddyfile"

echo.
echo Setup complete! Run 'docker-compose up -d --build' to start the service.
echo Your site will be available at: https://%DOMAIN%
pause