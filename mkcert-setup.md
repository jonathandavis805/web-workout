# Install mkcert locally on Windows
# Run these commands in PowerShell as Administrator:

# 1. Install Chocolatey if not already installed
# Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 2. Install mkcert
# choco install mkcert

# 3. Create and install local CA
# mkcert -install

# 4. Generate certificates for your domains
# mkcert workout.davishousehold.com localhost 127.0.0.1 192.168.132.142

# 5. Copy the generated files to the project
# The certificates will be in: %LOCALAPPDATA%\mkcert\