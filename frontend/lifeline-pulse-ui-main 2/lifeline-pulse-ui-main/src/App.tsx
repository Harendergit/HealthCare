import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { VitalsProvider } from "./contexts/VitalsContext";
import { useEffect, useState } from "react";
import initializeFirebaseServices from "./integrations/firebase/init";
import ErrorBoundary from "./components/ErrorBoundary";
import LoginScreen from "./components/auth/LoginScreen";
import PatientDashboard from "./components/dashboards/PatientDashboard";
import FamilyDashboard from "./components/dashboards/FamilyDashboard";
import ResponderDashboard from "./components/dashboards/ResponderDashboard";
import AlertScreen from "./components/alerts/AlertScreen";
import QRMedicalProfile from "./components/profile/QRMedicalProfile";

const queryClient = new QueryClient();

// Protected Route component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const { userData } = useAuth();

  if (!userData) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(userData.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { userData } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={userData ? <Navigate to={`/${userData.role}`} replace /> : <LoginScreen />}
        />
        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/family"
          element={
            <ProtectedRoute allowedRoles={['family']}>
              <FamilyDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/responder"
          element={
            <ProtectedRoute allowedRoles={['responder']}>
              <ResponderDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alert"
          element={
            <ProtectedRoute allowedRoles={['responder']}>
              <AlertScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['patient', 'family', 'responder']}>
              <QRMedicalProfile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => {
  useEffect(() => {
    // Initialize Firebase services in the background
    initializeFirebaseServices().then(() => {
      console.log('Firebase services initialized');
    }).catch((error) => {
      console.warn('Firebase initialization warning:', error);
    });
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <VitalsProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <AppRoutes />
            </TooltipProvider>
          </VitalsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;