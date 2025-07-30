# PowerShell script to configure Windows Firewall for development server
# Run this script as Administrator

Write-Host "Setting up Windows Firewall rules for Lex Business Website development server..." -ForegroundColor Green

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script must be run as Administrator. Exiting..." -ForegroundColor Red
    exit 1
}

# Remove existing rules if any
Write-Host "Removing existing Node.js development server rules..." -ForegroundColor Yellow
Remove-NetFirewallRule -DisplayName "Node.js Development Server (Port 3000)" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "Vite Development Server" -ErrorAction SilentlyContinue

# Create new firewall rules
Write-Host "Creating new firewall rules..." -ForegroundColor Yellow

# Inbound rule for port 3000
New-NetFirewallRule -DisplayName "Node.js Development Server (Port 3000)" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 3000 `
    -Action Allow `
    -Profile Private,Public `
    -Description "Allow inbound traffic for Vite development server on port 3000"

# Alternative ports
New-NetFirewallRule -DisplayName "Vite Development Server (Alternative Ports)" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 5173,8080,4173 `
    -Action Allow `
    -Profile Private,Public `
    -Description "Allow inbound traffic for Vite development server on alternative ports"

# Allow Node.js through firewall
$nodePath = (Get-Command node -ErrorAction SilentlyContinue).Path
if ($nodePath) {
    New-NetFirewallRule -DisplayName "Node.js" `
        -Direction Inbound `
        -Program $nodePath `
        -Action Allow `
        -Profile Private,Public `
        -Description "Allow Node.js inbound connections"
    Write-Host "Added firewall rule for Node.js at: $nodePath" -ForegroundColor Green
}

Write-Host "`nFirewall rules created successfully!" -ForegroundColor Green
Write-Host "You can now access the development server from other devices on your network." -ForegroundColor Cyan

# Display current network information
Write-Host "`nYour network interfaces:" -ForegroundColor Yellow
$adapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" }
foreach ($adapter in $adapters) {
    $adapterName = (Get-NetAdapter -InterfaceIndex $adapter.InterfaceIndex).Name
    Write-Host "  $adapterName`: $($adapter.IPAddress)" -ForegroundColor Cyan
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")