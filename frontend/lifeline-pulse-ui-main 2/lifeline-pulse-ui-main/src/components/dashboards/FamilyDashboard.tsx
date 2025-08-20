import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Heart, MapPin, Clock, Phone, Navigation, User, Plus, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useVitals } from "@/contexts/VitalsContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { connectFamilyToPatient } from "@/integrations/firebase/auth";

const FamilyDashboard = () => {
  const navigate = useNavigate();
  const { userData, logout } = useAuth();
  const { latestVital } = useVitals();
  const { toast } = useToast();
  const [patientId, setPatientId] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const handleConnectPatient = async () => {
    if (!patientId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid Patient ID",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    try {
      await connectFamilyToPatient(userData!.uid, patientId.trim());
      toast({
        title: "Success",
        description: "Successfully connected to patient",
      });
      setPatientId("");
      setDialogOpen(false);
      // Refresh the page to show new connection
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to patient",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const hasConnectedPatients = userData?.connectedPatients && userData.connectedPatients.length > 0;

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="bg-gradient-primary rounded-lg p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Family Monitor</h1>
            <p className="opacity-90">Welcome, {userData?.displayName || 'Family Member'}</p>
          </div>
          <div className="flex space-x-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <UserPlus className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connect to Patient</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="patientId">Patient ID</Label>
                    <Input
                      id="patientId"
                      placeholder="Enter Patient ID (e.g., P-ABC123-XYZ)"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleConnectPatient}
                    disabled={isConnecting}
                    className="w-full"
                  >
                    {isConnecting ? "Connecting..." : "Connect"}
                  </Button>
                </div>
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

      {/* Patient Status */}
      {hasConnectedPatients ? (
        <Card className="mb-6 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="h-5 w-5 mr-2 text-primary" />
              Patient Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`h-3 w-3 rounded-full ${
                    latestVital ? 'bg-gradient-success animate-pulse' : 'bg-gray-400'
                  }`}></div>
                  <span className="font-medium">
                    {latestVital ? 'Online' : 'Offline'}
                  </span>
                </div>
                <Badge className={
                  latestVital?.isEmergency ? 'bg-gradient-critical' : 'bg-gradient-success'
                }>
                  {latestVital?.isEmergency ? 'Emergency' : 'Normal'}
                </Badge>
              </div>

              {latestVital && (
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {latestVital.heartRate || '--'}
                    </div>
                    <div className="text-xs text-muted-foreground">Heart Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {latestVital.oxygenSaturation || '--'}%
                    </div>
                    <div className="text-xs text-muted-foreground">SpO₂</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {latestVital.temperature || '--'}°F
                    </div>
                    <div className="text-xs text-muted-foreground">Temperature</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2 text-primary" />
              No Connected Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <UserPlus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Connect to a Patient</p>
              <p className="text-muted-foreground mb-4">
                Ask your family member for their Patient ID to start monitoring their health.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Patient
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location */}
      {hasConnectedPatients && (
        <Card className="mb-6 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-primary" />
              Live Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 h-32 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium">Location sharing not available</p>
                  <p className="text-xs text-muted-foreground">Feature coming soon</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" disabled>
                <Navigation className="h-4 w-4 mr-2" />
                Get Directions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Alerts */}
      {hasConnectedPatients && (
        <Card className="mb-20 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-primary" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {latestVital?.isEmergency ? (
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-critical/10 border border-critical/20">
                  <div className="h-2 w-2 rounded-full mt-2 bg-gradient-critical"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-critical">Emergency Alert: Critical Vitals Detected</p>
                    <p className="text-xs text-muted-foreground">
                      {latestVital ? new Date(latestVital.timestamp).toLocaleTimeString() : 'Just now'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-2 w-2 rounded-full mt-2 bg-gradient-success"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">All vitals normal</p>
                    <p className="text-xs text-muted-foreground">
                      {latestVital ? new Date(latestVital.timestamp).toLocaleTimeString() : 'No recent data'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency Actions */}
      {hasConnectedPatients && (
        <div className="fixed bottom-6 left-4 right-4 flex space-x-3">
          <Button variant="medical" className="flex-1">
            <Phone className="h-5 w-5 mr-2" />
            Call Patient
          </Button>
          <Button variant="sos" className="flex-1">
            <Phone className="h-5 w-5 mr-2" />
            Call 911
          </Button>
        </div>
      )}
    </div>
  );
};

export default FamilyDashboard;