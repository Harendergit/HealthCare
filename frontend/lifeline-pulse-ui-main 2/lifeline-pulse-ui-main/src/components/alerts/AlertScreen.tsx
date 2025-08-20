import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Phone, Users, MapPin, Clock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const AlertScreen = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(30);
  const [autoCallStarted, setAutoCallStarted] = useState(false);

  const alertData = {
    condition: "Low Oxygen Detected",
    riskLevel: "High",
    detectedAt: new Date().toLocaleTimeString(),
    currentVitals: {
      heartRate: 95,
      spo2: 89,
      temperature: 99.2
    },
    recommendation: "Immediate medical attention required"
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setAutoCallStarted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleNotifyFamily = () => {
    // Simulate family notification
    console.log("Family notified");
  };

  const handleCallAmbulance = () => {
    setAutoCallStarted(true);
    setCountdown(0);
  };

  const handleCancel = () => {
    navigate("/patient");
  };

  return (
    <div className="min-h-screen bg-gradient-critical p-4">
      {/* Emergency Header */}
      <div className="text-white mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleCancel}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Badge className="bg-white text-critical bg-opacity-90 text-lg px-4 py-2">
            EMERGENCY DETECTED
          </Badge>
        </div>
        
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 animate-pulse" />
          <h1 className="text-3xl font-bold mb-2">MEDICAL EMERGENCY</h1>
          <p className="text-xl opacity-90">{alertData.condition}</p>
        </div>
      </div>

      {/* Alert Details */}
      <Card className="mb-6 shadow-elevated border-2 border-critical">
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
                <p className="text-sm text-muted-foreground">Risk Level</p>
                <Badge className="bg-gradient-critical text-lg">
                  {alertData.riskLevel}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Detected At</p>
                <p className="font-semibold">{alertData.detectedAt}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Current Vitals</p>
              <div className="grid grid-cols-3 gap-3 p-3 bg-muted rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-warning">
                    {alertData.currentVitals.heartRate}
                  </div>
                  <div className="text-xs text-muted-foreground">HR</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-critical">
                    {alertData.currentVitals.spo2}%
                  </div>
                  <div className="text-xs text-muted-foreground">SpO₂</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-warning">
                    {alertData.currentVitals.temperature}°F
                  </div>
                  <div className="text-xs text-muted-foreground">Temp</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-critical/10 rounded-lg border border-critical/20">
              <p className="font-medium text-critical">{alertData.recommendation}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Call Countdown */}
      {!autoCallStarted && countdown > 0 ? (
        <Card className="mb-6 shadow-card border-warning">
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 text-warning mx-auto mb-2" />
            <h3 className="text-lg font-semibold mb-2">Auto-calling ambulance in</h3>
            <div className="text-4xl font-bold text-warning mb-2">{countdown}</div>
            <p className="text-sm text-muted-foreground">seconds</p>
          </CardContent>
        </Card>
      ) : autoCallStarted ? (
        <Card className="mb-6 shadow-card border-success">
          <CardContent className="p-6 text-center">
            <Phone className="h-8 w-8 text-success mx-auto mb-2 animate-pulse" />
            <h3 className="text-lg font-semibold text-success">Calling Emergency Services...</h3>
            <p className="text-sm text-muted-foreground">Help is on the way</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Emergency Actions */}
      <div className="space-y-4 mb-20">
        <Button 
          variant="sos" 
          className="w-full h-16 text-xl"
          onClick={handleCallAmbulance}
          disabled={autoCallStarted}
        >
          <Phone className="h-6 w-6 mr-2" />
          {autoCallStarted ? "CALLING 911..." : "CALL AMBULANCE NOW"}
        </Button>

        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="medical" 
            onClick={handleNotifyFamily}
            className="h-12"
          >
            <Users className="h-5 w-5 mr-2" />
            Notify Family
          </Button>
          <Button 
            variant="outline" 
            className="h-12 border-white text-white hover:bg-white hover:text-critical"
          >
            <MapPin className="h-5 w-5 mr-2" />
            Share Location
          </Button>
        </div>
      </div>

      {/* Cancel Button */}
      <div className="fixed bottom-6 left-4 right-4">
        <Button 
          variant="outline" 
          onClick={handleCancel}
          className="w-full border-white text-white hover:bg-white hover:text-critical"
        >
          False Alarm - Cancel Emergency
        </Button>
      </div>
    </div>
  );
};

export default AlertScreen;