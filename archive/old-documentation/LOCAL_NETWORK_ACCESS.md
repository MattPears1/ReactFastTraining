# Local Network Access Guide

## Viewing the Site on Your Phone

The application is now configured to be accessible on your local network. Here's how to access it:

### 1. Start the Development Server

Run the development server:
```bash
cd /mnt/f/2025/Lex_site_v1
npm run dev
```

### 2. Access from Your Phone

Once the server is running, you'll see output like:
```
  ➜  Local:   http://localhost:3000/
  ➜  Network: http://172.22.79.180:3000/
```

**On your phone:**
1. Make sure your phone is connected to the same WiFi network as your computer
2. Open your phone's web browser
3. Enter the Network URL: `http://172.22.79.180:3000/`

### 3. Alternative: Find Your IP Address

If the IP address changes or you need to find it manually:

**On Windows (WSL):**
```bash
hostname -I | awk '{print $1}'
```

**On Windows (PowerShell):**
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*"} | Select-Object IPAddress
```
the dev pc is w1.

### 4. Troubleshooting

**If you can't connect:**

1. **Check Windows Firewall:**
   - Windows Defender Firewall might block the connection
   - When you first run `npm run dev`, Windows should prompt to allow Node.js
   - If not, manually add an exception for Node.js on port 3000

2. **Check your WiFi:**
   - Ensure both devices are on the same network
   - Some routers isolate devices - check your router settings

3. **Try a different port:**
   ```bash
   npm run dev -- --port 5173
   ```

4. **Use ngrok for public access:**
   ```bash
   # Install ngrok
   npm install -g ngrok
   
   # Start your dev server
   npm run dev
   
   # In another terminal, expose it
   ngrok http 3000
   ```

### 5. Backend Access (if needed)

If you're also running the backend:
```bash
cd backend
npm run dev
```

The backend will be available at: `http://172.22.79.180:5000/`

### 6. Security Note

⚠️ **Important:** The `host: true` setting exposes your development server to your entire local network. This is fine for development, but:
- Only use this in trusted networks
- Don't use this configuration in production
- The development server has no authentication

### 7. Mobile Development Tips

**Enable Mobile DevTools:**
1. On your phone, you can use Chrome DevTools remotely
2. Connect your phone via USB
3. Enable USB debugging on your phone
4. In Chrome on your computer: `chrome://inspect`

**Test Different Viewports:**
- The site is optimized for mobile (320px+), tablet (768px+), and desktop (1024px+)
- Use your phone in both portrait and landscape modes
- Test on different devices if possible

**Hot Reload Works!**
- Changes you make on your computer will instantly appear on your phone
- Great for responsive design testing

### 8. Quick Access QR Code

You can generate a QR code for easy access:
```bash
# Install qrcode generator
npm install -g qrcode-terminal

# Generate QR code
qrcode-terminal http://172.22.79.180:3000
```

Then just scan the QR code with your phone's camera!