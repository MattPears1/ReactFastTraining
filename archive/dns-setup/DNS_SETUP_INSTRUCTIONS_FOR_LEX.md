# DNS Configuration Instructions for reactfasttraining.co.uk

## Overview
These instructions will help you point your domain (reactfasttraining.co.uk) from Wix to the new Heroku-hosted website.

---

## What You'll Need
- Access to your Wix account
- The Heroku DNS target (provided below)
- About 10-15 minutes

---

## Step 1: Log into Wix

1. Go to [www.wix.com](https://www.wix.com)
2. Click "Sign In" in the top right
3. Enter your email and password
4. Click on "My Sites" or "Manage Sites"

---

## Step 2: Access Domain Settings

1. Find **reactfasttraining.co.uk** in your domains list
2. Click on the **three dots (⋮)** next to the domain
3. Select **"Manage DNS Records"** or **"Advanced"** → **"Edit DNS"**

---

## Step 3: Configure DNS Records

### Remove/Disable Existing Records
⚠️ **Important**: Before adding new records, you may need to disable or remove existing A records pointing to Wix servers.

1. Look for any existing **A records** with values like:
   - 185.230.63.xxx
   - 185.230.60.xxx
   - Any Wix IP addresses
2. **Delete** or **Disable** these records

### Add New DNS Records

You need to add the following records:

#### For www.reactfasttraining.co.uk:
Add this CNAME record:
```
Type: CNAME
Host/Name: www
Points to: react-fast-training-6fb9e7681eed.herokuapp.com
TTL: 1 hour (or 3600)
```

#### For reactfasttraining.co.uk (root domain):
**Option 1 - If Wix supports ALIAS/ANAME records:**
```
Type: ALIAS (or ANAME)
Host/Name: @ (or leave empty)
Points to: react-fast-training-6fb9e7681eed.herokuapp.com
TTL: 1 hour (or 3600)
```

**Option 2 - If Wix only supports URL forwarding for root:**
```
Type: URL Redirect (or Forwarding)
Host/Name: @ (or leave empty)
Destination: https://www.reactfasttraining.co.uk
Redirect Type: 301 (Permanent)
```

⚠️ **Note**: The exact DNS target for your domain will be provided when the .co.uk domain is fully configured in Heroku. It may be different from the above.

### Keep These Records
✅ Keep any **MX records** (for email)
✅ Keep any **TXT records** (for email verification, etc.)

---

## Step 4: Save Changes

1. Click **"Save"** or **"Save DNS Records"**
2. You may see a warning about the site not being hosted on Wix - this is normal, click **"Yes, Continue"**

---

## Step 5: What Happens Next

### DNS Propagation
- Changes can take 1-48 hours to fully propagate worldwide
- Most users will see the change within 1-4 hours
- Your site may be intermittently available during this time

### Testing
After 1-2 hours, test by visiting:
- https://reactfasttraining.co.uk
- https://www.reactfasttraining.co.uk

---

## ⚠️ Important Notes

1. **Email Services**: These changes should NOT affect your email if you keep MX records intact
2. **SSL Certificate**: The new site will automatically get an SSL certificate from Heroku
3. **Old Wix Site**: Your Wix site will still exist but won't be accessible via this domain
4. **Reverting**: You can always revert by re-adding the original Wix DNS records

---

## 🚨 If Something Goes Wrong

If the site doesn't work after 24 hours:
1. Double-check all DNS records are entered correctly
2. Ensure old A records are removed
3. Clear your browser cache and try again
4. Try accessing from a different device/network

---

## Information from Developer

✅ **Heroku App Name**: `react-fast-training-6fb9e7681eed.herokuapp.com`
✅ **Status**: The app is live and ready to receive traffic
✅ **Current staging site**: https://reactfasttraining.org (working example)

**Important**: When your .co.uk domain is fully added to Heroku, you may receive specific DNS targets. Use those if provided, otherwise use the herokuapp.com address above.

---

## Quick Checklist

- [ ] Logged into Wix
- [ ] Found DNS settings for reactfasttraining.co.uk
- [ ] Removed/disabled old A records pointing to Wix
- [ ] Added new CNAME record pointing to Heroku
- [ ] Added URL redirect for root domain
- [ ] Saved all changes
- [ ] Noted the time (for tracking propagation)

---

## Contact for Help

If you need assistance:
- Wix Support: [support.wix.com](https://support.wix.com)
- Your developer for the Heroku app name
- DNS propagation checker: [whatsmydns.net](https://www.whatsmydns.net)

---

*Document created: [Current Date]
For: reactfasttraining.co.uk
Purpose: Point domain from Wix to Heroku hosting*