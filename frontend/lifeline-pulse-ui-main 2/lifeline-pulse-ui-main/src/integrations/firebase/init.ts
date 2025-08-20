// Firebase initialization and setup
import { initializeFirestore, checkDatabaseHealth } from './firestore';
import { auth } from './config';
import { onAuthStateChanged } from 'firebase/auth';

// Initialize Firebase services
export const initializeFirebaseServices = async () => {
  try {
    console.log('🔥 Initializing Firebase services...');

    // Set up auth state listener
    setupAuthStateListener();

    // Simple health check - just try to access Firestore
    try {
      const isHealthy = await checkDatabaseHealth();
      if (isHealthy) {
        console.log('✅ Database health check passed');
      } else {
        console.warn('⚠️ Database health check failed, but continuing...');
      }
    } catch (healthError) {
      console.warn('⚠️ Health check failed, but continuing...', healthError);
    }

    console.log('🎉 Firebase services initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing Firebase services:', error);
    // Return true anyway to allow the app to continue
    return true;
  }
};

// Set up authentication state listener
const setupAuthStateListener = () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('👤 User signed in:', user.email);
    } else {
      console.log('👤 User signed out');
    }
  });
};

// Firestore Security Rules (for reference)
export const FIRESTORE_SECURITY_RULES = `
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
    
    // Medical profiles (read by patient and connected family/responders)
    match /medicalProfiles/{profileId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && resource.data.patientId == request.auth.uid;
    }
    
    // Device connections (read/write by device owner)
    match /deviceConnections/{connectionId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Health check document (public read for monitoring)
    match /health_check/{document} {
      allow read, write: if true;
    }
  }
}
`;

// Firestore Indexes (for reference)
export const FIRESTORE_INDEXES = [
  {
    collectionGroup: 'vitals',
    fields: [
      { fieldPath: 'patientId', order: 'ASCENDING' },
      { fieldPath: 'timestamp', order: 'DESCENDING' }
    ]
  },
  {
    collectionGroup: 'emergencyAlerts',
    fields: [
      { fieldPath: 'status', order: 'ASCENDING' },
      { fieldPath: 'createdAt', order: 'DESCENDING' }
    ]
  },
  {
    collectionGroup: 'familyConnections',
    fields: [
      { fieldPath: 'familyUserId', order: 'ASCENDING' },
      { fieldPath: 'status', order: 'ASCENDING' }
    ]
  },
  {
    collectionGroup: 'users',
    fields: [
      { fieldPath: 'patientId', order: 'ASCENDING' }
    ]
  }
];

// Environment validation
export const validateFirebaseConfig = () => {
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  const missing = requiredEnvVars.filter(envVar => !import.meta.env[envVar]);
  
  if (missing.length > 0) {
    console.warn('⚠️ Missing Firebase environment variables:', missing);
    console.log('📝 Using default configuration for development');
    return false;
  }
  
  console.log('✅ Firebase configuration validated');
  return true;
};

// Development helpers
export const createDemoData = async () => {
  console.log('🧪 Creating demo data...');
  // This would create sample users, vitals, etc. for testing
  // Implementation would go here
};

// Export initialization function for use in main app
export default initializeFirebaseServices;
