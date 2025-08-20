import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  User,
  updateProfile
} from 'firebase/auth';
import { auth } from './config';
import {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  findUserByPatientId,
  createFamilyConnection
} from './firestore';

export type UserRole = 'patient' | 'family' | 'responder';

export interface UserData {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  patientId?: string; // For patients only, this is their unique ID
  connectedPatients?: string[]; // For family members only, list of patient IDs they're connected to
  createdAt: Date;
  updatedAt: Date;
}

// Generate unique patient ID
const generatePatientId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `P-${timestamp}-${randomStr}`.toUpperCase();
};

// Sign up new user
export const signUpUser = async (
  email: string, 
  password: string, 
  role: UserRole, 
  displayName?: string
): Promise<UserData> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile with display name
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    // Generate patient ID for patients
    const patientId = role === 'patient' ? generatePatientId() : null;

    // Create user document in Firestore
    const userData: UserData = {
      uid: user.uid,
      email: user.email!,
      role,
      displayName: displayName || user.displayName || '',
      ...(role === 'patient' && { patientId }),
      ...(role === 'family' && { connectedPatients: [] }),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await createUserProfile(user.uid, userData);

    return userData;
  } catch (error) {
    console.error('Error signing up user:', error);
    throw error;
  }
};

// Sign in user
export const signInUser = async (email: string, password: string): Promise<UserData> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user data from Firestore
    const userData = await getUserProfile(user.uid);
    if (!userData) {
      throw new Error('User data not found');
    }

    return userData as UserData;
  } catch (error) {
    console.error('Error signing in user:', error);
    throw error;
  }
};

// Sign out user
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out user:', error);
    throw error;
  }
};

// Get current user data
export const getCurrentUserData = async (): Promise<UserData | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const userData = await getUserProfile(user.uid);
    return userData as UserData | null;
  } catch (error) {
    console.error('Error getting current user data:', error);
    return null;
  }
};

// Connect family member to patient
export const connectFamilyToPatient = async (familyUid: string, patientId: string): Promise<void> => {
  try {
    // Use the new Firestore function
    await createFamilyConnection(familyUid, patientId);
  } catch (error) {
    console.error('Error connecting family to patient:', error);
    throw error;
  }
};
