import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut, Activity, Settings, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { VibrationControls } from "@/components/VibrationControls";
import { EnhancedSensorChart } from "@/components/EnhancedSensorChart";
import { EnhancedDataRecording } from "@/components/EnhancedDataRecording";
import { AlertsPanel } from "@/components/AlertsPanel";
import { HardwareConnection } from "@/components/HardwareConnection";

const Dashboard = () => {
  const navigate = useNavigate();
  const [patientId, setPatientId] = useState("");
  const [deviceRef, setDeviceRef] = useState("");

  useEffect(() => {
    const savedPatientId = localStorage.getItem("patientId");
    const savedDeviceRef = localStorage.getItem("deviceRef");
    
    if (!savedPatientId || !savedDeviceRef) {
      navigate("/");
      return;
    }
    
    setPatientId(savedPatientId);
    setDeviceRef(savedDeviceRef);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("patientId");
    localStorage.removeItem("deviceRef");
    toast.success("Déconnexion réussie");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-card border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/lovable-uploads/e8a4b987-cc7a-4e51-a01e-ac81f1690bea.png" alt="Digi'Skin Logo" className="h-12 object-contain" />
              <div>
                <h1 className="text-xl font-semibold text-foreground">Digi&apos;Skin Monitor Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Patient: {patientId} • Dispositif: {deviceRef}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Controls Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Vibration Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Contrôles de Vibration
              </CardTitle>
              <CardDescription>
                Réglez l'intensité de base des 3 vibreurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VibrationControls />
            </CardContent>
          </Card>

          {/* Data Recording */}
          <Card>
            <CardHeader>
              <CardTitle>Enregistrement des Données</CardTitle>
              <CardDescription>
                Contrôlez l'acquisition et l'export des données
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedDataRecording />
            </CardContent>
          </Card>

          {/* Hardware Connection */}
          <Card>
            <CardHeader>
              <CardTitle>Connexion Hardware</CardTitle>
              <CardDescription>
                Gérez la connexion TCP avec la carte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HardwareConnection />
            </CardContent>
          </Card>

          {/* Alerts Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Alertes Système
              </CardTitle>
              <CardDescription>
                Surveillance et diagnostic automatisé
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertsPanel />
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Chart Section */}
        <Card>
          <CardHeader>
            <CardTitle>Visualisation des Capteurs FSR</CardTitle>
            <CardDescription>
              Données en temps réel et historiques des 3 capteurs de force
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedSensorChart />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;