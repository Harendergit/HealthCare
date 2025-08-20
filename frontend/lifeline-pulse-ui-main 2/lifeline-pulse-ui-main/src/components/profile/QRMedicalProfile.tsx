import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, User, Heart, Pill, AlertTriangle, ArrowLeft, Share } from "lucide-react";
import { useNavigate } from "react-router-dom";

const QRMedicalProfile = () => {
  const navigate = useNavigate();

  const patientProfile = {
    name: "John Smith",
    age: 45,
    gender: "Male",
    bloodType: "O+",
    weight: "180 lbs",
    height: "5'10\"",
    emergencyContact: {
      name: "Jane Smith",
      relationship: "Spouse",
      phone: "+1 (555) 123-4567"
    },
    medicalInfo: {
      allergies: ["Penicillin", "Shellfish"],
      medications: [
        { name: "Metformin", dosage: "500mg", frequency: "2x daily" },
        { name: "Lisinopril", dosage: "10mg", frequency: "1x daily" }
      ],
      conditions: ["Type 2 Diabetes", "Hypertension"],
      lastUpdated: "2024-01-15"
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="bg-gradient-primary rounded-lg p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate("/patient")}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Medical Profile</h1>
            <p className="opacity-90">Emergency QR Code</p>
          </div>
          <Button 
            variant="outline" 
            size="icon"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Share className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* QR Code */}
      <Card className="mb-6 shadow-elevated">
        <CardContent className="p-8 text-center">
          <div className="bg-white p-6 rounded-lg shadow-inner inline-block mb-4">
            <div className="w-48 h-48 bg-muted flex items-center justify-center rounded-lg">
              <QrCode className="h-32 w-32 text-primary" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Scan for Emergency Info</h3>
          <p className="text-sm text-muted-foreground">
            First responders can scan this code to access critical medical information
          </p>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card className="mb-6 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2 text-primary" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-semibold">{patientProfile.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Age</p>
              <p className="font-semibold">{patientProfile.age} years</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Blood Type</p>
              <Badge className="bg-gradient-critical font-bold">
                {patientProfile.bloodType}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gender</p>
              <p className="font-semibold">{patientProfile.gender}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Height</p>
              <p className="font-semibold">{patientProfile.height}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Weight</p>
              <p className="font-semibold">{patientProfile.weight}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card className="mb-6 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Heart className="h-5 w-5 mr-2 text-primary" />
            Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Contact Name</p>
              <p className="font-semibold">{patientProfile.emergencyContact.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Relationship</p>
              <p className="font-semibold">{patientProfile.emergencyContact.relationship}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone Number</p>
              <p className="font-semibold text-primary">{patientProfile.emergencyContact.phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Allergies */}
      <Card className="mb-6 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-warning" />
            Allergies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {patientProfile.medicalInfo.allergies.map((allergy, index) => (
              <Badge key={index} className="bg-gradient-warning">
                {allergy}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Medications */}
      <Card className="mb-6 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Pill className="h-5 w-5 mr-2 text-primary" />
            Current Medications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {patientProfile.medicalInfo.medications.map((med, index) => (
              <div key={index} className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{med.name}</p>
                    <p className="text-sm text-muted-foreground">{med.dosage} • {med.frequency}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Medical Conditions */}
      <Card className="mb-20 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Heart className="h-5 w-5 mr-2 text-primary" />
            Medical Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {patientProfile.medicalInfo.conditions.map((condition, index) => (
              <div key={index} className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{condition}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Last updated: {patientProfile.medicalInfo.lastUpdated}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="fixed bottom-6 left-4 right-4">
        <Button 
          variant="medical" 
          className="w-full"
          onClick={() => navigate("/patient")}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default QRMedicalProfile;