# LifeLine360 - Troubleshooting Guide

## 🔧 Common Issues and Solutions

### 1. App Stuck at Loading Screen

**Symptoms:**
- App shows "Initializing healthcare services..." indefinitely
- White screen with loading spinner

**Solutions:**
1. **Check Browser Console** (F12 → Console tab)
   - Look for Firebase initialization errors
   - Check for network connectivity issues

2. **Verify Firebase Configuration**
   - Ensure `.env` file exists with correct Firebase credentials
   - Check that Firebase project is properly configured

3. **Clear Browser Cache**
   - Hard refresh: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
   - Clear browser cache and cookies

### 2. Firebase Authentication Errors

**Error:** `auth/configuration-not-found`
**Solution:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `life-line-9ad7e`
3. Navigate to Authentication → Sign-in method
4. Enable Email/Password authentication

**Error:** `auth/project-not-found`
**Solution:**
1. Verify the project ID in `.env` file
2. Ensure you have access to the Firebase project

### 3. Firestore Database Errors

**Error:** `firestore/permission-denied`
**Solution:**
1. Create Firestore database in Firebase Console
2. Start in "test mode" for development
3. Apply proper security rules (see FIREBASE_SETUP.md)

**Error:** `firestore/unavailable`
**Solution:**
1. Check internet connectivity
2. Verify Firestore is enabled in Firebase Console
3. Check if you've exceeded quota limits

### 4. Bluetooth Connection Issues

**Error:** `Bluetooth not supported`
**Solution:**
1. Use Chrome, Edge, or Opera browser
2. Ensure HTTPS connection (required for Web Bluetooth)
3. Check if Bluetooth is enabled on your device

**Error:** `Device connection failed`
**Solution:**
1. Ensure device is in pairing mode
2. Check device compatibility
3. Try refreshing the page and reconnecting

### 5. Development Server Issues

**Error:** `EADDRINUSE` (Port already in use)
**Solution:**
```bash
# Kill process using port 8080
npx kill-port 8080

# Or use a different port
npm run dev -- --port 3000
```

**Error:** Module resolution errors
**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### 6. Build/Deployment Issues

**Error:** Build fails with TypeScript errors
**Solution:**
1. Check for missing type definitions
2. Verify all imports are correct
3. Run type checking: `npx tsc --noEmit`

**Error:** Environment variables not working in production
**Solution:**
1. Ensure variables start with `VITE_`
2. Set environment variables in your hosting platform
3. Rebuild the application after adding variables

## 🔍 Debugging Steps

### Step 1: Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for error messages (red text)
4. Note any Firebase or network errors

### Step 2: Verify Firebase Setup
1. Check `.env` file exists and has correct values
2. Verify Firebase project is accessible
3. Ensure Authentication and Firestore are enabled

### Step 3: Test Network Connectivity
1. Check if you can access Firebase Console
2. Verify internet connection is stable
3. Check if corporate firewall blocks Firebase

### Step 4: Clear Application Data
1. Open Developer Tools → Application tab
2. Clear Local Storage, Session Storage, and IndexedDB
3. Hard refresh the page

## 📞 Getting Help

### Before Reporting Issues:
1. Check this troubleshooting guide
2. Look at browser console for errors
3. Try the debugging steps above
4. Note your browser version and OS

### Information to Include:
- Browser and version
- Operating system
- Error messages from console
- Steps to reproduce the issue
- Screenshots if applicable

### Quick Fixes Checklist:
- [ ] Browser console shows no errors
- [ ] Firebase Authentication is enabled
- [ ] Firestore database is created
- [ ] `.env` file has correct Firebase config
- [ ] Internet connection is stable
- [ ] Using supported browser (Chrome/Edge/Opera)
- [ ] Page hard refreshed (Ctrl+F5)

## 🚀 Performance Tips

### For Better Performance:
1. **Use Chrome or Edge** for best Web Bluetooth support
2. **Enable hardware acceleration** in browser settings
3. **Close unnecessary tabs** to free up memory
4. **Use stable internet connection** for real-time features

### For Development:
1. **Use React DevTools** for debugging components
2. **Monitor Network tab** for API calls
3. **Check Firebase Console** for database activity
4. **Use browser's device simulation** for mobile testing

---

**Note**: This is a development application. For production use, additional security measures and error handling should be implemented.
