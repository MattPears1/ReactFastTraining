#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Lex Business Website on Local Network${NC}"
echo "=========================================="

# Get the local IP address
if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
    # Linux or Mac
    LOCAL_IP=$(hostname -I | awk '{print $1}')
    if [ -z "$LOCAL_IP" ]; then
        LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
    fi
else
    # Windows (Git Bash)
    LOCAL_IP=$(ipconfig | grep -A 4 "Wireless LAN adapter Wi-Fi" | grep "IPv4" | awk '{print $NF}')
fi

if [ -z "$LOCAL_IP" ]; then
    echo -e "${RED}Could not determine local IP address${NC}"
    LOCAL_IP="localhost"
fi

echo -e "${YELLOW}Your local IP address is: $LOCAL_IP${NC}"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Start the development server
echo -e "${GREEN}Starting development server...${NC}"
echo ""
echo "The site will be accessible at:"
echo -e "  ${GREEN}Local:   ${NC}http://localhost:3000/"
echo -e "  ${GREEN}Network: ${NC}http://$LOCAL_IP:3000/"
echo ""
echo -e "${YELLOW}To access from your phone:${NC}"
echo "1. Connect your phone to the same WiFi network"
echo "2. Open your phone's browser"
echo "3. Navigate to: http://$LOCAL_IP:3000/"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

# Generate QR code if qrcode-terminal is installed
if command -v qrcode-terminal &> /dev/null; then
    echo -e "${GREEN}Scan this QR code with your phone:${NC}"
    qrcode-terminal "http://$LOCAL_IP:3000/"
else
    echo -e "${YELLOW}Tip: Install qrcode-terminal for easy phone access:${NC}"
    echo "  npm install -g qrcode-terminal"
fi

echo ""

# Start Vite with host option
npm run dev:host