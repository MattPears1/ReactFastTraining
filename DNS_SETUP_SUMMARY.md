# DNS Setup Summary - Quick Overview

## What's Happening?
Moving reactfasttraining.co.uk from Wix hosting to Heroku hosting

## Why?
- New custom-built website with booking system
- Better performance and features
- Full control over functionality

## The Process (Simple Version)

### 1. Developer (You) Does:
- Deploy site to Heroku ✓
- Add custom domain in Heroku settings
- Get the DNS target from Heroku
- Send instructions to Lex

### 2. Lex Does:
- Logs into Wix
- Goes to DNS settings
- Removes old records
- Adds new record pointing to Heroku
- Saves changes

### 3. What Happens:
- DNS changes propagate (1-4 hours)
- Site starts loading from Heroku instead of Wix
- SSL certificate auto-provisions
- Email continues working normally

## Key Points
- **No downtime** (site accessible throughout)
- **Email unaffected** (MX records stay the same)
- **Reversible** (can switch back to Wix if needed)
- **Secure** (automatic SSL from Heroku)

## Timeline
1. **Now**: Developer prepares everything
2. **When ready**: Lex makes DNS changes (15 minutes)
3. **1-4 hours later**: New site fully live
4. **24 hours**: Full global propagation

## Files Included
1. `DNS_SETUP_INSTRUCTIONS_FOR_LEX.md` - Detailed steps for Lex
2. `HEROKU_DOMAIN_SETUP.md` - Technical steps for developer
3. `EMAIL_TO_LEX_TEMPLATE.txt` - Ready-to-send email
4. `DNS_SETUP_SUMMARY.md` - This overview

---

Remember to fill in:
- [ ] Heroku app name
- [ ] DNS target from Heroku
- [ ] Test the staging site first
- [ ] Have Heroku support contact ready