// Enhanced Bluetooth Low Energy integration for medical devices
export interface BluetoothDeviceInfo {
  id: string;
  name: string;
  type: 'heart_rate' | 'pulse_oximeter' | 'thermometer' | 'blood_pressure';
  connected: boolean;
  batteryLevel?: number;
  lastSeen?: Date;
  rssi?: number; // Signal strength
  device?: BluetoothDevice;
  server?: BluetoothRemoteGATTServer;
  characteristics?: Map<string, BluetoothRemoteGATTCharacteristic>;
}

export interface VitalData {
  heartRate?: number;
  oxygenSaturation?: number;
  temperature?: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  timestamp: Date;
  deviceId: string;
  deviceType: string;
  signalStrength?: number;
}

export interface BluetoothConnectionStatus {
  isScanning: boolean;
  connectedDevices: number;
  lastError?: string;
  supportedDevices: string[];
}

// Standard Bluetooth GATT service UUIDs for medical devices
const HEART_RATE_SERVICE_UUID = '0000180d-0000-1000-8000-00805f9b34fb';
const HEART_RATE_MEASUREMENT_UUID = '00002a37-0000-1000-8000-00805f9b34fb';
const PULSE_OXIMETER_SERVICE_UUID = '00001822-0000-1000-8000-00805f9b34fb';
const TEMPERATURE_SERVICE_UUID = '00001809-0000-1000-8000-00805f9b34fb';
const BLOOD_PRESSURE_SERVICE_UUID = '00001810-0000-1000-8000-00805f9b34fb';

class BluetoothManager {
  private connectedDevices: Map<string, BluetoothDeviceInfo> = new Map();
  private onDataCallback?: (data: VitalData) => void;
  private onStatusCallback?: (status: BluetoothConnectionStatus) => void;
  private onErrorCallback?: (error: string) => void;
  private reconnectIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isScanning = false;

  // Check if Web Bluetooth is supported
  isSupported(): boolean {
    if (!('bluetooth' in navigator)) {
      return false;
    }

    // Check if Bluetooth is globally disabled
    try {
      // This will throw if Bluetooth is globally disabled
      navigator.bluetooth.getAvailability?.();
      return true;
    } catch (error) {
      console.warn('Web Bluetooth is globally disabled');
      return false;
    }
  }

  // Set callback for when new vital data is received
  setDataCallback(callback: (data: VitalData) => void): void {
    this.onDataCallback = callback;
  }

  // Set callback for connection status updates
  setStatusCallback(callback: (status: BluetoothConnectionStatus) => void): void {
    this.onStatusCallback = callback;
  }

  // Set callback for error handling
  setErrorCallback(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  // Get current connection status
  getConnectionStatus(): BluetoothConnectionStatus {
    return {
      isScanning: this.isScanning,
      connectedDevices: this.connectedDevices.size,
      supportedDevices: ['Heart Rate Monitor', 'Pulse Oximeter', 'Thermometer', 'Blood Pressure Monitor']
    };
  }

  // Enhanced heart rate monitor connection with proper error handling
  async connectHeartRateMonitor(): Promise<BluetoothDeviceInfo | null> {
    if (!this.isSupported()) {
      const error = 'Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.';
      this.onErrorCallback?.(error);
      throw new Error(error);
    }

    this.isScanning = true;
    this.updateStatus();

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [HEART_RATE_SERVICE_UUID] },
          { namePrefix: 'Polar' },
          { namePrefix: 'Wahoo' },
          { namePrefix: 'Garmin' }
        ],
        optionalServices: ['battery_service', 'device_information']
      });

      if (!device.gatt) {
        throw new Error('GATT not available on this device');
      }

      // Set up disconnect handler
      device.addEventListener('gattserverdisconnected', () => {
        this.handleDeviceDisconnect(device.id);
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(HEART_RATE_SERVICE_UUID);
      const characteristic = await service.getCharacteristic(HEART_RATE_MEASUREMENT_UUID);

      // Start notifications
      await characteristic.startNotifications();

      const deviceInfo: BluetoothDeviceInfo = {
        id: device.id,
        name: device.name || 'Heart Rate Monitor',
        type: 'heart_rate',
        connected: true,
        lastSeen: new Date(),
        device,
        server,
        characteristics: new Map([['heart_rate', characteristic]])
      };

      // Set up data listener
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const heartRate = this.parseHeartRateData(event.target as BluetoothRemoteGATTCharacteristic);
        if (this.onDataCallback && heartRate) {
          this.onDataCallback({
            heartRate,
            timestamp: new Date(),
            deviceId: device.id,
            deviceType: 'heart_rate'
          });
        }
        deviceInfo.lastSeen = new Date();
      });

      // Try to get battery level
      try {
        const batteryService = await server.getPrimaryService('battery_service');
        const batteryCharacteristic = await batteryService.getCharacteristic('battery_level');
        const batteryValue = await batteryCharacteristic.readValue();
        deviceInfo.batteryLevel = batteryValue.getUint8(0);
      } catch (batteryError) {
        console.log('Battery service not available');
      }

      this.connectedDevices.set(device.id, deviceInfo);
      this.isScanning = false;
      this.updateStatus();

      console.log('Heart rate monitor connected successfully:', deviceInfo.name);
      return deviceInfo;
    } catch (error: any) {
      this.isScanning = false;
      this.updateStatus();

      let errorMessage = 'Failed to connect to heart rate monitor';
      if (error.name === 'NotFoundError') {
        errorMessage = 'No heart rate monitor found. Make sure your device is in pairing mode.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Bluetooth access denied. Please allow Bluetooth permissions.';
      } else if (error.name === 'NetworkError') {
        errorMessage = 'Connection failed. Please try again.';
      } else if (error.message?.includes('globally disabled')) {
        errorMessage = 'Bluetooth is disabled in your browser. Please enable it in browser settings.';
      }

      // Only show error callback for user-actionable errors
      if (error.name !== 'NotFoundError') {
        this.onErrorCallback?.(errorMessage);
      }
      console.warn('Bluetooth connection attempt:', error.message);
      throw new Error(errorMessage);
    }
  }

  // Scan for and connect to pulse oximeter
  async connectPulseOximeter(): Promise<BluetoothDevice | null> {
    if (!this.isSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser');
    }

    try {
      // Note: Pulse oximeters may use custom services, this is a generic implementation
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'Pulse' }],
        optionalServices: [PULSE_OXIMETER_SERVICE_UUID, 'battery_service']
      });

      if (!device.gatt) {
        throw new Error('GATT not available');
      }

      const server = await device.gatt.connect();
      
      // This would need to be customized based on the specific pulse oximeter
      // For demo purposes, we'll simulate data
      this.simulatePulseOximeterData(device.id);

      const bluetoothDevice: BluetoothDevice = {
        id: device.id,
        name: device.name || 'Pulse Oximeter',
        type: 'pulse_oximeter',
        connected: true
      };

      this.connectedDevices.set(device.id, bluetoothDevice);
      return bluetoothDevice;
    } catch (error) {
      console.error('Error connecting to pulse oximeter:', error);
      throw error;
    }
  }

  // Scan for and connect to thermometer
  async connectThermometer(): Promise<BluetoothDevice | null> {
    if (!this.isSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser');
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [TEMPERATURE_SERVICE_UUID] }],
        optionalServices: ['battery_service']
      });

      if (!device.gatt) {
        throw new Error('GATT not available');
      }

      const server = await device.gatt.connect();
      
      // This would need to be implemented based on the specific thermometer
      // For demo purposes, we'll simulate data
      this.simulateThermometerData(device.id);

      const bluetoothDevice: BluetoothDevice = {
        id: device.id,
        name: device.name || 'Thermometer',
        type: 'thermometer',
        connected: true
      };

      this.connectedDevices.set(device.id, bluetoothDevice);
      return bluetoothDevice;
    } catch (error) {
      console.error('Error connecting to thermometer:', error);
      throw error;
    }
  }

  // Parse heart rate data from Bluetooth characteristic
  private parseHeartRateData(characteristic: BluetoothRemoteGATTCharacteristic): number | null {
    const value = characteristic.value;
    if (!value) return null;

    const flags = value.getUint8(0);
    const rate16Bits = flags & 0x1;
    let heartRate: number;

    if (rate16Bits) {
      heartRate = value.getUint16(1, true);
    } else {
      heartRate = value.getUint8(1);
    }

    return heartRate;
  }

  // Simulate pulse oximeter data (for demo purposes)
  private simulatePulseOximeterData(deviceId: string): void {
    setInterval(() => {
      if (this.onDataCallback) {
        const oxygenSaturation = 95 + Math.random() * 5; // 95-100%
        this.onDataCallback({
          oxygenSaturation: Math.round(oxygenSaturation),
          timestamp: new Date(),
          deviceId
        });
      }
    }, 5000); // Every 5 seconds
  }

  // Simulate thermometer data (for demo purposes)
  private simulateThermometerData(deviceId: string): void {
    setInterval(() => {
      if (this.onDataCallback) {
        const temperature = 97 + Math.random() * 3; // 97-100°F
        this.onDataCallback({
          temperature: Math.round(temperature * 10) / 10,
          timestamp: new Date(),
          deviceId
        });
      }
    }, 10000); // Every 10 seconds
  }

  // Handle device disconnect
  private handleDeviceDisconnect(deviceId: string): void {
    const deviceInfo = this.connectedDevices.get(deviceId);
    if (deviceInfo) {
      deviceInfo.connected = false;
      console.log(`Device disconnected: ${deviceInfo.name}`);

      // Start automatic reconnection
      this.startReconnection(deviceId);
      this.updateStatus();
    }
  }

  // Start automatic reconnection for a device
  private startReconnection(deviceId: string): void {
    const deviceInfo = this.connectedDevices.get(deviceId);
    if (!deviceInfo || !deviceInfo.device) return;

    // Clear existing reconnection interval
    const existingInterval = this.reconnectIntervals.get(deviceId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Try to reconnect every 5 seconds
    const reconnectInterval = setInterval(async () => {
      try {
        if (deviceInfo.device?.gatt?.connected) {
          // Already reconnected
          clearInterval(reconnectInterval);
          this.reconnectIntervals.delete(deviceId);
          deviceInfo.connected = true;
          this.updateStatus();
          return;
        }

        console.log(`Attempting to reconnect to ${deviceInfo.name}...`);
        await deviceInfo.device?.gatt?.connect();

        if (deviceInfo.device?.gatt?.connected) {
          deviceInfo.connected = true;
          deviceInfo.lastSeen = new Date();
          console.log(`Successfully reconnected to ${deviceInfo.name}`);
          clearInterval(reconnectInterval);
          this.reconnectIntervals.delete(deviceId);
          this.updateStatus();
        }
      } catch (error) {
        console.log(`Reconnection attempt failed for ${deviceInfo.name}`);
      }
    }, 5000);

    this.reconnectIntervals.set(deviceId, reconnectInterval);
  }

  // Manually disconnect a device
  async disconnectDevice(deviceId: string): Promise<void> {
    const deviceInfo = this.connectedDevices.get(deviceId);
    if (deviceInfo) {
      // Clear reconnection interval
      const reconnectInterval = this.reconnectIntervals.get(deviceId);
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        this.reconnectIntervals.delete(deviceId);
      }

      // Disconnect the device
      try {
        if (deviceInfo.server?.connected) {
          deviceInfo.server.disconnect();
        }
      } catch (error) {
        console.error('Error disconnecting device:', error);
      }

      deviceInfo.connected = false;
      this.connectedDevices.delete(deviceId);
      this.updateStatus();
    }
  }

  // Get all connected devices
  getConnectedDevices(): BluetoothDeviceInfo[] {
    return Array.from(this.connectedDevices.values());
  }

  // Disconnect all devices
  async disconnectAll(): Promise<void> {
    for (const [deviceId] of this.connectedDevices) {
      await this.disconnectDevice(deviceId);
    }
  }

  // Update status callback
  private updateStatus(): void {
    if (this.onStatusCallback) {
      this.onStatusCallback(this.getConnectionStatus());
    }
  }
}

// Export singleton instance
export const bluetoothManager = new BluetoothManager();
