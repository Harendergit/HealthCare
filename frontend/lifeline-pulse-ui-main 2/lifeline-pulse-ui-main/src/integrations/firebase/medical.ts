// Medical Profile Management System
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './config';

export interface MedicalProfile {
  id?: string;
  patientId: string;
  bloodType?: string;
  allergies: string[];
  medications: Medication[];
  medicalConditions: string[];
  emergencyContacts: EmergencyContact[];
  insuranceInfo?: InsuranceInfo;
  physicianInfo?: PhysicianInfo;
  medicalHistory: MedicalHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  startDate: Date;
  endDate?: Date;
  notes?: string;
  active: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  isPrimary: boolean;
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  memberName: string;
  effectiveDate: Date;
  expirationDate?: Date;
}

export interface PhysicianInfo {
  name: string;
  specialty: string;
  phoneNumber: string;
  email?: string;
  address: string;
  hospitalAffiliation?: string;
}

export interface MedicalHistoryEntry {
  id: string;
  date: Date;
  type: 'diagnosis' | 'procedure' | 'hospitalization' | 'surgery' | 'test';
  description: string;
  provider: string;
  notes?: string;
}

// Medical Profile Management
export const createMedicalProfile = async (profileData: Omit<MedicalProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'medicalProfiles'), {
      ...profileData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('Medical profile created successfully');
    return docRef.id;
  } catch (error) {
    console.error('Error creating medical profile:', error);
    throw error;
  }
};

export const getMedicalProfile = async (patientId: string): Promise<MedicalProfile | null> => {
  try {
    const q = query(
      collection(db, 'medicalProfiles'),
      where('patientId', '==', patientId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as MedicalProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting medical profile:', error);
    throw error;
  }
};

export const updateMedicalProfile = async (profileId: string, updates: Partial<MedicalProfile>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'medicalProfiles', profileId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    console.log('Medical profile updated successfully');
  } catch (error) {
    console.error('Error updating medical profile:', error);
    throw error;
  }
};

// Medication Management
export const addMedication = async (patientId: string, medication: Omit<Medication, 'id'>): Promise<string> => {
  try {
    const profile = await getMedicalProfile(patientId);
    if (!profile) {
      throw new Error('Medical profile not found');
    }

    const newMedication: Medication = {
      ...medication,
      id: generateId()
    };

    const updatedMedications = [...profile.medications, newMedication];
    
    await updateMedicalProfile(profile.id!, { medications: updatedMedications });
    return newMedication.id;
  } catch (error) {
    console.error('Error adding medication:', error);
    throw error;
  }
};

export const updateMedication = async (patientId: string, medicationId: string, updates: Partial<Medication>): Promise<void> => {
  try {
    const profile = await getMedicalProfile(patientId);
    if (!profile) {
      throw new Error('Medical profile not found');
    }

    const updatedMedications = profile.medications.map(med => 
      med.id === medicationId ? { ...med, ...updates } : med
    );
    
    await updateMedicalProfile(profile.id!, { medications: updatedMedications });
  } catch (error) {
    console.error('Error updating medication:', error);
    throw error;
  }
};

export const removeMedication = async (patientId: string, medicationId: string): Promise<void> => {
  try {
    const profile = await getMedicalProfile(patientId);
    if (!profile) {
      throw new Error('Medical profile not found');
    }

    const updatedMedications = profile.medications.filter(med => med.id !== medicationId);
    
    await updateMedicalProfile(profile.id!, { medications: updatedMedications });
  } catch (error) {
    console.error('Error removing medication:', error);
    throw error;
  }
};

// Emergency Contact Management
export const addEmergencyContact = async (patientId: string, contact: Omit<EmergencyContact, 'id'>): Promise<string> => {
  try {
    const profile = await getMedicalProfile(patientId);
    if (!profile) {
      throw new Error('Medical profile not found');
    }

    const newContact: EmergencyContact = {
      ...contact,
      id: generateId()
    };

    const updatedContacts = [...profile.emergencyContacts, newContact];
    
    await updateMedicalProfile(profile.id!, { emergencyContacts: updatedContacts });
    return newContact.id;
  } catch (error) {
    console.error('Error adding emergency contact:', error);
    throw error;
  }
};

export const updateEmergencyContact = async (patientId: string, contactId: string, updates: Partial<EmergencyContact>): Promise<void> => {
  try {
    const profile = await getMedicalProfile(patientId);
    if (!profile) {
      throw new Error('Medical profile not found');
    }

    const updatedContacts = profile.emergencyContacts.map(contact => 
      contact.id === contactId ? { ...contact, ...updates } : contact
    );
    
    await updateMedicalProfile(profile.id!, { emergencyContacts: updatedContacts });
  } catch (error) {
    console.error('Error updating emergency contact:', error);
    throw error;
  }
};

export const removeEmergencyContact = async (patientId: string, contactId: string): Promise<void> => {
  try {
    const profile = await getMedicalProfile(patientId);
    if (!profile) {
      throw new Error('Medical profile not found');
    }

    const updatedContacts = profile.emergencyContacts.filter(contact => contact.id !== contactId);
    
    await updateMedicalProfile(profile.id!, { emergencyContacts: updatedContacts });
  } catch (error) {
    console.error('Error removing emergency contact:', error);
    throw error;
  }
};

// Medical History Management
export const addMedicalHistoryEntry = async (patientId: string, entry: Omit<MedicalHistoryEntry, 'id'>): Promise<string> => {
  try {
    const profile = await getMedicalProfile(patientId);
    if (!profile) {
      throw new Error('Medical profile not found');
    }

    const newEntry: MedicalHistoryEntry = {
      ...entry,
      id: generateId()
    };

    const updatedHistory = [...profile.medicalHistory, newEntry];
    
    await updateMedicalProfile(profile.id!, { medicalHistory: updatedHistory });
    return newEntry.id;
  } catch (error) {
    console.error('Error adding medical history entry:', error);
    throw error;
  }
};

// Utility Functions
const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const validateMedicalProfile = (profile: Partial<MedicalProfile>): string[] => {
  const errors: string[] = [];
  
  if (!profile.patientId) {
    errors.push('Patient ID is required');
  }
  
  if (profile.emergencyContacts && profile.emergencyContacts.length === 0) {
    errors.push('At least one emergency contact is required');
  }
  
  if (profile.emergencyContacts) {
    profile.emergencyContacts.forEach((contact, index) => {
      if (!contact.name) {
        errors.push(`Emergency contact ${index + 1}: Name is required`);
      }
      if (!contact.phoneNumber) {
        errors.push(`Emergency contact ${index + 1}: Phone number is required`);
      }
    });
  }
  
  return errors;
};

export const formatMedicalProfile = (profile: MedicalProfile): string => {
  const sections = [];
  
  if (profile.bloodType) {
    sections.push(`Blood Type: ${profile.bloodType}`);
  }
  
  if (profile.allergies.length > 0) {
    sections.push(`Allergies: ${profile.allergies.join(', ')}`);
  }
  
  if (profile.medications.length > 0) {
    const activeMeds = profile.medications.filter(med => med.active);
    if (activeMeds.length > 0) {
      sections.push(`Medications: ${activeMeds.map(med => `${med.name} (${med.dosage})`).join(', ')}`);
    }
  }
  
  if (profile.medicalConditions.length > 0) {
    sections.push(`Medical Conditions: ${profile.medicalConditions.join(', ')}`);
  }
  
  return sections.join('\n');
};
