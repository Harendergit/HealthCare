import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User, Phone, Navigation, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { subscribeToEmergencyAlerts } from "@/integrations/firebase/vitals";

const ResponderDashboard = () => {
  const navigate = useNavigate();
  const { userData, logout } = useAuth();
  const { toast } = useToast();
  const [emergencyAlerts, setEmergencyAlerts] = useState<any[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);

  // Subscribe to emergency alerts
  useEffect(() => {
    const unsubscribe = subscribeToEmergencyAlerts((alerts) => {
      setEmergencyAlerts(alerts);
      if (alerts.length > 0 && !selectedAlert) {
        setSelectedAlert(alerts[0]);
      }
    });

    return unsubscribe;
  }, [selectedAlert]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive"
      });
    }
  };

  const handleAcceptEmergency = () => {
    if (selectedAlert) {
      toast({
        title: "Emergency Accepted",
        description: "You are now responding to this emergency",
      });
      // In a real app, you would update the alert status in Firebase
    }
  };

  const handleRejectEmergency = () => {
    if (selectedAlert) {
      // Move to next alert or clear if none
      const currentIndex = emergencyAlerts.findIndex(alert => alert.id === selectedAlert.id);
      const nextAlert = emergencyAlerts[currentIndex + 1] || null;
      setSelectedAlert(nextAlert);

      if (!nextAlert) {
        toast({
          title: "Alert Declined",
          description: "No more active emergencies",
        });
      }
    }
  };

  const getVitalStatus = (vital: string, value: number) => {
    switch (vital) {
      case 'heartRate':
        return value < 60 || value > 100 ? 'critical' : value < 70 || value > 90 ? 'warning' : 'normal';
      case 'oxygenSaturation':
        return value < 90 ? 'critical' : value < 95 ? 'warning' : 'normal';
      case 'temperature':
        return value < 96.8 || value > 100.4 ? 'critical' : value < 97.5 || value > 99.5 ? 'warning' : 'normal';
      default:
        return 'normal';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-critical';
      case 'warning': return 'text-warning';
      default: return 'text-success';
    }
  };

  if (!selectedAlert) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="bg-gradient-primary rounded-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Responder Dashboard</h1>
              <p className="opacity-90">Welcome, {userData?.displayName || 'Responder'}</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleLogout}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Active Emergencies</h3>
            <p className="text-muted-foreground">
              You're on standby. We'll notify you when help is needed.
            </p>
            <div className="mt-4 text-sm text-muted-foreground">
              Monitoring {emergencyAlerts.length} total alerts
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="bg-gradient-critical rounded-lg p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🚨 EMERGENCY ALERT</h1>
            <p className="opacity-90">Immediate response required</p>
          </div>
          <Badge className="bg-white text-critical-foreground bg-opacity-90">
            HIGH PRIORITY
          </Badge>
        </div>
      </div>

      {/* Emergency Details */}
      <Card className="mb-6 shadow-elevated border-critical">
        <CardHeader>
          <CardTitle className="flex items-center text-critical">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Emergency Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Patient ID</p>
                <p className="font-semibold">{selectedAlert.patientId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Alert Time</p>
                <p className="font-semibold">
                  {new Date(selectedAlert.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Condition</p>
              <p className="font-semibold text-critical">
                {selectedAlert.alertType === 'vital_threshold_exceeded'
                  ? 'Critical Vital Signs Detected'
                  : selectedAlert.alertType}
              </p>
            </div>

            {selectedAlert.vitalReading && (
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                {selectedAlert.vitalReading.heartRate && (
                  <div className="text-center">
                    <div className={`text-lg font-bold ${
                      getStatusColor(getVitalStatus('heartRate', selectedAlert.vitalReading.heartRate))
                    }`}>
                      {selectedAlert.vitalReading.heartRate}
                    </div>
                    <div className="text-xs text-muted-foreground">Heart Rate</div>
                  </div>
                )}
                {selectedAlert.vitalReading.oxygenSaturation && (
                  <div className="text-center">
                    <div className={`text-lg font-bold ${
                      getStatusColor(getVitalStatus('oxygenSaturation', selectedAlert.vitalReading.oxygenSaturation))
                    }`}>
                      {selectedAlert.vitalReading.oxygenSaturation}%
                    </div>
                    <div className="text-xs text-muted-foreground">SpO₂</div>
                  </div>
                )}
                {selectedAlert.vitalReading.temperature && (
                  <div className="text-center">
                    <div className={`text-lg font-bold ${
                      getStatusColor(getVitalStatus('temperature', selectedAlert.vitalReading.temperature))
                    }`}>
                      {selectedAlert.vitalReading.temperature}°F
                    </div>
                    <div className="text-xs text-muted-foreground">Temperature</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Location & Route */}
      <Card className="mb-6 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-primary" />
            Location & Route
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4 h-32 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-8 w-8 text-critical mx-auto mb-2" />
                <p className="text-sm font-medium">Location not available</p>
                <p className="text-xs text-muted-foreground">
                  GPS tracking coming soon
                </p>
              </div>
            </div>
            
            <Button variant="medical" className="w-full">
              <Navigation className="h-4 w-4 mr-2" />
              Start Navigation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Medical Information */}
      <Card className="mb-20 shadow-card">
        <CardHeader>
          <CardTitle>Medical Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Blood Type:</span>
              <span className="font-medium">Not available</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Allergies:</span>
              <span className="font-medium">Not available</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Medications:</span>
              <span className="font-medium">Not available</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Medical profile will be available when patient completes their profile
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="fixed bottom-6 left-4 right-4 flex space-x-3">
        <Button 
          variant="outline" 
          className="flex-1 border-critical text-critical hover:bg-critical hover:text-white"
          onClick={handleRejectEmergency}
        >
          <XCircle className="h-5 w-5 mr-2" />
          Decline
        </Button>
        <Button 
          variant="success" 
          className="flex-1"
          onClick={handleAcceptEmergency}
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          Accept & Respond
        </Button>
      </div>
    </div>
  );
};

export default ResponderDashboard;