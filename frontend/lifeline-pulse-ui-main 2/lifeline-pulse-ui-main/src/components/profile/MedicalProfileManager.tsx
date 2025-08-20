import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, 
  Heart, 
  Pill, 
  AlertTriangle, 
  Phone, 
  Plus, 
  X, 
  Edit, 
  Save,
  Shield,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  MedicalProfile, 
  EmergencyContact, 
  Medication,
  getMedicalProfile,
  createMedicalProfile,
  updateMedicalProfile,
  addEmergencyContact,
  addMedication,
  removeEmergencyContact,
  removeMedication
} from "@/integrations/firebase/medical";

const MedicalProfileManager: React.FC = () => {
  const { userData } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<MedicalProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Form states
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState('');
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);
  const [newCondition, setNewCondition] = useState('');
  
  // Emergency contact form
  const [newContact, setNewContact] = useState<Partial<EmergencyContact>>({
    name: '',
    relationship: '',
    phoneNumber: '',
    email: '',
    isPrimary: false
  });
  
  // Medication form
  const [newMedication, setNewMedication] = useState<Partial<Medication>>({
    name: '',
    dosage: '',
    frequency: '',
    prescribedBy: '',
    notes: '',
    active: true
  });

  useEffect(() => {
    loadProfile();
  }, [userData?.patientId]);

  const loadProfile = async () => {
    if (!userData?.patientId) return;
    
    setLoading(true);
    try {
      const existingProfile = await getMedicalProfile(userData.patientId);
      if (existingProfile) {
        setProfile(existingProfile);
        setBloodType(existingProfile.bloodType || '');
        setAllergies(existingProfile.allergies || []);
        setMedicalConditions(existingProfile.medicalConditions || []);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!userData?.patientId) return;
    
    setLoading(true);
    try {
      const profileData = {
        patientId: userData.patientId,
        bloodType,
        allergies,
        medications: profile?.medications || [],
        medicalConditions,
        emergencyContacts: profile?.emergencyContacts || [],
        medicalHistory: profile?.medicalHistory || []
      };

      if (profile?.id) {
        await updateMedicalProfile(profile.id, profileData);
        toast({
          title: "Profile Updated",
          description: "Your medical profile has been updated successfully.",
        });
      } else {
        const newProfileId = await createMedicalProfile(profileData);
        toast({
          title: "Profile Created",
          description: "Your medical profile has been created successfully.",
        });
        // Reload to get the full profile with ID
        await loadProfile();
      }
      
      setEditMode(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addAllergyHandler = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy('');
    }
  };

  const removeAllergy = (allergy: string) => {
    setAllergies(allergies.filter(a => a !== allergy));
  };

  const addConditionHandler = () => {
    if (newCondition.trim() && !medicalConditions.includes(newCondition.trim())) {
      setMedicalConditions([...medicalConditions, newCondition.trim()]);
      setNewCondition('');
    }
  };

  const removeCondition = (condition: string) => {
    setMedicalConditions(medicalConditions.filter(c => c !== condition));
  };

  const addEmergencyContactHandler = async () => {
    if (!userData?.patientId || !newContact.name || !newContact.phoneNumber) {
      toast({
        title: "Error",
        description: "Name and phone number are required",
        variant: "destructive"
      });
      return;
    }

    try {
      await addEmergencyContact(userData.patientId, {
        ...newContact,
        id: '',
        name: newContact.name!,
        relationship: newContact.relationship!,
        phoneNumber: newContact.phoneNumber!,
        isPrimary: newContact.isPrimary!
      });
      
      setNewContact({
        name: '',
        relationship: '',
        phoneNumber: '',
        email: '',
        isPrimary: false
      });
      
      await loadProfile();
      
      toast({
        title: "Contact Added",
        description: "Emergency contact has been added successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add emergency contact",
        variant: "destructive"
      });
    }
  };

  const addMedicationHandler = async () => {
    if (!userData?.patientId || !newMedication.name || !newMedication.dosage) {
      toast({
        title: "Error",
        description: "Medication name and dosage are required",
        variant: "destructive"
      });
      return;
    }

    try {
      await addMedication(userData.patientId, {
        ...newMedication,
        id: '',
        name: newMedication.name!,
        dosage: newMedication.dosage!,
        frequency: newMedication.frequency!,
        prescribedBy: newMedication.prescribedBy!,
        startDate: new Date(),
        active: newMedication.active!
      });
      
      setNewMedication({
        name: '',
        dosage: '',
        frequency: '',
        prescribedBy: '',
        notes: '',
        active: true
      });
      
      await loadProfile();
      
      toast({
        title: "Medication Added",
        description: "Medication has been added successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add medication",
        variant: "destructive"
      });
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading medical profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Medical Profile</h2>
        </div>
        <Button
          onClick={() => editMode ? saveProfile() : setEditMode(true)}
          disabled={loading}
          variant={editMode ? "default" : "outline"}
        >
          {editMode ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Profile
            </>
          ) : (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bloodType">Blood Type</Label>
              {editMode ? (
                <Select value={bloodType} onValueChange={setBloodType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-lg font-medium">{bloodType || 'Not specified'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Allergies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Allergies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {allergies.map((allergy, index) => (
              <Badge key={index} variant="destructive" className="flex items-center gap-1">
                {allergy}
                {editMode && (
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeAllergy(allergy)}
                  />
                )}
              </Badge>
            ))}
            {allergies.length === 0 && (
              <p className="text-muted-foreground">No allergies recorded</p>
            )}
          </div>
          
          {editMode && (
            <div className="flex gap-2">
              <Input
                placeholder="Add new allergy"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addAllergyHandler()}
              />
              <Button onClick={addAllergyHandler} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medical Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Heart className="h-5 w-5 mr-2" />
            Medical Conditions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {medicalConditions.map((condition, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {condition}
                {editMode && (
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeCondition(condition)}
                  />
                )}
              </Badge>
            ))}
            {medicalConditions.length === 0 && (
              <p className="text-muted-foreground">No medical conditions recorded</p>
            )}
          </div>
          
          {editMode && (
            <div className="flex gap-2">
              <Input
                placeholder="Add medical condition"
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addConditionHandler()}
              />
              <Button onClick={addConditionHandler} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              Emergency Contacts
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Emergency Contact</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="contactName">Name *</Label>
                    <Input
                      id="contactName"
                      value={newContact.name}
                      onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                      placeholder="Contact name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="relationship">Relationship</Label>
                    <Input
                      id="relationship"
                      value={newContact.relationship}
                      onChange={(e) => setNewContact({...newContact, relationship: e.target.value})}
                      placeholder="e.g., Spouse, Parent, Sibling"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      value={newContact.phoneNumber}
                      onChange={(e) => setNewContact({...newContact, phoneNumber: e.target.value})}
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                      placeholder="Email address"
                    />
                  </div>
                  <Button onClick={addEmergencyContactHandler} className="w-full">
                    Add Contact
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {profile?.emergencyContacts?.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                  <p className="text-sm">{contact.phoneNumber}</p>
                  {contact.email && <p className="text-sm text-muted-foreground">{contact.email}</p>}
                </div>
                {contact.isPrimary && (
                  <Badge variant="default">Primary</Badge>
                )}
              </div>
            ))}
            {(!profile?.emergencyContacts || profile.emergencyContacts.length === 0) && (
              <p className="text-muted-foreground">No emergency contacts added</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Medications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Pill className="h-5 w-5 mr-2" />
              Current Medications
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medication
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Medication</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="medName">Medication Name *</Label>
                    <Input
                      id="medName"
                      value={newMedication.name}
                      onChange={(e) => setNewMedication({...newMedication, name: e.target.value})}
                      placeholder="Medication name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dosage">Dosage *</Label>
                    <Input
                      id="dosage"
                      value={newMedication.dosage}
                      onChange={(e) => setNewMedication({...newMedication, dosage: e.target.value})}
                      placeholder="e.g., 10mg, 1 tablet"
                    />
                  </div>
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Input
                      id="frequency"
                      value={newMedication.frequency}
                      onChange={(e) => setNewMedication({...newMedication, frequency: e.target.value})}
                      placeholder="e.g., Twice daily, As needed"
                    />
                  </div>
                  <div>
                    <Label htmlFor="prescribedBy">Prescribed By</Label>
                    <Input
                      id="prescribedBy"
                      value={newMedication.prescribedBy}
                      onChange={(e) => setNewMedication({...newMedication, prescribedBy: e.target.value})}
                      placeholder="Doctor name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newMedication.notes}
                      onChange={(e) => setNewMedication({...newMedication, notes: e.target.value})}
                      placeholder="Additional notes"
                    />
                  </div>
                  <Button onClick={addMedicationHandler} className="w-full">
                    Add Medication
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {profile?.medications?.filter(med => med.active).map((medication) => (
              <div key={medication.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{medication.name}</p>
                  <p className="text-sm text-muted-foreground">{medication.dosage}</p>
                  <p className="text-sm text-muted-foreground">{medication.frequency}</p>
                  {medication.prescribedBy && (
                    <p className="text-xs text-muted-foreground">Prescribed by: {medication.prescribedBy}</p>
                  )}
                </div>
                <Badge variant="default">Active</Badge>
              </div>
            ))}
            {(!profile?.medications || profile.medications.filter(med => med.active).length === 0) && (
              <p className="text-muted-foreground">No current medications</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicalProfileManager;
