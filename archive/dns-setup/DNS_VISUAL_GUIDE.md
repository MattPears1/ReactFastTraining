# DNS Setup Visual Guide

## What's Happening (Visual)

```
BEFORE:
User types: reactfasttraining.co.uk
    ↓
Goes to: Wix Servers
    ↓
Shows: Wix Website

AFTER:
User types: reactfasttraining.co.uk
    ↓
Goes to: Heroku Servers
    ↓
Shows: New Custom Website
```

---

## The DNS Records You're Adding

### 1️⃣ WWW Record (CNAME)
```
┌─────────────────────────────────────────────────┐
│ Type:     CNAME                                 │
│ Host:     www                                   │
│ Points to: react-fast-training-6fb9e7681eed... │
│ TTL:      3600                                  │
└─────────────────────────────────────────────────┘
```

### 2️⃣ Root Domain (Redirect)
```
┌─────────────────────────────────────────────────┐
│ Type:     301 Redirect                          │
│ From:     @ (or empty)                          │
│ To:       https://www.reactfasttraining.co.uk  │
└─────────────────────────────────────────────────┘
```

---

## What Each Field Means

- **Type**: The kind of DNS record
- **Host/Name**: Which part of your domain (www or nothing)
- **Points to**: Where to send visitors
- **TTL**: How long to remember this (3600 = 1 hour)

---

## Timeline

```
NOW          +10 min       +1 hour        +4 hours
│             │             │              │
You start → DNS saved → Some see it → Everyone sees it
```

---

## Checklist

- [ ] Logged into Wix
- [ ] Found DNS settings
- [ ] Deleted old A records
- [ ] Added CNAME for www
- [ ] Added redirect for root
- [ ] Saved changes
- [ ] Waited patiently ☕

---

## Remember

✅ Email keeps working
✅ No downtime
✅ Can be reversed
❌ Old Wix site won't be accessible via domain