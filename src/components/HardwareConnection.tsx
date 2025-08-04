import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useHardwareConnection } from "@/hooks/useHardwareConnection";
import { Wifi, WifiOff, Loader2 } from "lucide-react";

export const HardwareConnection = () => {
  const { isConnected, isConnecting, connect, disconnect } = useHardwareConnection();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="h-5 w-5 text-success" />
          ) : (
            <WifiOff className="h-5 w-5 text-muted-foreground" />
          )}
          Connexion Hardware
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Statut:</span>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Connecté" : "Déconnecté"}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          {!isConnected ? (
            <Button 
              onClick={connect} 
              disabled={isConnecting}
              className="flex items-center gap-2"
            >
              {isConnecting && <Loader2 className="h-4 w-4 animate-spin" />}
              Se connecter
            </Button>
          ) : (
            <Button 
              onClick={disconnect} 
              variant="outline"
              className="flex items-center gap-2"
            >
              Se déconnecter
            </Button>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground">
          Adresse: 192.168.4.1:3333
        </div>
      </CardContent>
    </Card>
  );
};