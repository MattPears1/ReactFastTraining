# Heroku Domain Configuration Guide

## For the Developer - Setting up reactfasttraining.co.uk on Heroku

### Prerequisites
- Heroku CLI installed
- Access to the Heroku app
- Domain DNS configured in Wix (see DNS_SETUP_INSTRUCTIONS_FOR_LEX.md)

---

## Step 1: Add Custom Domain to Heroku

### Via Heroku CLI:
```bash
# Add the root domain
heroku domains:add reactfasttraining.co.uk -a YOUR-APP-NAME

# Add the www subdomain
heroku domains:add www.reactfasttraining.co.uk -a YOUR-APP-NAME
```

### Via Heroku Dashboard:
1. Log into [dashboard.heroku.com](https://dashboard.heroku.com)
2. Select your app
3. Go to **Settings** tab
4. Scroll to **Domains** section
5. Click **Add domain**
6. Add both:
   - `reactfasttraining.co.uk`
   - `www.reactfasttraining.co.uk`

---

## Step 2: Get DNS Target

After adding domains, Heroku will provide DNS targets:

```bash
# View your domains and their DNS targets
heroku domains -a YOUR-APP-NAME
```

You'll see something like:
```
=== YOUR-APP-NAME Heroku Domain
YOUR-APP-NAME.herokuapp.com

=== YOUR-APP-NAME Custom Domains
Domain Name                    DNS Record Type  DNS Target
reactfasttraining.co.uk       ALIAS or ANAME   example-12345.herokudns.com
www.reactfasttraining.co.uk   CNAME           example-12345.herokudns.com
```

---

## Step 3: SSL Certificate

Heroku automatically provisions SSL certificates for custom domains using ACM (Automated Certificate Management).

Check SSL status:
```bash
heroku certs:auto -a YOUR-APP-NAME
```

---

## Step 4: Configure App for Production

### Environment Variables
Set production environment variables:
```bash
heroku config:set NODE_ENV=production -a YOUR-APP-NAME
heroku config:set VITE_API_URL=https://reactfasttraining.co.uk -a YOUR-APP-NAME
heroku config:set VITE_SITE_URL=https://reactfasttraining.co.uk -a YOUR-APP-NAME
```

### Update Email Settings
```bash
heroku config:set EMAIL_FROM="React Fast Training <info@reactfasttraining.co.uk>" -a YOUR-APP-NAME
heroku config:set FRONTEND_URL=https://reactfasttraining.co.uk -a YOUR-APP-NAME
```

---

## Step 5: Force HTTPS Redirect

Ensure your app forces HTTPS. In your backend code:

### For Express/LoopBack:
```javascript
// Add this middleware
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

---

## Step 6: Update CORS Settings

Update CORS to accept the new domain:
```javascript
const corsOptions = {
  origin: [
    'https://reactfasttraining.co.uk',
    'https://www.reactfasttraining.co.uk',
    'http://localhost:3000' // for development
  ],
  credentials: true
};
```

---

## Information to Send to Lex

After setting up Heroku, provide Lex with:

1. **DNS Target**: The `herokudns.com` address from Step 2
2. **Confirmation**: That the app is ready to receive traffic
3. **Testing URL**: The `.herokuapp.com` URL to test before DNS changes

Example message:
```
Hi Lex,

The new site is ready on Heroku. For the DNS setup, you'll need:

DNS Target: example-12345.herokudns.com
Current test URL: https://YOUR-APP-NAME.herokuapp.com

Please use the instructions in the document to update the DNS settings in Wix.
```

---

## Post-Deployment Checklist

- [ ] Custom domains added to Heroku
- [ ] SSL certificate provisioned
- [ ] Environment variables updated
- [ ] HTTPS redirect configured
- [ ] CORS settings updated
- [ ] Email settings point to correct domain
- [ ] Tested on .herokuapp.com URL
- [ ] Provided DNS target to domain owner

---

## Monitoring After Go-Live

```bash
# Check domain status
heroku domains -a YOUR-APP-NAME

# View logs
heroku logs --tail -a YOUR-APP-NAME

# Check SSL status
heroku certs:auto -a YOUR-APP-NAME
```

---

## Rollback Plan

If issues arise:
1. Lex can revert DNS settings in Wix to original values
2. Site will return to Wix hosting within 1-4 hours
3. No data loss as this only affects routing

---

*Document created for deploying reactfasttraining.co.uk to Heroku*