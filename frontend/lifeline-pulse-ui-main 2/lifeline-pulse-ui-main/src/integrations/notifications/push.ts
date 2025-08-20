// Real-time Push Notifications System
export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: 'emergency' | 'vitals' | 'connection' | 'reminder' | 'info';
  priority: 'low' | 'normal' | 'high' | 'critical';
  userId: string;
  patientId?: string;
  data?: Record<string, any>;
  timestamp: Date;
  read: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationPermissionStatus {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

class NotificationManager {
  private registration: ServiceWorkerRegistration | null = null;
  private onNotificationCallback?: (notification: NotificationData) => void;
  private onPermissionCallback?: (status: NotificationPermissionStatus) => void;

  // Check if notifications are supported
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermissionStatus {
    if (!this.isSupported()) {
      return { granted: false, denied: true, default: false };
    }

    const permission = Notification.permission;
    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default'
    };
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermissionStatus> {
    if (!this.isSupported()) {
      throw new Error('Notifications are not supported in this browser');
    }

    try {
      const permission = await Notification.requestPermission();
      const status = this.getPermissionStatus();
      this.onPermissionCallback?.(status);
      return status;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      throw error;
    }
  }

  // Initialize service worker for background notifications
  async initializeServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Workers are not supported');
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully');
      
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'NOTIFICATION_CLICK') {
          this.handleNotificationClick(event.data.notification);
        }
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  // Show local notification
  async showNotification(notificationData: Omit<NotificationData, 'id' | 'timestamp' | 'read'>): Promise<void> {
    const permissionStatus = this.getPermissionStatus();
    if (!permissionStatus.granted) {
      throw new Error('Notification permission not granted');
    }

    const notification: NotificationData = {
      ...notificationData,
      id: this.generateNotificationId(),
      timestamp: new Date(),
      read: false
    };

    try {
      if (this.registration) {
        // Show notification through service worker (for background notifications)
        await this.registration.showNotification(notification.title, {
          body: notification.body,
          icon: this.getNotificationIcon(notification.type),
          badge: '/icons/badge-96x96.png',
          tag: notification.type,
          data: notification,
          requireInteraction: notification.priority === 'critical',
          silent: notification.priority === 'low',
          actions: notification.actions || [],
          vibrate: this.getVibrationPattern(notification.priority)
        });
      } else {
        // Fallback to basic notification
        const basicNotification = new Notification(notification.title, {
          body: notification.body,
          icon: this.getNotificationIcon(notification.type),
          tag: notification.type,
          data: notification,
          requireInteraction: notification.priority === 'critical',
          silent: notification.priority === 'low'
        });

        basicNotification.onclick = () => {
          this.handleNotificationClick(notification);
          basicNotification.close();
        };
      }

      // Trigger callback
      this.onNotificationCallback?.(notification);
    } catch (error) {
      console.error('Error showing notification:', error);
      throw error;
    }
  }

  // Show emergency alert notification
  async showEmergencyAlert(patientId: string, vitalData: any): Promise<void> {
    await this.showNotification({
      title: '🚨 EMERGENCY ALERT',
      body: `Critical vitals detected for patient ${patientId}. Immediate attention required.`,
      type: 'emergency',
      priority: 'critical',
      userId: 'responder',
      patientId,
      data: { vitalData },
      actions: [
        { action: 'respond', title: 'Respond', icon: '/icons/respond.png' },
        { action: 'call', title: 'Call 911', icon: '/icons/call.png' }
      ]
    });
  }

  // Show vitals alert notification
  async showVitalsAlert(patientId: string, message: string): Promise<void> {
    await this.showNotification({
      title: 'Vitals Alert',
      body: message,
      type: 'vitals',
      priority: 'high',
      userId: 'family',
      patientId,
      actions: [
        { action: 'view', title: 'View Details', icon: '/icons/view.png' }
      ]
    });
  }

  // Show connection notification
  async showConnectionNotification(deviceName: string, connected: boolean): Promise<void> {
    await this.showNotification({
      title: connected ? 'Device Connected' : 'Device Disconnected',
      body: `${deviceName} ${connected ? 'connected successfully' : 'has been disconnected'}`,
      type: 'connection',
      priority: connected ? 'normal' : 'high',
      userId: 'patient'
    });
  }

  // Set notification callback
  setNotificationCallback(callback: (notification: NotificationData) => void): void {
    this.onNotificationCallback = callback;
  }

  // Set permission callback
  setPermissionCallback(callback: (status: NotificationPermissionStatus) => void): void {
    this.onPermissionCallback = callback;
  }

  // Handle notification click
  private handleNotificationClick(notification: NotificationData): void {
    // Focus the window
    if (window.focus) {
      window.focus();
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'emergency':
        window.location.href = '/responder';
        break;
      case 'vitals':
        window.location.href = '/family';
        break;
      case 'connection':
        window.location.href = '/patient';
        break;
      default:
        window.location.href = '/';
    }
  }

  // Generate unique notification ID
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get notification icon based on type
  private getNotificationIcon(type: string): string {
    const icons = {
      emergency: '/icons/emergency-192x192.png',
      vitals: '/icons/vitals-192x192.png',
      connection: '/icons/bluetooth-192x192.png',
      reminder: '/icons/reminder-192x192.png',
      info: '/icons/info-192x192.png'
    };
    return icons[type as keyof typeof icons] || '/icons/default-192x192.png';
  }

  // Get vibration pattern based on priority
  private getVibrationPattern(priority: string): number[] {
    const patterns = {
      low: [],
      normal: [200],
      high: [200, 100, 200],
      critical: [200, 100, 200, 100, 200, 100, 200]
    };
    return patterns[priority as keyof typeof patterns] || [200];
  }

  // Clear all notifications
  async clearAllNotifications(): Promise<void> {
    if (this.registration) {
      const notifications = await this.registration.getNotifications();
      notifications.forEach(notification => notification.close());
    }
  }

  // Clear notifications by type
  async clearNotificationsByType(type: string): Promise<void> {
    if (this.registration) {
      const notifications = await this.registration.getNotifications({ tag: type });
      notifications.forEach(notification => notification.close());
    }
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager();

// Notification utilities
export const NotificationUtils = {
  // Format notification time
  formatNotificationTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  },

  // Get priority color
  getPriorityColor(priority: string): string {
    const colors = {
      low: '#6b7280',
      normal: '#3b82f6',
      high: '#f59e0b',
      critical: '#ef4444'
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  },

  // Get type icon
  getTypeIcon(type: string): string {
    const icons = {
      emergency: '🚨',
      vitals: '💓',
      connection: '📱',
      reminder: '⏰',
      info: 'ℹ️'
    };
    return icons[type as keyof typeof icons] || 'ℹ️';
  }
};
