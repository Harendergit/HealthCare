import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Heart, Shield, Users, Phone, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const LoginScreen = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const roles = [
    {
      id: "patient",
      title: "Patient",
      description: "Monitor your health vitals",
      icon: Heart,
      path: "/patient"
    },
    {
      id: "family",
      title: "Family Member",
      description: "Monitor loved ones",
      icon: Users,
      path: "/family"
    },
    {
      id: "responder",
      title: "Emergency Responder",
      description: "Respond to emergencies",
      icon: Shield,
      path: "/responder"
    }
  ];

  const handleSubmit = async () => {
    if (!selectedRole || !email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (isSignUp && !displayName) {
      toast({
        title: "Error",
        description: "Please enter your display name",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        console.log('Creating user with role:', selectedRole);
        const userData = await signUp(email, password, selectedRole as 'patient' | 'family' | 'responder', displayName);
        console.log('User created successfully:', userData);

        toast({
          title: "Success",
          description: `Account created successfully! ${userData.patientId ? `Your Patient ID: ${userData.patientId}` : ''}`,
        });
      } else {
        await signIn(email, password);
        toast({
          title: "Success",
          description: "Logged in successfully!",
        });
      }
      navigate(`/${selectedRole}`);
    } catch (error: any) {
      console.error('Authentication error:', error);

      let errorMessage = "Authentication failed";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Email is already registered. Please sign in instead.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password should be at least 6 characters.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center text-white">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-12 w-12 mr-2" />
            <Phone className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold">LifeLine360</h1>
          <p className="text-lg opacity-90">Emergency Health Prediction</p>
        </div>

        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle className="text-center">
              {isSignUp ? "Create Account" : "Sign In"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Role Selection */}
            <div className="grid gap-3">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedRole === role.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-6 w-6 text-primary" />
                      <div>
                        <h3 className="font-medium">{role.title}</h3>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Auth Form */}
            <div className="space-y-3">
              {isSignUp && (
                <div>
                  <Label htmlFor="displayName">Full Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Enter your full name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              )}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading || !selectedRole || !email || !password || (isSignUp && !displayName)}
              className="w-full bg-gradient-primary hover:opacity-90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSignUp ? "Creating Account..." : "Signing In..."}
                </>
              ) : (
                isSignUp ? "Create Account" : "Sign In"
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <span
                className="text-primary cursor-pointer hover:underline"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginScreen;