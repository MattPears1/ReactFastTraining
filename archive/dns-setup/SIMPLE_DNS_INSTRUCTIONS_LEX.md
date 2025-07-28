# Simple DNS Setup for reactfasttraining.co.uk

## What You Need to Do

You need to point your domain from Wix to the new Heroku site. Here's exactly what to enter:

---

## Step 1: Log into Wix
Go to www.wix.com and sign in

---

## Step 2: Find Your Domain Settings
1. Go to your domains
2. Find **reactfasttraining.co.uk**
3. Click **Manage DNS Records** or **Advanced** → **Edit DNS**

---

## Step 3: Remove Old Records
Delete any "A records" that point to Wix (usually IP addresses starting with 185.230.xxx.xxx)

---

## Step 4: Add These New Records

### Record 1 - For www.reactfasttraining.co.uk
- **Type**: CNAME
- **Host/Name**: www
- **Points to**: react-fast-training-6fb9e7681eed.herokuapp.com
- **TTL**: 3600 (or 1 hour)

### Record 2 - For reactfasttraining.co.uk (without www)
- **Type**: URL Redirect (or Forwarding)
- **From**: @ (or leave empty)
- **To**: https://www.reactfasttraining.co.uk
- **Type**: 301 Permanent

---

## Step 5: Save Everything
Click Save and confirm any warnings about the site not being on Wix

---

## That's It!

- The change takes 1-4 hours to work everywhere
- Your email will keep working normally
- Test by visiting https://reactfasttraining.co.uk after a few hours

---

## Need Help?

- The site is already working at: https://reactfasttraining.org (so you can see what it will look like)
- If something goes wrong, you can always change the DNS back to the original Wix settings

---

**Ready to go? The whole process should take about 10 minutes.**