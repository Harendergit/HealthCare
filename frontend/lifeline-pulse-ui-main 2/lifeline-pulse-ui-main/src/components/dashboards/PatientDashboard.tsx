import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Thermometer, Activity, AlertCircle, User, QrCode, Bluetooth, BluetoothConnected, Loader2, MapPin, AlertTriangle, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useVitals } from "@/contexts/VitalsContext";
import { useToast } from "@/hooks/use-toast";
import { VitalsSimulator } from "@/utils/demoData";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import MedicalProfileManager from "@/components/profile/MedicalProfileManager";

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { userData, logout } = useAuth();
  const {
    latestVital,
    isBluetoothSupported,
    connectedDevices,
    connectHeartRateMonitor,
    connectPulseOximeter,
    connectThermometer,
    disconnectDevice,
    currentLocation,
    isLocationSupported,
    startLocationTracking,
    stopLocationTracking,
    triggerSOS,
    cancelSOS,
    isSOSActive,
    notificationsEnabled,
    requestNotificationPermission,
    loading
  } = useVitals();
  const { toast } = useToast();
  const [vitalsSimulator, setVitalsSimulator] = useState<VitalsSimulator | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [startDate, setStartDate] = useState("2025-08-01");
  const [endDate, setEndDate] = useState("2025-08-20");
  const [target, setTarget] = useState("heart_rate");

  const validFeatures = [
    "heart_rate",
    "steps",
    "hour",
    "hr_rolling_avg",
    "sleep_deep_minutes",
    "sleep_light_minutes",
    "sleep_rem_minutes",
    "sleep_awakenings",
    "hrv_rmssd",
    "hrv_coverage",
    "primary_non_step_activity_stationary_bike",
    "caffeine_user_yes",
    "reports_high_stress_no"
  ];

  // Initialize vitals simulator
  useEffect(() => {
    if (userData?.patientId && !vitalsSimulator) {
      const simulator = new VitalsSimulator(userData.patientId);
      setVitalsSimulator(simulator);
    }
  }, [userData?.patientId, vitalsSimulator]);

  // Request permissions on component mount
  useEffect(() => {
    const requestPermissions = async () => {
      // Request notification permission
      if (!notificationsEnabled) {
        try {
          await requestNotificationPermission();
        } catch (error) {
          console.warn('Notification permission denied');
        }
      }

      // Start location tracking for emergency purposes
      if (isLocationSupported && !currentLocation) {
        try {
          await startLocationTracking();
        } catch (error) {
          console.warn('Location tracking permission denied');
        }
      }
    };

    requestPermissions();
  }, []);

  const handleLocationToggle = async () => {
    if (currentLocation) {
      stopLocationTracking();
      toast({
        title: "Location Tracking Stopped",
        description: "Location sharing has been disabled",
      });
    } else {
      try {
        await startLocationTracking();
        toast({
          title: "Location Tracking Started",
          description: "Location sharing enabled for emergency response",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to start location tracking",
          variant: "destructive"
        });
      }
    }
  };

  // Get vitals from real data or show defaults
  const getVitalValue = (type: string) => {
    if (!latestVital) return null;

    switch (type) {
      case 'heartRate':
        return latestVital.heartRate;
      case 'spo2':
        return latestVital.oxygenSaturation;
      case 'temperature':
        return latestVital.temperature;
      default:
        return null;
    }
  };

  const getVitalStatus = (type: string, value: number | undefined) => {
    if (!value) return 'unknown';

    switch (type) {
      case 'heartRate':
        return value < 60 || value > 100 ? 'critical' : 'normal';
      case 'spo2':
        return value < 90 ? 'critical' : value < 95 ? 'warning' : 'normal';
      case 'temperature':
        return value < 96.8 || value > 100.4 ? 'critical' : 'normal';
      default:
        return 'normal';
    }
  };

  const vitals = [
    {
      id: "heartRate",
      label: "Heart Rate",
      value: getVitalValue('heartRate')?.toString() || "--",
      unit: "BPM",
      status: getVitalStatus('heartRate', getVitalValue('heartRate')),
      icon: Heart,
      range: "60-100"
    },
    {
      id: "spo2",
      label: "SpO₂",
      value: getVitalValue('spo2')?.toString() || "--",
      unit: "%",
      status: getVitalStatus('spo2', getVitalValue('spo2')),
      icon: Activity,
      range: "95-100"
    },
    {
      id: "temperature",
      label: "Temperature",
      value: getVitalValue('temperature')?.toString() || "--",
      unit: "°F",
      status: getVitalStatus('temperature', getVitalValue('temperature')),
      icon: Thermometer,
      range: "97-99"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal": return "success";
      case "warning": return "warning";
      case "critical": return "critical";
      case "unknown": return "secondary";
      default: return "success";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "normal": return "Normal";
      case "warning": return "Warning";
      case "critical": return "Critical";
      case "unknown": return "No Data";
      default: return "Normal";
    }
  };

  const handleSOS = async () => {
    if (isSOSActive) {
      try {
        await cancelSOS();
        toast({
          title: "SOS Cancelled",
          description: "Emergency alert has been cancelled",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to cancel SOS",
          variant: "destructive"
        });
      }
    } else {
      try {
        await triggerSOS("Manual SOS activated from patient dashboard");
        toast({
          title: "SOS Activated",
          description: "Emergency alert sent to responders",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to send SOS",
          variant: "destructive"
        });
      }
    }
  };

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

  const handleSimulateVitals = (type: 'normal' | 'warning' | 'critical') => {
    if (!vitalsSimulator) {
      console.error('VitalsSimulator not initialized');
      toast({
        title: "Error",
        description: "Vitals simulator not available",
        variant: "destructive"
      });
      return;
    }

    console.log('Simulating vitals:', type);
    const isEmergency = type === 'critical';
    vitalsSimulator.addSingleReading(isEmergency);
    toast({
      title: "Vitals Simulated",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} vitals data added`,
    });
  };

  const handleConnectDevice = async (deviceType: 'heart' | 'oximeter' | 'thermometer') => {
    try {
      switch (deviceType) {
        case 'heart':
          await connectHeartRateMonitor();
          toast({
            title: "Success",
            description: "Heart rate monitor connected",
          });
          break;
        case 'oximeter':
          await connectPulseOximeter();
          toast({
            title: "Success",
            description: "Pulse oximeter connected",
          });
          break;
        case 'thermometer':
          await connectThermometer();
          toast({
            title: "Success",
            description: "Thermometer connected",
          });
          break;
      }
    } catch (error: any) {
      // Only show error toast for serious errors, not for user cancellation or device not found
      if (!error.message?.includes('No heart rate monitor found') &&
          !error.message?.includes('User cancelled') &&
          !error.message?.includes('globally disabled')) {
        toast({
          title: "Connection Failed",
          description: error.message || "Failed to connect device",
          variant: "destructive"
        });
      }
      console.log('Device connection attempt:', error.message);
    }
  };

  async function fetchAnalysis(startDate: string, endDate: string, target: string) {
    setAnalysisLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/analyze_range?start_date=${startDate}&end_date=${endDate}&target=${target}`
      );
      const data = await response.json();
      setAnalysisResult(data);
    } catch (error) {
      toast({ title: "API Error", description: String(error) });
    } finally {
      setAnalysisLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="bg-gradient-primary rounded-lg p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {userData?.displayName || 'Patient'}</h1>
            <p className="opacity-90">Patient Dashboard</p>
            {userData?.patientId && (
              <p className="text-sm opacity-75">ID: {userData.patientId}</p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/profile")}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <QrCode className="h-5 w-5" />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <FileText className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Medical Profile Management</DialogTitle>
                </DialogHeader>
                <MedicalProfileManager />
              </DialogContent>
            </Dialog>
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
      </div>

      {/* Live Vitals */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Live Vitals</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {vitals.map((vital) => {
            const Icon = vital.icon;
            const statusColor = getStatusColor(vital.status);
            
            return (
              <Card key={vital.id} className="shadow-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {vital.label}
                    </CardTitle>
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-bold">{vital.value}</span>
                      <span className="text-lg text-muted-foreground">{vital.unit}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant={statusColor === "success" ? "default" : "destructive"}
                        className={`${
                          statusColor === "success" ? "bg-gradient-success" :
                          statusColor === "warning" ? "bg-gradient-warning" :
                          "bg-gradient-critical"
                        }`}
                      >
                        {getStatusText(vital.status)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Normal: {vital.range}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Bluetooth Devices */}
      <Card className="mb-8 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bluetooth className="h-5 w-5 mr-2 text-primary" />
            Medical Devices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isBluetoothSupported ? (
            <div className="space-y-4">
              <div className="grid gap-2 md:grid-cols-3">
                <Button
                  variant="outline"
                  onClick={() => handleConnectDevice('heart')}
                  disabled={loading}
                  className="flex items-center justify-center"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Heart className="h-4 w-4 mr-2" />
                  )}
                  Heart Rate Monitor
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleConnectDevice('oximeter')}
                  disabled={loading}
                  className="flex items-center justify-center"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Activity className="h-4 w-4 mr-2" />
                  )}
                  Pulse Oximeter
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleConnectDevice('thermometer')}
                  disabled={loading}
                  className="flex items-center justify-center"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Thermometer className="h-4 w-4 mr-2" />
                  )}
                  Thermometer
                </Button>
              </div>

              {connectedDevices.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Connected Devices:</h4>
                  <div className="space-y-2">
                    {connectedDevices.map((device) => (
                      <div key={device.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <div className="flex items-center space-x-2">
                          <BluetoothConnected className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">{device.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => disconnectDevice(device.id)}
                        >
                          Disconnect
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Bluetooth className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-lg mb-2">Bluetooth Not Available</h3>
              <p className="text-muted-foreground mb-4">
                Web Bluetooth is not supported or is disabled in your browser.
              </p>
              <p className="text-sm text-muted-foreground">
                To connect medical devices, please use Chrome, Edge, or Opera with Bluetooth enabled.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location & Permissions */}
      <Card className="mb-8 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-primary" />
            Location & Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Location Status */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <MapPin className={`h-5 w-5 ${currentLocation ? 'text-success' : 'text-muted-foreground'}`} />
                <div>
                  <p className="font-medium">Location Tracking</p>
                  <p className="text-sm text-muted-foreground">
                    {currentLocation
                      ? `Active (Accuracy: ${currentLocation.accuracy.toFixed(0)}m)`
                      : 'Disabled'
                    }
                  </p>
                </div>
              </div>
              <Button
                variant={currentLocation ? "destructive" : "outline"}
                size="sm"
                onClick={handleLocationToggle}
                disabled={!isLocationSupported}
              >
                {currentLocation ? 'Stop' : 'Start'}
              </Button>
            </div>

            {/* Notification Status */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertCircle className={`h-5 w-5 ${notificationsEnabled ? 'text-success' : 'text-warning'}`} />
                <div>
                  <p className="font-medium">Emergency Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    {notificationsEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
              {!notificationsEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestNotificationPermission}
                >
                  Enable
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Controls (for testing) */}
      {vitalsSimulator && (
        <Card className="mb-8 shadow-card border-dashed border-2 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <Activity className="h-5 w-5 mr-2" />
              Demo Controls (Testing)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-4">
              <Button
                variant="outline"
                onClick={() => handleSimulateVitals('normal')}
                className="text-sm border-success text-success"
              >
                Add Normal Vitals
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSimulateVitals('critical')}
                className="text-sm border-critical text-critical"
              >
                Add Emergency Vitals
              </Button>
              <Button
                variant="outline"
                onClick={() => vitalsSimulator?.start(false)}
                className="text-sm border-success text-success"
              >
                Start Normal Simulation
              </Button>
              <Button
                variant="outline"
                onClick={() => vitalsSimulator?.start(true)}
                className="text-sm border-critical text-critical"
              >
                Start Emergency Simulation
              </Button>
            </div>
            <div className="mt-2">
              <Button
                variant="ghost"
                onClick={() => vitalsSimulator?.stop()}
                className="text-sm"
              >
                Stop Simulation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Status */}
      <Card className="mb-8 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-primary" />
            Health Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className={`h-4 w-4 rounded-full ${
              latestVital?.isEmergency ? 'bg-gradient-critical' : 'bg-gradient-success'
            }`}></div>
            <div>
              <p className="font-medium">
                {latestVital?.isEmergency ? 'Emergency Alert - Vitals Critical' : 'All vitals normal'}
              </p>
              <p className="text-sm text-muted-foreground">
                Last updated: {latestVital ? new Date(latestVital.timestamp).toLocaleTimeString() : 'No data'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Section */}
      <Card className="mb-8 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-primary" />
            Anomaly Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="mt-1 block w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="mt-1 block w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Target Feature</label>
                <select
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                  className="mt-1 block w-full p-2 border rounded-md"
                >
                  {validFeatures.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
            <Button
              onClick={() => fetchAnalysis(startDate, endDate, target)}
              disabled={analysisLoading}
              className="w-full"
            >
              {analysisLoading ? "Analyzing..." : "Analyze Data"}
            </Button>
            {analysisResult && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="text-sm font-medium mb-2">Analysis Result:</h4>
                <pre className="text-xs text-muted-foreground">
                  {JSON.stringify(analysisResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Emergency SOS Button */}
      <div className="fixed bottom-6 left-4 right-4">
        <Button
          variant={isSOSActive ? "destructive" : "sos"}
          onClick={handleSOS}
          className={`w-full h-16 text-xl font-bold ${isSOSActive ? 'animate-pulse' : ''}`}
          disabled={loading}
        >
          <AlertTriangle className="h-8 w-8 mr-2" />
          {isSOSActive ? 'CANCEL SOS' : 'EMERGENCY SOS'}
        </Button>
      </div>


    </div>
  );
};

export default PatientDashboard;