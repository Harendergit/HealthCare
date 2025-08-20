import {
  addVitalReading as addVitalToFirestore,
  subscribeToVitals,
  createEmergencyAlert,
  subscribeToEmergencyAlerts as subscribeToAlertsFirestore
} from './firestore';

export interface VitalReading {
  id?: string;
  patientId: string;
  heartRate?: number;
  oxygenSaturation?: number;
  temperature?: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  timestamp: Date;
  deviceId?: string;
  isEmergency?: boolean;
}

export interface VitalThresholds {
  heartRate: { min: number; max: number };
  oxygenSaturation: { min: number };
  temperature: { min: number; max: number };
  bloodPressure: {
    systolic: { min: number; max: number };
    diastolic: { min: number; max: number };
  };
}

// Default vital thresholds for emergency alerts
export const DEFAULT_THRESHOLDS: VitalThresholds = {
  heartRate: { min: 60, max: 100 },
  oxygenSaturation: { min: 90 },
  temperature: { min: 96.8, max: 100.4 },
  bloodPressure: {
    systolic: { min: 90, max: 140 },
    diastolic: { min: 60, max: 90 }
  }
};

// Check if vitals are within normal ranges
export const checkVitalThresholds = (reading: VitalReading, thresholds = DEFAULT_THRESHOLDS): boolean => {
  let isEmergency = false;

  if (reading.heartRate !== undefined) {
    if (reading.heartRate < thresholds.heartRate.min || reading.heartRate > thresholds.heartRate.max) {
      isEmergency = true;
    }
  }

  if (reading.oxygenSaturation !== undefined) {
    if (reading.oxygenSaturation < thresholds.oxygenSaturation.min) {
      isEmergency = true;
    }
  }

  if (reading.temperature !== undefined) {
    if (reading.temperature < thresholds.temperature.min || reading.temperature > thresholds.temperature.max) {
      isEmergency = true;
    }
  }

  if (reading.bloodPressure) {
    const { systolic, diastolic } = reading.bloodPressure;
    if (systolic < thresholds.bloodPressure.systolic.min || 
        systolic > thresholds.bloodPressure.systolic.max ||
        diastolic < thresholds.bloodPressure.diastolic.min || 
        diastolic > thresholds.bloodPressure.diastolic.max) {
      isEmergency = true;
    }
  }

  return isEmergency;
};

// Add new vital reading
export const addVitalReading = async (reading: Omit<VitalReading, 'id' | 'timestamp' | 'isEmergency'>): Promise<string> => {
  try {
    const vitalReading: VitalReading = {
      ...reading,
      timestamp: new Date(),
      isEmergency: checkVitalThresholds(reading as VitalReading)
    };

    const docId = await addVitalToFirestore(vitalReading);

    // If it's an emergency, create an alert
    if (vitalReading.isEmergency) {
      await createEmergencyAlert({
        patientId: reading.patientId,
        vitalReading: vitalReading,
        alertType: 'vital_threshold_exceeded'
      });
    }

    return docId;
  } catch (error) {
    console.error('Error adding vital reading:', error);
    throw error;
  }
};

// This function is now handled by the firestore.ts module

// Subscribe to real-time vital readings for a patient
export const subscribeToPatientVitals = (
  patientId: string,
  callback: (vitals: VitalReading[]) => void,
  limitCount = 50
) => {
  return subscribeToVitals(patientId, callback);
};

// Subscribe to emergency alerts
export const subscribeToEmergencyAlerts = (
  callback: (alerts: any[]) => void
) => {
  return subscribeToAlertsFirestore(callback);
};

// Get latest vital reading for a patient
export const getLatestVitalReading = (
  patientId: string,
  callback: (vital: VitalReading | null) => void
) => {
  return subscribeToVitals(patientId, (vitals) => {
    callback(vitals.length > 0 ? vitals[0] as VitalReading : null);
  });
};
