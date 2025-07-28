# Domain and Email Setup Guide for React Fast Training

## Overview
This guide explains how to set up your domain (reactfasttraining.co.uk) and professional email (info@reactfasttraining.co.uk).

## Understanding the Components

### 1. Website Hosting (Heroku)
- **What it is**: Heroku hosts your website files and makes them accessible on the internet
- **What it does**: Runs your website application
- **What it doesn't do**: Heroku does NOT provide domain names or email services

### 2. Domain Name (Wix)
- **What it is**: Your website address (reactfasttraining.co.uk)
- **Current location**: Currently managed through Wix
- **What you need to do**: Point it to your Heroku website

### 3. Email Service (Google Workspace)
- **What it is**: Professional email service (info@reactfasttraining.co.uk)
- **Cost**: £5.20 per user per month (as of 2024)
- **What you get**: Professional email, 30GB storage, Google apps

## Step-by-Step Setup Process

### Step 1: Set up Google Workspace for Email

1. **Go to**: https://workspace.google.com
2. **Click**: "Get started" or "Start free trial"
3. **Enter your business name**: React Fast Training
4. **Number of employees**: Just you (1)
5. **When asked about domain**:
   - Select "I have a domain"
   - Enter: reactfasttraining.co.uk
6. **Create your account**:
   - Choose your email: info@reactfasttraining.co.uk
   - Set a strong password
7. **Complete sign-up** (you'll verify domain ownership next)

### Step 2: Verify Domain Ownership in Google

Google will provide you with a TXT record to prove you own the domain:

1. **Google will show**: A verification code (looks like: google-site-verification=abc123...)
2. **Keep this page open** - you'll need this code for Wix

### Step 3: Add Google Verification in Wix

1. **Log into Wix** domain management
2. **Navigate to**: Domains → Select your domain → Advanced → Edit DNS
3. **Add TXT Record**:
   - Type: TXT
   - Host/Name: @ (or leave blank)
   - Value: [paste the Google verification code]
   - TTL: 3600 (or default)
4. **Save** the record
5. **Return to Google** and click "Verify"

### Step 4: Set Up Email (MX Records) in Wix

After verification, Google will provide MX records:

1. **In Wix DNS settings**, add these MX records:
   ```
   Priority 1:  ASPMX.L.GOOGLE.COM
   Priority 5:  ALT1.ASPMX.L.GOOGLE.COM
   Priority 5:  ALT2.ASPMX.L.GOOGLE.COM
   Priority 10: ALT3.ASPMX.L.GOOGLE.COM
   Priority 10: ALT4.ASPMX.L.GOOGLE.COM
   ```

2. **For each record**:
   - Type: MX
   - Host: @ (or leave blank)
   - Points to: [the server address above]
   - Priority: [the number shown]
   - TTL: 3600

3. **Delete** any existing MX records from Wix

### Step 5: Point Domain to Heroku Website

To connect your domain to the website:

1. **In Heroku** (I'll provide these details when ready):
   - The website will have an address like: `your-app-name.herokuapp.com`

2. **In Wix DNS settings**, add:
   - **CNAME Record**:
     - Type: CNAME
     - Host: www
     - Points to: `your-app-name.herokuapp.com` (I'll provide exact address)
   
   - **A Records** (for root domain):
     - Type: A
     - Host: @ (or leave blank)
     - Points to: (I'll provide IP addresses)

## Email Cost Clarification

**Question**: "If I want three different email addresses, will that mean that I have to pay three times?"

**Answer**: Yes, Google Workspace charges per user/email address:
- 1 email (info@): £5.20/month
- 3 emails: £15.60/month

**Alternative**: With one Google Workspace account, you can:
- Use info@reactfasttraining.co.uk as your main email
- Set up free aliases (like lex@ or bookings@) that forward to info@
- This way you only pay for one account but can receive emails at multiple addresses

## What You Need From Me

Please let me know:
1. Do you want me to help directly? (You'd need to share Wix login temporarily)
2. Or shall I guide you through each step?
3. Do you want just info@ or multiple separate email accounts?

## Timeline

- Domain verification: 5-30 minutes
- Email setup: 1-2 hours to fully propagate
- Domain pointing: 24-48 hours to fully propagate worldwide

## Next Steps

1. Decide on email setup (one account with aliases vs. multiple accounts)
2. Start Google Workspace signup
3. I'll provide the exact Heroku details when the site is ready to deploy

Let me know if you have any questions!