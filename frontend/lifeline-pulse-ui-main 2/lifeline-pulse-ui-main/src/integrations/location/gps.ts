// GPS Location Tracking for Emergency Response
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
}

export interface LocationPermissionStatus {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

export interface LocationTrackingOptions {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
  trackingInterval?: number;
}

class LocationManager {
  private watchId: number | null = null;
  private onLocationCallback?: (location: LocationData) => void;
  private onErrorCallback?: (error: string) => void;
  private isTracking = false;
  private lastKnownLocation: LocationData | null = null;

  // Check if geolocation is supported
  isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  // Check location permission status
  async checkPermissionStatus(): Promise<LocationPermissionStatus> {
    if (!this.isSupported()) {
      return { granted: false, denied: true, prompt: false };
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return {
        granted: permission.state === 'granted',
        denied: permission.state === 'denied',
        prompt: permission.state === 'prompt'
      };
    } catch (error) {
      // Fallback for browsers that don't support permissions API
      return { granted: false, denied: false, prompt: true };
    }
  }

  // Request location permission and get current position
  async getCurrentLocation(options?: Partial<LocationTrackingOptions>): Promise<LocationData> {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported by this browser');
    }

    const defaultOptions: LocationTrackingOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
      ...options
    };

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            timestamp: new Date(position.timestamp)
          };
          
          this.lastKnownLocation = locationData;
          resolve(locationData);
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          this.onErrorCallback?.(errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: defaultOptions.enableHighAccuracy,
          timeout: defaultOptions.timeout,
          maximumAge: defaultOptions.maximumAge
        }
      );
    });
  }

  // Start continuous location tracking
  async startTracking(
    onLocation: (location: LocationData) => void,
    onError?: (error: string) => void,
    options?: Partial<LocationTrackingOptions>
  ): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported by this browser');
    }

    if (this.isTracking) {
      this.stopTracking();
    }

    this.onLocationCallback = onLocation;
    this.onErrorCallback = onError;

    const defaultOptions: LocationTrackingOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
      ...options
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
          timestamp: new Date(position.timestamp)
        };
        
        this.lastKnownLocation = locationData;
        this.onLocationCallback?.(locationData);
      },
      (error) => {
        let errorMessage = 'Location tracking error';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location timeout';
            break;
        }
        this.onErrorCallback?.(errorMessage);
      },
      {
        enableHighAccuracy: defaultOptions.enableHighAccuracy,
        timeout: defaultOptions.timeout,
        maximumAge: defaultOptions.maximumAge
      }
    );

    this.isTracking = true;
    console.log('Location tracking started');
  }

  // Stop location tracking
  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isTracking = false;
      console.log('Location tracking stopped');
    }
  }

  // Get last known location
  getLastKnownLocation(): LocationData | null {
    return this.lastKnownLocation;
  }

  // Check if currently tracking
  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  // Calculate distance between two points (in meters)
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  // Get directions URL for navigation
  getDirectionsUrl(destinationLat: number, destinationLon: number): string {
    const currentLocation = this.getLastKnownLocation();
    if (currentLocation) {
      return `https://www.google.com/maps/dir/${currentLocation.latitude},${currentLocation.longitude}/${destinationLat},${destinationLon}`;
    } else {
      return `https://www.google.com/maps/search/${destinationLat},${destinationLon}`;
    }
  }

  // Format location for display
  formatLocation(location: LocationData): string {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  }

  // Get location accuracy description
  getAccuracyDescription(accuracy: number): string {
    if (accuracy <= 5) return 'Very High';
    if (accuracy <= 10) return 'High';
    if (accuracy <= 50) return 'Medium';
    if (accuracy <= 100) return 'Low';
    return 'Very Low';
  }
}

// Export singleton instance
export const locationManager = new LocationManager();

// Location utilities
export const LocationUtils = {
  // Convert coordinates to address (requires geocoding service)
  async coordinatesToAddress(lat: number, lon: number): Promise<string> {
    try {
      // This would typically use a geocoding service like Google Maps API
      // For now, return coordinates
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    } catch (error) {
      return 'Location unavailable';
    }
  },

  // Check if location is within emergency radius
  isWithinEmergencyRadius(
    patientLat: number, 
    patientLon: number, 
    responderLat: number, 
    responderLon: number, 
    radiusMeters: number = 5000
  ): boolean {
    const distance = locationManager.calculateDistance(
      patientLat, patientLon, responderLat, responderLon
    );
    return distance <= radiusMeters;
  },

  // Get estimated travel time (simplified calculation)
  getEstimatedTravelTime(distanceMeters: number, speedKmh: number = 50): string {
    const timeMinutes = (distanceMeters / 1000) / speedKmh * 60;
    if (timeMinutes < 1) return '< 1 min';
    if (timeMinutes < 60) return `${Math.round(timeMinutes)} min`;
    const hours = Math.floor(timeMinutes / 60);
    const minutes = Math.round(timeMinutes % 60);
    return `${hours}h ${minutes}m`;
  }
};
