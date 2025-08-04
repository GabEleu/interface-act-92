import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  Zap, 
  Wifi, 
  Battery,
  Wrench,
  Brain
} from "lucide-react";
import { toast } from "sonner";

interface Alert {
  id: string;
  type: "error" | "warning" | "info" | "success";
  title: string;
  description: string;
  timestamp: Date;
  source: "hardware" | "software" | "sensor" | "ai";
  severity: "low" | "medium" | "high" | "critical";
  aiDiagnosis?: string;
  resolved: boolean;
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "warning",
    title: "Capteur 2 - Signal faible",
    description: "Le signal du capteur FSR-2 présente une amplitude réduite",
    timestamp: new Date(Date.now() - 300000),
    source: "sensor",
    severity: "medium",
    aiDiagnosis: "Connexion possiblement desserrée ou capteur mal positionné. Vérifier les connexions physiques.",
    resolved: false,
  },
  {
    id: "2",
    type: "error",
    title: "Vibreur 1 - Pas de réponse",
    description: "Le vibreur 1 ne répond pas aux commandes de contrôle",
    timestamp: new Date(Date.now() - 600000),
    source: "hardware",
    severity: "high",
    aiDiagnosis: "Défaillance probable du moteur vibrant ou circuit de pilotage endommagé. Remplacer le composant.",
    resolved: false,
  },
  {
    id: "3",
    type: "info",
    title: "Calibration terminée",
    description: "La calibration automatique des capteurs s'est terminée avec succès",
    timestamp: new Date(Date.now() - 900000),
    source: "software",
    severity: "low",
    resolved: true,
  },
];

export const AlertsPanel = () => {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [showResolved, setShowResolved] = useState(false);

  // Simulate new alerts
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance every 10 seconds
        const newAlert: Alert = {
          id: Date.now().toString(),
          type: Math.random() > 0.7 ? "warning" : "info",
          title: "Détection automatique",
          description: "Nouvelle analyse du comportement des capteurs",
          timestamp: new Date(),
          source: "ai",
          severity: "low",
          aiDiagnosis: "Fonctionnement normal détecté. Aucune action requise.",
          resolved: false,
        };
        
        setAlerts(prev => [newAlert, ...prev]);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getSourceIcon = (source: Alert["source"]) => {
    switch (source) {
      case "hardware":
        return <Zap className="h-3 w-3" />;
      case "software":
        return <Wifi className="h-3 w-3" />;
      case "sensor":
        return <Battery className="h-3 w-3" />;
      case "ai":
        return <Brain className="h-3 w-3" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  const getSeverityColor = (severity: Alert["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-destructive text-destructive-foreground";
      case "high":
        return "bg-destructive/80 text-destructive-foreground";
      case "medium":
        return "bg-warning text-warning-foreground";
      case "low":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, resolved: true }
          : alert
      )
    );
    toast.success("Alerte marquée comme résolue");
  };

  const runAIDiagnosis = (alertId: string) => {
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return;

    // Simulate AI processing
    toast.loading("Analyse IA en cours...", { duration: 2000 });
    
    setTimeout(() => {
      const aiDiagnoses = [
        "Analyse des patterns: Installation correcte détectée. Possible interference électromagnétique.",
        "Corrélation temporelle: Problème de connectivité intermittent identifié.",
        "Modèle prédictif: Usure normale du composant. Maintenance préventive recommandée.",
        "Détection d'anomalie: Configuration non optimale détectée. Ajustement des paramètres suggéré.",
      ];
      
      const diagnosis = aiDiagnoses[Math.floor(Math.random() * aiDiagnoses.length)];
      
      setAlerts(prev => 
        prev.map(a => 
          a.id === alertId 
            ? { ...a, aiDiagnosis: diagnosis }
            : a
        )
      );
      
      toast.success("Diagnostic IA généré");
    }, 2000);
  };

  const filteredAlerts = showResolved 
    ? alerts 
    : alerts.filter(alert => !alert.resolved);

  const alertCounts = {
    total: alerts.length,
    unresolved: alerts.filter(a => !a.resolved).length,
    critical: alerts.filter(a => a.severity === "critical" && !a.resolved).length,
    high: alerts.filter(a => a.severity === "high" && !a.resolved).length,
  };

  return (
    <div className="space-y-4">
      {/* Alert Summary */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">
          Total: {alertCounts.total}
        </Badge>
        <Badge variant="secondary">
          Non résolues: {alertCounts.unresolved}
        </Badge>
        {alertCounts.critical > 0 && (
          <Badge className="bg-destructive text-destructive-foreground">
            Critiques: {alertCounts.critical}
          </Badge>
        )}
        {alertCounts.high > 0 && (
          <Badge className="bg-warning text-warning-foreground">
            Haute: {alertCounts.high}
          </Badge>
        )}
      </div>

      {/* Toggle Show Resolved */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowResolved(!showResolved)}
      >
        {showResolved ? "Masquer" : "Afficher"} les alertes résolues
      </Button>

      <Separator />

      {/* Alerts List */}
      <ScrollArea className="h-80">
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucune alerte {showResolved ? "" : "non résolue"}</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <Card 
                key={alert.id} 
                className={`p-3 ${alert.resolved ? "opacity-60" : ""}`}
              >
                <div className="space-y-3">
                  {/* Alert Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {getAlertIcon(alert.type)}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{alert.title}</span>
                          <Badge 
                            className={getSeverityColor(alert.severity)}
                            variant="outline"
                          >
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {alert.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {getSourceIcon(alert.source)}
                      <span>{alert.timestamp.toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {/* AI Diagnosis */}
                  {alert.aiDiagnosis && (
                    <div className="bg-primary/5 border border-primary/20 rounded-md p-2">
                      <div className="flex items-start gap-2">
                        <Brain className="h-4 w-4 text-primary mt-0.5" />
                        <div>
                          <div className="font-medium text-sm text-primary">
                            Diagnostic IA
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {alert.aiDiagnosis}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!alert.resolved && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Résoudre
                      </Button>
                    )}
                    
                    {!alert.aiDiagnosis && !alert.resolved && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runAIDiagnosis(alert.id)}
                      >
                        <Brain className="h-3 w-3 mr-1" />
                        Analyser IA
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};