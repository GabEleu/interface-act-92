import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Activity, Shield } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const [patientId, setPatientId] = useState("");
  const [deviceRef, setDeviceRef] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientId || !deviceRef) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setIsLoading(true);
    
    // Simulate authentication
    setTimeout(() => {
      localStorage.setItem("patientId", patientId);
      localStorage.setItem("deviceRef", deviceRef);
      toast.success("Connexion réussie");
      navigate("/dashboard");
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/lovable-uploads/e8a4b987-cc7a-4e51-a01e-ac81f1690bea.png" alt="Digi'Skin Logo" className="h-12 object-contain" />
            <h1 className="text-2xl font-bold text-foreground">Digi&apos;Skin Monitor</h1>
          </div>
          <p className="text-muted-foreground">
            Installation du dispositif médical
          </p>
        </div>

        <Card className="shadow-lg border-0 bg-card/95 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Identification Patient
            </CardTitle>
            <CardDescription>
              Entrez vos identifiants pour accéder au système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patientId">Numéro d'identification patient</Label>
                <Input
                  id="patientId"
                  type="text"
                  placeholder="Ex: P-12345"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deviceRef">Référence du dispositif</Label>
                <Input
                  id="deviceRef"
                  type="text"
                  placeholder="Ex: FSR-2024-001"
                  value={deviceRef}
                  onChange={(e) => setDeviceRef(e.target.value)}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Dispositif médical certifié • Données sécurisées</p>
        </div>
      </div>
    </div>
  );
};

export default Login;