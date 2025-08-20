// Demo data generator for testing the healthcare app
import { addVitalReading } from '@/integrations/firebase/vitals';

export interface DemoVitalReading {
  heartRate: number;
  oxygenSaturation: number;
  temperature: number;
  timestamp: Date;
}

// Generate realistic vital signs
export const generateRealisticVitals = (): DemoVitalReading => {
  // Normal ranges with some variation
  const baseHeartRate = 70 + (Math.random() - 0.5) * 20; // 60-80 BPM
  const baseSpO2 = 97 + Math.random() * 3; // 97-100%
  const baseTemp = 98.6 + (Math.random() - 0.5) * 2; // 97.6-99.6°F

  return {
    heartRate: Math.round(baseHeartRate),
    oxygenSaturation: Math.round(baseSpO2),
    temperature: Math.round(baseTemp * 10) / 10,
    timestamp: new Date()
  };
};

// Generate emergency vitals (outside normal ranges)
export const generateEmergencyVitals = (): DemoVitalReading => {
  const scenarios = [
    // Low oxygen scenario
    {
      heartRate: 95 + Math.random() * 20, // Elevated heart rate
      oxygenSaturation: 85 + Math.random() * 5, // Low SpO2
      temperature: 98.6 + (Math.random() - 0.5) * 1
    },
    // High fever scenario
    {
      heartRate: 90 + Math.random() * 15,
      oxygenSaturation: 96 + Math.random() * 3,
      temperature: 101 + Math.random() * 2 // High fever
    },
    // Bradycardia scenario
    {
      heartRate: 45 + Math.random() * 10, // Low heart rate
      oxygenSaturation: 96 + Math.random() * 3,
      temperature: 98.6 + (Math.random() - 0.5) * 1
    },
    // Tachycardia scenario
    {
      heartRate: 110 + Math.random() * 20, // High heart rate
      oxygenSaturation: 94 + Math.random() * 4,
      temperature: 99 + Math.random() * 2
    }
  ];

  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  
  return {
    heartRate: Math.round(scenario.heartRate),
    oxygenSaturation: Math.round(scenario.oxygenSaturation),
    temperature: Math.round(scenario.temperature * 10) / 10,
    timestamp: new Date()
  };
};

// Simulate continuous vitals monitoring
export class VitalsSimulator {
  private intervalId: NodeJS.Timeout | null = null;
  private patientId: string;
  private isEmergency: boolean = false;

  constructor(patientId: string) {
    this.patientId = patientId;
  }

  // Start simulating vitals every 5 seconds
  start(emergencyMode: boolean = false): void {
    this.isEmergency = emergencyMode;
    
    if (this.intervalId) {
      this.stop();
    }

    this.intervalId = setInterval(async () => {
      try {
        const vitals = this.isEmergency 
          ? generateEmergencyVitals() 
          : generateRealisticVitals();

        await addVitalReading({
          patientId: this.patientId,
          heartRate: vitals.heartRate,
          oxygenSaturation: vitals.oxygenSaturation,
          temperature: vitals.temperature,
          deviceId: 'demo-device-001'
        });

        console.log('Demo vitals added:', vitals);
      } catch (error) {
        console.error('Error adding demo vitals:', error);
      }
    }, 5000); // Every 5 seconds

    console.log(`Vitals simulation started for patient ${this.patientId} (Emergency mode: ${emergencyMode})`);
  }

  // Stop simulation
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Vitals simulation stopped');
    }
  }

  // Toggle emergency mode
  toggleEmergencyMode(): void {
    this.isEmergency = !this.isEmergency;
    console.log(`Emergency mode ${this.isEmergency ? 'enabled' : 'disabled'}`);
  }

  // Add a single vital reading
  async addSingleReading(emergency: boolean = false): Promise<void> {
    try {
      const vitals = emergency ? generateEmergencyVitals() : generateRealisticVitals();
      
      await addVitalReading({
        patientId: this.patientId,
        heartRate: vitals.heartRate,
        oxygenSaturation: vitals.oxygenSaturation,
        temperature: vitals.temperature,
        deviceId: 'demo-device-001'
      });

      console.log('Single demo vital added:', vitals);
    } catch (error) {
      console.error('Error adding single demo vital:', error);
    }
  }
}

// Generate historical vitals data for charts
export const generateHistoricalVitals = (patientId: string, hours: number = 24): DemoVitalReading[] => {
  const vitals: DemoVitalReading[] = [];
  const now = new Date();
  const intervalMinutes = 15; // Reading every 15 minutes
  const totalReadings = (hours * 60) / intervalMinutes;

  for (let i = 0; i < totalReadings; i++) {
    const timestamp = new Date(now.getTime() - (i * intervalMinutes * 60 * 1000));
    
    // Occasionally generate emergency readings for demo
    const isEmergency = Math.random() < 0.05; // 5% chance
    const vital = isEmergency ? generateEmergencyVitals() : generateRealisticVitals();
    
    vitals.push({
      ...vital,
      timestamp
    });
  }

  return vitals.reverse(); // Oldest first
};

// Demo user accounts for testing
export const demoAccounts = {
  patient: {
    email: 'patient@demo.com',
    password: 'demo123',
    role: 'patient' as const,
    displayName: 'John Patient'
  },
  family: {
    email: 'family@demo.com',
    password: 'demo123',
    role: 'family' as const,
    displayName: 'Jane Family'
  },
  responder: {
    email: 'responder@demo.com',
    password: 'demo123',
    role: 'responder' as const,
    displayName: 'Dr. Emergency'
  }
};

// Helper function to create demo accounts
export const createDemoAccounts = async () => {
  console.log('Demo accounts available:');
  console.log('Patient: patient@demo.com / demo123');
  console.log('Family: family@demo.com / demo123');
  console.log('Responder: responder@demo.com / demo123');
  console.log('');
  console.log('To test:');
  console.log('1. Sign up as Patient to get a Patient ID');
  console.log('2. Sign up as Family and connect using the Patient ID');
  console.log('3. Sign up as Responder to monitor emergency alerts');
};
