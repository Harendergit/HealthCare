# Firebase Setup Guide for LifeLine360

This guide will help you set up Firebase for the LifeLine360 healthcare emergency app.

## 🔥 Firebase Project Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `life-line-9ad7e` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** provider
3. Click "Save"

### 3. Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose **Start in test mode** (we'll add security rules later)
4. Select your preferred location
5. Click "Done"

### 4. Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon (`</>`)
4. Register app with nickname: "lifeline-pulse-ui"
5. Copy the configuration object

## 🔧 Application Configuration

### 1. Environment Variables

Create a `.env` file in the project root:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyBovot4J8xzHlDwQfRheQ4amC79A-o84tQ
VITE_FIREBASE_AUTH_DOMAIN=life-line-9ad7e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=life-line-9ad7e
VITE_FIREBASE_STORAGE_BUCKET=life-line-9ad7e.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=454696338577
VITE_FIREBASE_APP_ID=1:454696338577:web:160dfc025800221a98eb30
VITE_FIREBASE_MEASUREMENT_ID=G-HS49F876XS
```

### 2. Firestore Security Rules

Replace the default rules in Firebase Console > Firestore > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Vitals can be read by patient and connected family members
    match /vitals/{vitalId} {
      allow read: if request.auth != null && (
        resource.data.patientId == request.auth.uid ||
        exists(/databases/$(database)/documents/familyConnections/$(request.auth.uid + '_' + resource.data.patientId))
      );
      allow write: if request.auth != null && resource.data.patientId == request.auth.uid;
    }
    
    // Emergency alerts can be read by responders and related family members
    match /emergencyAlerts/{alertId} {
      allow read: if request.auth != null && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'responder' ||
        exists(/databases/$(database)/documents/familyConnections/$(request.auth.uid + '_' + resource.data.patientId))
      );
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'responder';
    }
    
    // Family connections
    match /familyConnections/{connectionId} {
      allow read, write: if request.auth != null && (
        resource.data.familyUserId == request.auth.uid ||
        resource.data.patientUserId == request.auth.uid
      );
    }
    
    // Medical profiles
    match /medicalProfiles/{profileId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && resource.data.patientId == request.auth.uid;
    }
    
    // Device connections
    match /deviceConnections/{connectionId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Health check (for monitoring)
    match /health_check/{document} {
      allow read, write: if true;
    }
  }
}
```

### 3. Firestore Indexes

Create these indexes in Firebase Console > Firestore > Indexes:

#### Composite Indexes

1. **Vitals by Patient and Time**
   - Collection: `vitals`
   - Fields: `patientId` (Ascending), `timestamp` (Descending)

2. **Emergency Alerts by Status and Time**
   - Collection: `emergencyAlerts`
   - Fields: `status` (Ascending), `createdAt` (Descending)

3. **Family Connections by User and Status**
   - Collection: `familyConnections`
   - Fields: `familyUserId` (Ascending), `status` (Ascending)

#### Single Field Indexes

1. **Users by Patient ID**
   - Collection: `users`
   - Field: `patientId` (Ascending)

## 🚀 Testing the Setup

### 1. Start the Application

```bash
npm run dev
```

### 2. Check Console Logs

Look for these messages in the browser console:
- ✅ Firebase services initialized successfully
- ✅ Database health check passed

### 3. Test User Registration

1. Open the app in your browser
2. Select a role (Patient, Family, or Responder)
3. Fill in the signup form
4. Check Firebase Console > Authentication to see the new user
5. Check Firestore > Data to see the user document

### 4. Test Vitals (Patient Role)

1. Sign up as a Patient
2. Note your Patient ID in the dashboard
3. Use the demo controls to add vitals
4. Check Firestore > Data > vitals collection

### 5. Test Family Connection

1. Sign up as a Family member
2. Use the Patient ID from step 4.2 to connect
3. Verify the connection in Firestore > familyConnections

## 🔒 Security Considerations

### Production Security Rules

For production, consider these additional security measures:

1. **Rate Limiting**: Implement rate limiting for vital readings
2. **Data Validation**: Add server-side validation functions
3. **Audit Logging**: Track all data access and modifications
4. **Encryption**: Enable field-level encryption for sensitive data

### HIPAA Compliance

For healthcare applications, ensure:

1. **Business Associate Agreement** with Google Cloud
2. **Data Encryption** at rest and in transit
3. **Access Logging** and monitoring
4. **User Authentication** with strong passwords
5. **Data Retention** policies

## 🛠️ Troubleshooting

### Common Issues

1. **"Permission denied" errors**
   - Check Firestore security rules
   - Verify user authentication
   - Ensure proper role assignments

2. **"Index not found" errors**
   - Create the required composite indexes
   - Wait for index creation to complete

3. **Environment variables not loading**
   - Ensure `.env` file is in project root
   - Restart the development server
   - Check variable names start with `VITE_`

4. **Firebase initialization errors**
   - Verify Firebase configuration
   - Check network connectivity
   - Review browser console for detailed errors

### Debug Mode

Enable debug logging by adding to your `.env`:

```env
VITE_FIREBASE_DEBUG=true
```

## 📊 Monitoring

### Firebase Console Monitoring

Monitor your app in Firebase Console:

1. **Authentication** - User signups and logins
2. **Firestore** - Database usage and performance
3. **Analytics** - User engagement (if enabled)

### Application Monitoring

The app includes built-in health checks:
- Database connectivity
- Authentication status
- Real-time data synchronization

## 🔄 Backup and Recovery

### Automated Backups

Set up automated Firestore backups:

1. Go to Firebase Console > Firestore
2. Click "Backup" tab
3. Create backup schedule
4. Configure retention policy

### Data Export

For manual backups:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Export Firestore data
firebase firestore:export gs://your-bucket-name/backup-folder
```

---

**Note**: This setup guide is for the specific Firebase project configuration provided. Adjust the configuration values according to your actual Firebase project settings.
