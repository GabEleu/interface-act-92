import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Play, Square, Clock, Database, Download } from "lucide-react";
import { toast } from "sonner";

export const DataRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(60); // Default 60 seconds
  const [currentTime, setCurrentTime] = useState(0);
  const [recordedSessions, setRecordedSessions] = useState<any[]>([]);

  // Timer for recording
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording && currentTime < duration) {
      interval = setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, 1000);
    } else if (currentTime >= duration && isRecording) {
      // Auto-stop and export when duration is reached
      handleStopRecording();
    }

    return () => clearInterval(interval);
  }, [isRecording, currentTime, duration]);

  const handleStartRecording = () => {
    if (duration <= 0) {
      toast.error("Veuillez définir une durée valide");
      return;
    }
    
    setIsRecording(true);
    setCurrentTime(0);
    toast.success(`Enregistrement démarré pour ${duration} secondes`);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    
    // Create new session record
    const newSession = {
      id: Date.now(),
      startTime: new Date(Date.now() - currentTime * 1000).toLocaleString(),
      endTime: new Date().toLocaleString(),
      duration: currentTime,
      plannedDuration: duration,
      dataPoints: currentTime * 10, // Simulate 10 data points per second
    };
    
    setRecordedSessions(prev => [newSession, ...prev]);
    
    // Auto-export CSV
    exportSessionData(newSession);
    
    toast.success("Enregistrement terminé et exporté automatiquement");
    setCurrentTime(0);
  };

  const exportSessionData = (session?: any) => {
    const sessionToExport = session || recordedSessions[0];
    if (!sessionToExport) {
      toast.error("Aucune session à exporter");
      return;
    }

    // Generate simulated CSV data
    const csvData = [];
    csvData.push(["Timestamp", "Sensor1", "Sensor2", "Sensor3", "Vibrator1", "Vibrator2", "Vibrator3"]);
    
    for (let i = 0; i < sessionToExport.dataPoints; i++) {
      const timestamp = new Date(Date.parse(sessionToExport.startTime) + i * 100).toISOString();
      csvData.push([
        timestamp,
        (Math.random() * 100 + 20).toFixed(2),
        (Math.random() * 80 + 30).toFixed(2),
        (Math.random() * 90 + 10).toFixed(2),
        (Math.random() * 50 + 25).toFixed(2),
        (Math.random() * 50 + 25).toFixed(2),
        (Math.random() * 50 + 25).toFixed(2),
      ]);
    }

    const csvContent = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fsr-session-${sessionToExport.id}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("Fichier CSV exporté");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="duration">Durée d'enregistrement (secondes)</Label>
          <Input
            id="duration"
            type="number"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
            disabled={isRecording}
            min="1"
            max="3600"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleStartRecording}
            disabled={isRecording}
            className="flex-1"
          >
            <Play className="h-4 w-4 mr-2" />
            Démarrer
          </Button>
          
          <Button
            onClick={handleStopRecording}
            disabled={!isRecording}
            variant="destructive"
            className="flex-1"
          >
            <Square className="h-4 w-4 mr-2" />
            Arrêter
          </Button>
        </div>

        {/* Recording Status */}
        {isRecording && (
          <Card className="p-4 border-primary/50 bg-primary/5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
                  <span className="font-medium">Enregistrement en cours</span>
                </div>
                <Badge variant="secondary">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Badge>
              </div>
              
              <Progress value={progress} className="h-2" />
              
              <div className="text-sm text-muted-foreground">
                Temps restant: {formatTime(duration - currentTime)}
              </div>
            </div>
          </Card>
        )}
      </div>

      <Separator />

      {/* Recording History */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          <Label className="text-sm font-medium">Sessions enregistrées</Label>
          <Badge variant="outline">{recordedSessions.length}</Badge>
        </div>

        {recordedSessions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Aucune session enregistrée</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recordedSessions.map((session) => (
              <Card key={session.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">
                      Session {session.id}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {session.startTime} • {session.duration}s • {session.dataPoints} points
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportSessionData(session)}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};