import React, { createContext, useContext, useEffect, useState } from 'react';
import { VitalReading, subscribeToPatientVitals, addVitalReading } from '@/integrations/firebase/vitals';
import { bluetoothManager, VitalData, BluetoothDeviceInfo, BluetoothConnectionStatus } from '@/integrations/bluetooth/ble';
import { locationManager, LocationData } from '@/integrations/location/gps';
import { notificationManager } from '@/integrations/notifications/push';
import { emergencySOSManager } from '@/integrations/emergency/sos';
import { useAuth } from './AuthContext';

interface VitalsContextType {
  // Vitals data
  vitals: VitalReading[];
  latestVital: VitalReading | null;

  // Bluetooth functionality
  isBluetoothSupported: boolean;
  connectedDevices: BluetoothDeviceInfo[];
  bluetoothStatus: BluetoothConnectionStatus;
  connectHeartRateMonitor: () => Promise<void>;
  connectPulseOximeter: () => Promise<void>;
  connectThermometer: () => Promise<void>;
  disconnectDevice: (deviceId: string) => Promise<void>;

  // Location functionality
  currentLocation: LocationData | null;
  isLocationSupported: boolean;
  startLocationTracking: () => Promise<void>;
  stopLocationTracking: () => void;

  // Emergency functionality
  triggerSOS: (message?: string) => Promise<void>;
  cancelSOS: () => Promise<void>;
  isSOSActive: boolean;

  // Notifications
  notificationsEnabled: boolean;
  requestNotificationPermission: () => Promise<void>;

  loading: boolean;
  error: string | null;
}

const VitalsContext = createContext<VitalsContextType | undefined>(undefined);

export const useVitals = () => {
  const context = useContext(VitalsContext);
  if (context === undefined) {
    throw new Error('useVitals must be used within a VitalsProvider');
  }
  return context;
};

interface VitalsProviderProps {
  children: React.ReactNode;
}

export const VitalsProvider: React.FC<VitalsProviderProps> = ({ children }) => {
  const { userData } = useAuth();

  // State management
  const [vitals, setVitals] = useState<VitalReading[]>([]);
  const [latestVital, setLatestVital] = useState<VitalReading | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<BluetoothDeviceInfo[]>([]);
  const [bluetoothStatus, setBluetoothStatus] = useState<BluetoothConnectionStatus>({
    isScanning: false,
    connectedDevices: 0,
    supportedDevices: []
  });
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Feature support checks
  const isBluetoothSupported = bluetoothManager.isSupported();
  const isLocationSupported = locationManager.isSupported();

  // Initialize services and callbacks
  useEffect(() => {
    // Set up Bluetooth callbacks
    bluetoothManager.setStatusCallback(setBluetoothStatus);
    bluetoothManager.setErrorCallback((error) => {
      // Only set error for serious issues, not for common user actions
      if (!error.includes('No heart rate monitor found') &&
          !error.includes('User cancelled') &&
          !error.includes('globally disabled')) {
        setError(error);
      }
      console.log('Bluetooth status:', error);
    });

    // Location errors will be handled in individual function calls

    // Set up notification callbacks
    notificationManager.setNotificationCallback((notification) => {
      console.log('Notification received:', notification);
    });

    // Set up SOS callbacks
    emergencySOSManager.setSOSCallback((alert) => {
      setIsSOSActive(true);
      console.log('SOS alert created:', alert);
    });

    // Check notification permission status
    const checkNotificationStatus = async () => {
      if (notificationManager.isSupported()) {
        const status = notificationManager.getPermissionStatus();
        setNotificationsEnabled(status.granted);
      }
    };
    checkNotificationStatus();

    return () => {
      // Cleanup
      locationManager.stopTracking();
      bluetoothManager.disconnectAll();
    };
  }, []);

  // Subscribe to vitals for current patient
  useEffect(() => {
    if (!userData) return;

    let unsubscribe: (() => void) | undefined;

    if (userData.role === 'patient' && userData.patientId) {
      // Patient viewing their own vitals
      unsubscribe = subscribeToPatientVitals(userData.patientId, (newVitals) => {
        setVitals(newVitals);
        if (newVitals.length > 0) {
          const latest = newVitals[0];
          setLatestVital(latest);

          // Check for emergency vitals
          if (latest.isEmergency) {
            emergencySOSManager.triggerVitalsAlert(userData.patientId!, latest);
          }
        }
      });
    } else if (userData.role === 'family' && userData.connectedPatients?.length) {
      // Family member viewing connected patients' vitals
      const patientId = userData.connectedPatients[0];
      unsubscribe = subscribeToPatientVitals(patientId, (newVitals) => {
        setVitals(newVitals);
        if (newVitals.length > 0) {
          setLatestVital(newVitals[0]);
        }
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userData]);

  // Set up Bluetooth data callback
  useEffect(() => {
    if (!userData || userData.role !== 'patient' || !userData.patientId) return;

    bluetoothManager.setDataCallback(async (data: VitalData) => {
      try {
        // Add vital reading to Firestore
        await addVitalReading({
          patientId: userData.patientId!,
          heartRate: data.heartRate,
          oxygenSaturation: data.oxygenSaturation,
          temperature: data.temperature,
          bloodPressure: data.bloodPressure,
          deviceId: data.deviceId
        });
      } catch (error) {
        console.error('Error saving vital reading:', error);
      }
    });
  }, [userData]);

  // Bluetooth device functions
  const connectHeartRateMonitor = async () => {
    setLoading(true);
    setError(null);
    try {
      const device = await bluetoothManager.connectHeartRateMonitor();
      if (device) {
        setConnectedDevices(prev => [...prev.filter(d => d.id !== device.id), device]);
        await notificationManager.showConnectionNotification(device.name, true);
      }
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const connectPulseOximeter = async () => {
    setLoading(true);
    setError(null);
    try {
      const device = await bluetoothManager.connectPulseOximeter();
      if (device) {
        setConnectedDevices(prev => [...prev.filter(d => d.id !== device.id), device]);
        await notificationManager.showConnectionNotification(device.name, true);
      }
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const connectThermometer = async () => {
    setLoading(true);
    setError(null);
    try {
      const device = await bluetoothManager.connectThermometer();
      if (device) {
        setConnectedDevices(prev => [...prev.filter(d => d.id !== device.id), device]);
        await notificationManager.showConnectionNotification(device.name, true);
      }
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const disconnectDevice = async (deviceId: string) => {
    try {
      const device = connectedDevices.find(d => d.id === deviceId);
      await bluetoothManager.disconnectDevice(deviceId);
      setConnectedDevices(prev => prev.filter(device => device.id !== deviceId));

      if (device) {
        await notificationManager.showConnectionNotification(device.name, false);
      }
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Location functions
  const startLocationTracking = async () => {
    if (!isLocationSupported) {
      throw new Error('Location tracking is not supported');
    }

    try {
      await locationManager.startTracking(
        (location) => {
          setCurrentLocation(location);
        },
        (error) => {
          setError(error);
        }
      );
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const stopLocationTracking = () => {
    locationManager.stopTracking();
    setCurrentLocation(null);
  };

  // Emergency functions
  const triggerSOS = async (message?: string) => {
    if (!userData?.patientId) {
      throw new Error('Patient ID not found');
    }

    try {
      setLoading(true);
      const response = await emergencySOSManager.triggerSOS(userData.patientId, message);
      if (response.success) {
        setIsSOSActive(true);
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const cancelSOS = async () => {
    try {
      const success = await emergencySOSManager.cancelSOS();
      if (success) {
        setIsSOSActive(false);
      }
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Notification functions
  const requestNotificationPermission = async () => {
    try {
      const status = await notificationManager.requestPermission();
      setNotificationsEnabled(status.granted);

      if (status.granted) {
        await notificationManager.initializeServiceWorker();
      }
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const value: VitalsContextType = {
    // Vitals data
    vitals,
    latestVital,

    // Bluetooth functionality
    isBluetoothSupported,
    connectedDevices,
    bluetoothStatus,
    connectHeartRateMonitor,
    connectPulseOximeter,
    connectThermometer,
    disconnectDevice,

    // Location functionality
    currentLocation,
    isLocationSupported,
    startLocationTracking,
    stopLocationTracking,

    // Emergency functionality
    triggerSOS,
    cancelSOS,
    isSOSActive,

    // Notifications
    notificationsEnabled,
    requestNotificationPermission,

    loading,
    error
  };

  return (
    <VitalsContext.Provider value={value}>
      {children}
    </VitalsContext.Provider>
  );
};
