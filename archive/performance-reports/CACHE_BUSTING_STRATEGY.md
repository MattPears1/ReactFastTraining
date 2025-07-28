# Cache Busting Strategy for Apple Devices

## Overview
This document outlines the comprehensive cache-busting strategy implemented to prevent aggressive caching issues, particularly on Apple devices (iPhone, iPad, MacBook).

## Implemented Solutions

### 1. Automatic Version Bumping
- **Script**: `scripts/bump-version.js`
- **Trigger**: Every build automatically increments patch version
- **Purpose**: Forces browsers to recognize new deployment

```bash
# Manual version bump
npm run version:bump

# Build with auto version bump
npm run build
npm run build:prod
```

### 2. Timestamp-Based Chunk Naming
- **Location**: `vite.config.ts`
- **Implementation**: All JS/CSS files include build timestamp
- **Example**: `main-1706123456789-abc123.js`

### 3. HTTP Cache Control Headers
- **Location**: `index.html`
- **Headers Applied**:
  - `Cache-Control: no-cache, no-store, must-revalidate`
  - `Pragma: no-cache`
  - `Expires: Thu, 01 Dec 1994 16:00:00 GMT`

### 4. Version Information Injection
- **Script**: `scripts/inject-version.js`
- **Environment Variables**:
  - `VITE_APP_VERSION`: Current package version
  - `VITE_BUILD_TIME`: ISO timestamp of build
  - `VITE_BUILD_TIMESTAMP`: Unix timestamp for unique builds

### 5. Visual Version Indicator
- **Component**: `VersionInfo.tsx`
- **Visibility**: Development mode + `?version=1` in production
- **Purpose**: Verify correct version is deployed

## File Naming Strategy

### Before Cache Busting
```
main.js
vendor.js
style.css
```

### After Cache Busting
```
main-1706123456789-abc123.js
vendor-1706123456789-def456.js
style-1706123456789-ghi789.css
```

## Build Process Flow

```bash
1. npm run build
   ↓
2. Bump version (1.0.0 → 1.0.1)
   ↓
3. Inject version into .env.local
   ↓
4. Vite build with timestamp chunk names
   ↓
5. Deploy with unique file names
```

## Verification Steps

### 1. Check Version Deployment
```bash
# Visit in browser with version flag
https://reactfasttraining.co.uk/?version=1
```

### 2. Network Tab Verification
- All JS/CSS files should have unique timestamps
- No 304 (Not Modified) responses on first load after deployment
- File names change with each build

### 3. Apple Device Testing
```bash
# Clear Safari cache
Settings → Safari → Clear History and Website Data

# Force refresh
Command + Shift + R (Safari)
Command + Option + R (Chrome)
```

## Emergency Cache Clear

If users still see old content:

### For Users
1. **iPhone/iPad**: Settings → Safari → Clear History and Website Data
2. **Mac Safari**: Command + Option + E, then Command + R
3. **Chrome**: Command + Shift + Delete, select "All time"

### For Developers
```bash
# Force build new version
npm run build:prod

# Check deployed files have new timestamps
curl -I https://reactfasttraining.co.uk/
```

## Monitoring

### Version Tracking
- Check console for version logs in development
- Monitor version indicator in bottom-right corner
- Compare deployed version with package.json

### Build Verification
```bash
# Check if version was bumped
git log --oneline -5

# Verify environment injection
cat .env.local
```

## Troubleshooting

### Issue: Users Still See Old Version
1. Check if version was actually bumped
2. Verify unique chunk names in Network tab
3. Check if CDN/proxy is caching (currently none)
4. Force users to clear cache

### Issue: Build Fails
1. Check if scripts are executable: `chmod +x scripts/*.js`
2. Verify Node.js version compatibility
3. Check for package.json corruption

### Issue: Version Not Displaying
1. Verify `VersionInfo` component is imported
2. Check environment variables in browser dev tools
3. Add `?version=1` to URL in production

## Best Practices

1. **Always use `npm run build` for production deployments**
2. **Never use `npm run build:no-bump` for production**
3. **Test on multiple devices after deployment**
4. **Monitor user reports of "old website" issues**
5. **Document version changes in commit messages**

## Files Modified

- `vite.config.ts` - Chunk naming with timestamps
- `package.json` - Build scripts with version bumping
- `index.html` - Cache control headers
- `scripts/bump-version.js` - Automatic version incrementing
- `scripts/inject-version.js` - Version environment injection
- `src/components/common/VersionInfo.tsx` - Version display
- `src/App.tsx` - Version info integration

## No Service Workers Policy

**CRITICAL**: This project has NO service workers, PWA functionality, or client-side caching as per project requirements. All caching prevention is handled through:
- HTTP headers
- Unique file naming
- Version bumping
- Browser cache control directives

This ensures maximum compatibility with Apple devices and prevents aggressive caching issues.