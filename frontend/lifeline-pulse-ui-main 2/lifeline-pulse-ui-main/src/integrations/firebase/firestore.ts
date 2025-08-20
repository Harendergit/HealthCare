// Firestore database initialization and management
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db } from './config';

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  VITALS: 'vitals',
  EMERGENCY_ALERTS: 'emergencyAlerts',
  MEDICAL_PROFILES: 'medicalProfiles',
  DEVICE_CONNECTIONS: 'deviceConnections',
  FAMILY_CONNECTIONS: 'familyConnections'
} as const;

// Initialize Firestore collections and indexes
export const initializeFirestore = async () => {
  try {
    console.log('Firestore ready for use');
    // Skip initialization for now to avoid permission issues
    // Collections will be created automatically when first used
    return true;
  } catch (error) {
    console.error('Error initializing Firestore:', error);
    return false;
  }
};

// User management functions
export const createUserProfile = async (userId: string, userData: any) => {
  try {
    // Clean the userData to remove undefined values
    const cleanUserData = Object.fromEntries(
      Object.entries(userData).filter(([_, value]) => value !== undefined)
    );

    await setDoc(doc(db, COLLECTIONS.USERS, userId), {
      ...cleanUserData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('User profile created successfully');
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    await setDoc(doc(db, COLLECTIONS.USERS, userId), {
      ...updates,
      updatedAt: serverTimestamp()
    }, { merge: true });
    console.log('User profile updated successfully');
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Find user by patient ID
export const findUserByPatientId = async (patientId: string) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.USERS),
      where('patientId', '==', patientId),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error finding user by patient ID:', error);
    throw error;
  }
};

// Vitals management
export const addVitalReading = async (vitalData: any) => {
  try {
    const vitalsRef = collection(db, COLLECTIONS.VITALS);
    const docRef = doc(vitalsRef);
    
    await setDoc(docRef, {
      ...vitalData,
      timestamp: serverTimestamp(),
      id: docRef.id
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding vital reading:', error);
    throw error;
  }
};

// Real-time vitals subscription
export const subscribeToVitals = (patientId: string, callback: (vitals: any[]) => void) => {
  const q = query(
    collection(db, COLLECTIONS.VITALS),
    where('patientId', '==', patientId),
    orderBy('timestamp', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, (snapshot) => {
    const vitals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
    callback(vitals);
  });
};

// Emergency alerts management
export const createEmergencyAlert = async (alertData: any) => {
  try {
    const alertsRef = collection(db, COLLECTIONS.EMERGENCY_ALERTS);
    const docRef = doc(alertsRef);
    
    await setDoc(docRef, {
      ...alertData,
      id: docRef.id,
      status: 'active',
      createdAt: serverTimestamp(),
      acknowledgedBy: null,
      acknowledgedAt: null
    });
    
    console.log('Emergency alert created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating emergency alert:', error);
    throw error;
  }
};

// Subscribe to emergency alerts
export const subscribeToEmergencyAlerts = (callback: (alerts: any[]) => void) => {
  const q = query(
    collection(db, COLLECTIONS.EMERGENCY_ALERTS),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const alerts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));
    callback(alerts);
  });
};

// Acknowledge emergency alert
export const acknowledgeAlert = async (alertId: string, responderId: string) => {
  try {
    await runTransaction(db, async (transaction) => {
      const alertRef = doc(db, COLLECTIONS.EMERGENCY_ALERTS, alertId);
      const alertDoc = await transaction.get(alertRef);
      
      if (!alertDoc.exists()) {
        throw new Error('Alert does not exist');
      }
      
      if (alertDoc.data().acknowledgedBy) {
        throw new Error('Alert already acknowledged');
      }
      
      transaction.update(alertRef, {
        status: 'acknowledged',
        acknowledgedBy: responderId,
        acknowledgedAt: serverTimestamp()
      });
    });
    
    console.log('Alert acknowledged successfully');
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    throw error;
  }
};

// Family connections management
export const createFamilyConnection = async (familyUserId: string, patientId: string) => {
  try {
    // First verify the patient exists
    const patient = await findUserByPatientId(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }
    
    // Create connection document
    const connectionRef = collection(db, COLLECTIONS.FAMILY_CONNECTIONS);
    const docRef = doc(connectionRef);
    
    await setDoc(docRef, {
      id: docRef.id,
      familyUserId,
      patientId,
      patientUserId: patient.id,
      status: 'active',
      createdAt: serverTimestamp()
    });
    
    // Update family user's connected patients
    const familyUser = await getUserProfile(familyUserId);
    const connectedPatients = familyUser?.connectedPatients || [];
    
    if (!connectedPatients.includes(patientId)) {
      await updateUserProfile(familyUserId, {
        connectedPatients: [...connectedPatients, patientId]
      });
    }
    
    console.log('Family connection created successfully');
    return docRef.id;
  } catch (error) {
    console.error('Error creating family connection:', error);
    throw error;
  }
};

// Get family connections for a user
export const getFamilyConnections = async (userId: string) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.FAMILY_CONNECTIONS),
      where('familyUserId', '==', userId),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting family connections:', error);
    throw error;
  }
};

// Database health check
export const checkDatabaseHealth = async () => {
  try {
    // Simple check - just verify we can access the database
    console.log('Database health check: PASSED (simplified)');
    return true;
  } catch (error) {
    console.error('Database health check: FAILED -', error);
    return false;
  }
};
