# Firestore Security Rules Guide

## 📋 Overview

The `firestore.rules` file contains comprehensive security rules for the LifeLine360 healthcare application. These rules ensure proper access control based on user roles and data ownership.

## 🔐 Security Model

### User Roles
- **Patient**: Can manage their own health data and vitals
- **Family**: Can view connected patients' data
- **Responder**: Can access emergency data for all patients

### Access Patterns
- **Ownership-based**: Users can access their own data
- **Role-based**: Different permissions based on user role
- **Relationship-based**: Family members access through connections
- **Emergency-based**: Responders have broad read access

## 📊 Collection Rules Summary

### 1. Users Collection (`/users/{userId}`)
- ✅ **Read/Write**: Own profile only
- ✅ **Read**: Responders can read all profiles
- ✅ **Read**: Limited fields for family connections

### 2. Vitals Collection (`/vitals/{vitalId}`)
- ✅ **Write**: Patients can write their own vitals
- ✅ **Read**: Patients read own vitals
- ✅ **Read**: Family members read connected patients' vitals
- ✅ **Read**: Responders read all vitals

### 3. Emergency Alerts (`/emergencyAlerts/{alertId}`)
- ✅ **Create**: System can create alerts
- ✅ **Read/Update**: Responders manage alerts
- ✅ **Read**: Family members read connected patients' alerts
- ✅ **Read**: Patients read their own alerts

### 4. Family Connections (`/familyConnections/{connectionId}`)
- ✅ **Create**: Family members create connections
- ✅ **Read**: Family members and patients read their connections
- ✅ **Update**: Family members update own connections
- ✅ **Read**: Responders read all connections

### 5. Medical Profiles (`/medicalProfiles/{profileId}`)
- ✅ **Create/Update**: Patients manage own profiles
- ✅ **Read**: Patients read own profiles
- ✅ **Read**: Family members read connected patients' profiles
- ✅ **Read**: Responders read all profiles

### 6. Device Connections (`/deviceConnections/{connectionId}`)
- ✅ **Read/Write**: Users manage own device connections
- ✅ **Read**: Responders read all device connections

## 🚀 How to Apply Rules

### Method 1: Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `life-line-9ad7e`
3. Navigate to **Firestore Database**
4. Click on the **Rules** tab
5. Copy the contents of `firestore.rules`
6. Paste into the rules editor
7. Click **Publish**

### Method 2: Firebase CLI
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

### Method 3: Manual Copy-Paste
1. Open the `firestore.rules` file
2. Copy all contents
3. Paste into Firebase Console Rules editor
4. Publish the rules

## 🧪 Testing Rules

### Test Cases to Verify

#### Patient Role Tests
```javascript
// Patient can read their own vitals
match /vitals/{vitalId} where resource.data.patientId == auth.uid

// Patient cannot read other patients' vitals
match /vitals/{vitalId} where resource.data.patientId != auth.uid
```

#### Family Role Tests
```javascript
// Family can read connected patient's vitals
match /vitals/{vitalId} where exists(familyConnection)

// Family cannot read unconnected patient's vitals
match /vitals/{vitalId} where !exists(familyConnection)
```

#### Responder Role Tests
```javascript
// Responder can read all emergency alerts
match /emergencyAlerts/{alertId}

// Responder can update alert status
match /emergencyAlerts/{alertId} with update operation
```

### Using Firebase Rules Playground
1. Go to Firebase Console → Firestore → Rules
2. Click **Rules Playground**
3. Test different scenarios:
   - User roles
   - Document access
   - Read/write operations

## 🔧 Rule Customization

### Adding New Collections
```javascript
// Template for new collection
match /newCollection/{documentId} {
  // Define access rules based on your needs
  allow read: if isAuthenticated();
  allow write: if isOwner(resource.data.userId);
}
```

### Modifying Existing Rules
1. **Always test changes** in Rules Playground first
2. **Deploy incrementally** to avoid breaking existing functionality
3. **Monitor logs** for rule violations after deployment

### Common Patterns
```javascript
// Ownership check
allow read, write: if request.auth.uid == resource.data.userId;

// Role-based access
allow read: if getUserData().role == 'responder';

// Time-based access
allow read: if request.time < resource.data.expiresAt;

// Field-level validation
allow write: if request.resource.data.keys().hasAll(['required', 'fields']);
```

## 🚨 Security Best Practices

### 1. Principle of Least Privilege
- Grant minimum necessary permissions
- Use specific conditions rather than broad access
- Regularly review and audit rules

### 2. Data Validation
```javascript
// Validate required fields
allow create: if request.resource.data.keys().hasAll(['patientId', 'timestamp']);

// Validate data types
allow write: if request.resource.data.heartRate is number;

// Validate value ranges
allow write: if request.resource.data.heartRate >= 30 && 
                request.resource.data.heartRate <= 200;
```

### 3. Rate Limiting (Application Level)
- Implement rate limiting in application code
- Monitor for unusual access patterns
- Set up alerts for rule violations

### 4. Audit Logging
```javascript
// Log all access attempts
match /auditLogs/{logId} {
  allow create: if isAuthenticated();
  allow read: if isResponder();
}
```

## 📊 Monitoring and Maintenance

### 1. Monitor Rule Performance
- Check Firebase Console → Firestore → Usage
- Look for rule evaluation metrics
- Optimize complex rules if needed

### 2. Security Monitoring
- Set up alerts for rule violations
- Monitor unusual access patterns
- Regular security audits

### 3. Rule Updates
- Version control your rules
- Test changes thoroughly
- Document rule changes
- Gradual rollout for major changes

## 🆘 Troubleshooting

### Common Issues

#### Permission Denied Errors
```
Error: Missing or insufficient permissions
```
**Solution**: Check if user has correct role and document ownership

#### Rule Evaluation Timeout
```
Error: Rule evaluation took too long
```
**Solution**: Simplify complex rules, reduce nested function calls

#### Invalid Rule Syntax
```
Error: Syntax error in rules
```
**Solution**: Validate syntax in Rules Playground before deployment

### Debug Tips
1. Use `console.log()` equivalent: `debug()` function in rules
2. Test with different user roles in Rules Playground
3. Check Firebase Console logs for detailed error messages
4. Verify user authentication state

## 📝 Rule Documentation

### Helper Functions
- `isAuthenticated()`: Check if user is logged in
- `getUserData()`: Get current user's profile data
- `hasRole(role)`: Check if user has specific role
- `isOwner(userId)`: Check if user owns the document

### Security Considerations
- All rules require authentication except health checks
- Responders have broad read access for emergency response
- Family connections are validated through relationship documents
- Audit trails are maintained for compliance

---

**Important**: Always test rules thoroughly before deploying to production. Healthcare data requires strict security compliance.
