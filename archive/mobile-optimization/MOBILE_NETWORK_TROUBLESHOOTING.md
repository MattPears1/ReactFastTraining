# Mobile Network Access Troubleshooting

## Issue: "Site can't be reached" on phone

Based on your output, you have multiple network interfaces. Here's how to fix it:

### 1. Identify the Correct IP Address

From your Vite output, you have several IPs:
- `192.168.146.1` - Virtual network
- `192.168.153.1` - Virtual network
- **`192.168.0.230`** - This is likely your WiFi network (192.168.0.x is common for home routers)
- `172.22.64.1` - WSL network

**Try this URL on your phone: `http://192.168.0.230:3000/`**

### 2. Fix "Connection Not Secure" Warning

Some phones show security warnings for HTTP (non-HTTPS) connections. Here are solutions:

#### Option A: Use Chrome and Accept the Warning
1. Open Chrome on your phone
2. Type the URL: `http://192.168.0.230:3000/`
3. If you see a warning, tap "Advanced" then "Proceed to site"

#### Option B: Use Firefox Mobile
Firefox is often more lenient with local development servers.

#### Option C: Try Different Browsers
- Samsung Internet
- Opera
- Brave

### 3. Windows Firewall Configuration

The connection might be blocked by Windows Firewall:

1. **When you run `npm run dev`, Windows should show a firewall popup**
   - Click "Allow access"
   - Check both "Private networks" and "Public networks"

2. **If no popup appeared, manually add the rule:**
   ```powershell
   # Run PowerShell as Administrator
   New-NetFirewallRule -DisplayName "Node.js Development Server" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
   ```

3. **Or through Windows Security GUI:**
   - Open Windows Security
   - Go to Firewall & network protection
   - Click "Allow an app through firewall"
   - Click "Change settings" then "Allow another app"
   - Browse to Node.js (usually in `C:\Program Files\nodejs\node.exe`)
   - Check both Private and Public networks

### 4. Quick Test Script

Run this to find your correct IP:
```bash
node scripts/find-network-ip.js
```

### 5. Alternative: Use ngrok for HTTPS

If you need HTTPS to avoid security warnings:

```bash
# Install ngrok
npm install -g ngrok

# Start your dev server
npm run dev

# In another terminal
ngrok http 3000
```

This gives you a public HTTPS URL like `https://abc123.ngrok.io` that works on any device.

### 6. Router Settings

Some routers have "AP Isolation" or "Client Isolation" enabled, which prevents devices from communicating. Check your router settings:

1. Access router admin (usually 192.168.0.1 or 192.168.1.1)
2. Look for Wireless Settings
3. Disable "AP Isolation" or "Client Isolation"
4. Save and restart router

### 7. Use the Same Network

Ensure both devices are on the same network:
- Not using mobile data
- Connected to the same WiFi network (not guest network)
- Same frequency band (2.4GHz or 5GHz)

### 8. Try a Different Port

Some networks block port 3000:

```bash
npm run dev -- --port 8080
```

Then try: `http://192.168.0.230:8080/`

### 9. Windows Network Profile

Make sure your network is set to "Private":
1. Go to Settings > Network & Internet > Wi-Fi
2. Click on your network name
3. Under "Network profile type", select "Private"

### 10. Last Resort: USB Debugging

If nothing works, use USB debugging:
1. Connect phone via USB
2. Enable USB debugging on phone
3. Use Chrome DevTools remote debugging
4. Access via `localhost:3000` on the phone

## Most Likely Solution

Based on your output, try:
1. Use `http://192.168.0.230:3000/` on your phone
2. If you get a security warning, use Chrome and tap "Advanced" > "Proceed"
3. Make sure Windows Firewall allows Node.js

The IP `192.168.0.230` appears to be your actual WiFi network address, which is what your phone needs to connect to.