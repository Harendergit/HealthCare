// Emergency SOS System
import { addDoc, collection, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { locationManager, LocationData } from '../location/gps';
import { notificationManager } from '../notifications/push';
import { getMedicalProfile } from '../firebase/medical';

export interface EmergencyAlert {
  id?: string;
  patientId: string;
  type: 'manual_sos' | 'vitals_critical' | 'device_disconnect' | 'fall_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'responding' | 'resolved';
  location?: LocationData;
  vitalData?: any;
  medicalProfile?: any;
  message?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  responderId?: string;
  responseTime?: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SOSResponse {
  alertId: string;
  success: boolean;
  message: string;
  estimatedResponseTime?: string;
}

class EmergencySOSManager {
  private isSOSActive = false;
  private currentAlertId: string | null = null;
  private onSOSCallback?: (alert: EmergencyAlert) => void;
  private onResponseCallback?: (response: SOSResponse) => void;

  // Trigger manual SOS alert
  async triggerSOS(patientId: string, message?: string): Promise<SOSResponse> {
    if (this.isSOSActive) {
      return {
        alertId: this.currentAlertId!,
        success: false,
        message: 'SOS already active'
      };
    }

    try {
      this.isSOSActive = true;
      console.log('Starting SOS alert for patient:', patientId);

      // Get current location (optional, don't fail if unavailable)
      let location: LocationData | undefined;
      try {
        const rawLocation = await locationManager.getCurrentLocation({
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 30000
        });

        // Clean location data to remove undefined values
        location = {
          latitude: rawLocation.latitude,
          longitude: rawLocation.longitude,
          accuracy: rawLocation.accuracy,
          timestamp: rawLocation.timestamp,
          ...(rawLocation.altitude !== undefined && rawLocation.altitude !== null && { altitude: rawLocation.altitude }),
          ...(rawLocation.heading !== undefined && rawLocation.heading !== null && { heading: rawLocation.heading }),
          ...(rawLocation.speed !== undefined && rawLocation.speed !== null && { speed: rawLocation.speed })
        };

        console.log('Location obtained for SOS:', location);
      } catch (locationError) {
        console.warn('Could not get location for SOS:', locationError);
      }

      // Get medical profile (optional, don't fail if unavailable)
      let medicalProfile;
      try {
        medicalProfile = await getMedicalProfile(patientId);
        console.log('Medical profile obtained for SOS:', medicalProfile);
      } catch (medicalError) {
        console.warn('Could not get medical profile for SOS:', medicalError);
      }

      // Create emergency alert
      const alert: Omit<EmergencyAlert, 'id' | 'createdAt' | 'updatedAt'> = {
        patientId,
        type: 'manual_sos',
        severity: 'critical',
        status: 'active',
        location,
        medicalProfile,
        message: message || 'Emergency SOS activated'
      };

      console.log('Creating emergency alert in Firestore:', alert);

      const docRef = await addDoc(collection(db, 'emergencyAlerts'), {
        ...alert,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      this.currentAlertId = docRef.id;
      console.log('Emergency alert created with ID:', docRef.id);

      // Send notifications to responders (don't fail SOS if notifications fail)
      try {
        await this.notifyResponders(docRef.id, alert);
        console.log('Responders notified');
      } catch (notifyError) {
        console.warn('Failed to notify responders:', notifyError);
      }

      // Send notifications to emergency contacts (don't fail SOS if notifications fail)
      try {
        if (medicalProfile?.emergencyContacts) {
          await this.notifyEmergencyContacts(patientId, alert);
          console.log('Emergency contacts notified');
        }
      } catch (contactError) {
        console.warn('Failed to notify emergency contacts:', contactError);
      }

      // Trigger callback
      const fullAlert: EmergencyAlert = {
        ...alert,
        id: docRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.onSOSCallback?.(fullAlert);

      return {
        alertId: docRef.id,
        success: true,
        message: 'Emergency alert sent successfully',
        estimatedResponseTime: '5-10 minutes'
      };
    } catch (error: any) {
      this.isSOSActive = false;
      this.currentAlertId = null;
      console.error('Error triggering SOS:', error);

      return {
        alertId: '',
        success: false,
        message: `Failed to send emergency alert: ${error.message || 'Unknown error'}`
      };
    }
  }

  // Cancel active SOS
  async cancelSOS(reason?: string): Promise<boolean> {
    if (!this.isSOSActive || !this.currentAlertId) {
      return false;
    }

    try {
      await updateDoc(doc(db, 'emergencyAlerts', this.currentAlertId), {
        status: 'resolved',
        resolvedAt: serverTimestamp(),
        message: reason || 'SOS cancelled by patient',
        updatedAt: serverTimestamp()
      });

      this.isSOSActive = false;
      this.currentAlertId = null;

      // Notify responders of cancellation
      await notificationManager.showNotification({
        title: 'SOS Cancelled',
        body: reason || 'Emergency alert has been cancelled by the patient',
        type: 'info',
        priority: 'normal',
        userId: 'responder'
      });

      return true;
    } catch (error) {
      console.error('Error cancelling SOS:', error);
      return false;
    }
  }

  // Trigger automatic vitals-based alert
  async triggerVitalsAlert(patientId: string, vitalData: any): Promise<string> {
    try {
      // Get current location
      let location: LocationData | undefined;
      try {
        location = await locationManager.getCurrentLocation({
          enableHighAccuracy: false,
          timeout: 3000,
          maximumAge: 60000
        });
      } catch (locationError) {
        console.warn('Could not get location for vitals alert:', locationError);
      }

      // Get medical profile
      let medicalProfile;
      try {
        medicalProfile = await getMedicalProfile(patientId);
      } catch (medicalError) {
        console.warn('Could not get medical profile for vitals alert:', medicalError);
      }

      // Determine severity based on vitals
      const severity = this.calculateVitalsSeverity(vitalData);

      const alert: Omit<EmergencyAlert, 'id' | 'createdAt' | 'updatedAt'> = {
        patientId,
        type: 'vitals_critical',
        severity,
        status: 'active',
        location,
        vitalData,
        medicalProfile,
        message: this.generateVitalsMessage(vitalData)
      };

      const docRef = await addDoc(collection(db, 'emergencyAlerts'), {
        ...alert,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Send notifications based on severity
      if (severity === 'critical') {
        await this.notifyResponders(docRef.id, alert);
      }
      
      // Always notify family members
      await this.notifyFamilyMembers(patientId, alert);

      return docRef.id;
    } catch (error) {
      console.error('Error triggering vitals alert:', error);
      throw error;
    }
  }

  // Acknowledge alert (for responders)
  async acknowledgeAlert(alertId: string, responderId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'emergencyAlerts', alertId), {
        status: 'acknowledged',
        acknowledgedBy: responderId,
        acknowledgedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return false;
    }
  }

  // Start response (for responders)
  async startResponse(alertId: string, responderId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'emergencyAlerts', alertId), {
        status: 'responding',
        responderId,
        responseTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error starting response:', error);
      return false;
    }
  }

  // Resolve alert
  async resolveAlert(alertId: string, resolution: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'emergencyAlerts', alertId), {
        status: 'resolved',
        resolvedAt: serverTimestamp(),
        message: resolution,
        updatedAt: serverTimestamp()
      });

      if (this.currentAlertId === alertId) {
        this.isSOSActive = false;
        this.currentAlertId = null;
      }

      return true;
    } catch (error) {
      console.error('Error resolving alert:', error);
      return false;
    }
  }

  // Set callbacks
  setSOSCallback(callback: (alert: EmergencyAlert) => void): void {
    this.onSOSCallback = callback;
  }

  setResponseCallback(callback: (response: SOSResponse) => void): void {
    this.onResponseCallback = callback;
  }

  // Check if SOS is currently active
  isSOSCurrentlyActive(): boolean {
    return this.isSOSActive;
  }

  // Get current alert ID
  getCurrentAlertId(): string | null {
    return this.currentAlertId;
  }

  // Private helper methods
  private async notifyResponders(alertId: string, alert: Omit<EmergencyAlert, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      if (notificationManager.isSupported()) {
        await notificationManager.showEmergencyAlert(alert.patientId, alert.vitalData);
      } else {
        console.warn('Notifications not supported, skipping responder notification');
      }
    } catch (error) {
      console.error('Error notifying responders:', error);
      // Don't throw - notification failure shouldn't fail the SOS
    }
  }

  private async notifyFamilyMembers(patientId: string, alert: Omit<EmergencyAlert, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const message = alert.type === 'vitals_critical'
        ? 'Critical vitals detected for your family member'
        : 'Emergency alert from your family member';

      if (notificationManager.isSupported()) {
        await notificationManager.showVitalsAlert(patientId, message);
      } else {
        console.warn('Notifications not supported, skipping family notification');
      }
    } catch (error) {
      console.error('Error notifying family members:', error);
      // Don't throw - notification failure shouldn't fail the SOS
    }
  }

  private async notifyEmergencyContacts(patientId: string, alert: Omit<EmergencyAlert, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      // In a real implementation, this would send SMS/email to emergency contacts
      console.log('Notifying emergency contacts for patient:', patientId);

      // For now, show a browser notification
      if (notificationManager.isSupported()) {
        await notificationManager.showNotification({
          title: '🚨 Emergency Alert',
          body: `Emergency SOS activated for patient ${patientId}`,
          type: 'emergency',
          priority: 'critical',
          userId: 'emergency_contact'
        });
      }
    } catch (error) {
      console.error('Error notifying emergency contacts:', error);
      // Don't throw - notification failure shouldn't fail the SOS
    }
  }

  private calculateVitalsSeverity(vitalData: any): 'low' | 'medium' | 'high' | 'critical' {
    let criticalCount = 0;
    let warningCount = 0;

    if (vitalData.heartRate) {
      if (vitalData.heartRate < 40 || vitalData.heartRate > 150) {
        criticalCount++;
      } else if (vitalData.heartRate < 50 || vitalData.heartRate > 120) {
        warningCount++;
      }
    }

    if (vitalData.oxygenSaturation) {
      if (vitalData.oxygenSaturation < 85) {
        criticalCount++;
      } else if (vitalData.oxygenSaturation < 90) {
        warningCount++;
      }
    }

    if (vitalData.temperature) {
      if (vitalData.temperature < 95 || vitalData.temperature > 104) {
        criticalCount++;
      } else if (vitalData.temperature < 96.5 || vitalData.temperature > 101) {
        warningCount++;
      }
    }

    if (criticalCount >= 2) return 'critical';
    if (criticalCount >= 1) return 'high';
    if (warningCount >= 2) return 'medium';
    return 'low';
  }

  private generateVitalsMessage(vitalData: any): string {
    const issues = [];
    
    if (vitalData.heartRate && (vitalData.heartRate < 50 || vitalData.heartRate > 120)) {
      issues.push(`Heart rate: ${vitalData.heartRate} BPM`);
    }
    
    if (vitalData.oxygenSaturation && vitalData.oxygenSaturation < 90) {
      issues.push(`Oxygen saturation: ${vitalData.oxygenSaturation}%`);
    }
    
    if (vitalData.temperature && (vitalData.temperature < 96.5 || vitalData.temperature > 101)) {
      issues.push(`Temperature: ${vitalData.temperature}°F`);
    }

    return issues.length > 0 
      ? `Critical vitals detected: ${issues.join(', ')}`
      : 'Abnormal vital signs detected';
  }
}

// Export singleton instance
export const emergencySOSManager = new EmergencySOSManager();
