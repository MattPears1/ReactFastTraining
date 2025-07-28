# IMPORTANT: Get DNS Targets First!

## For the Developer

Before Lex can set up the DNS in Wix, you need to:

### 1. Ensure .co.uk domains are added to Heroku

Run these commands:
```bash
# Add the domains
heroku domains:add reactfasttraining.co.uk --app react-fast-training
heroku domains:add www.reactfasttraining.co.uk --app react-fast-training

# Wait a few minutes for them to process

# Get the DNS targets
heroku domains --app react-fast-training
```

### 2. Look for DNS Targets

You should see something like:
```
Domain Name                  DNS Record Type  DNS Target
reactfasttraining.co.uk     ALIAS or ANAME   example-animal-abc123.herokudns.com
www.reactfasttraining.co.uk CNAME           another-animal-xyz789.herokudns.com
```

### 3. Send These to Lex

The DNS targets (the `.herokudns.com` addresses) are what Lex needs to enter in Wix.

---

## Why This Matters

❌ **WRONG**: Using `react-fast-training-6fb9e7681eed.herokuapp.com`
✅ **RIGHT**: Using the specific `.herokudns.com` targets

The `.herokudns.com` addresses are special DNS targets that:
- Handle SSL certificates automatically
- Provide better routing
- Are required for custom domains

---

## Current Status

Based on what we see, the .org domains have these targets:
- `reactfasttraining.org` → `structural-wildcat-6ipz9dhimylbz66zcxgj23ld.herokudns.com`
- `www.reactfasttraining.org` → `functional-buttercup-ezue74e7yvro9gtstgsi1n5i.herokudns.com`

The .co.uk domains will get their own unique DNS targets when added.