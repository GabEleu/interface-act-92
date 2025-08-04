import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Square, Download, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RecordingSession {
  id: string;
  name: string;
  duration: number;
  timestamp: string;
  dataPoints: number;
}

export const EnhancedDataRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(60);
  const [customDuration, setCustomDuration] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [sessions, setSessions] = useState<RecordingSession[]>([]);
  const { toast } = useToast();

  // Predefined durations in seconds
  const presetDurations = [
    { value: 30, label: "30 secondes" },
    { value: 60, label: "1 minute" },
    { value: 300, label: "5 minutes" },
    { value: 600, label: "10 minutes" },
    { value: 1800, label: "30 minutes" },
    { value: 3600, label: "1 heure" },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            handleStopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused, duration]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
    setCurrentTime(0);
    
    toast({
      title: "Enregistrement démarré",
      description: `Durée: ${formatTime(duration)}`,
    });
  };

  const handlePauseRecording = () => {
    setIsPaused(!isPaused);
    
    toast({
      title: isPaused ? "Enregistrement repris" : "Enregistrement en pause",
      description: `Temps écoulé: ${formatTime(currentTime)}`,
    });
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    
    const newSession: RecordingSession = {
      id: Date.now().toString(),
      name: `Session ${sessions.length + 1}`,
      duration: currentTime,
      timestamp: new Date().toISOString(),
      dataPoints: Math.floor(currentTime * 1.5), // Simulated data points
    };
    
    setSessions(prev => [...prev, newSession]);
    exportSessionData(newSession);
    setCurrentTime(0);
    
    toast({
      title: "Enregistrement terminé",
      description: `Session sauvegardée: ${formatTime(currentTime)}`,
    });
  };

  const exportSessionData = (session: RecordingSession) => {
    // Generate simulated CSV data with timestamp in milliseconds
    const startTime = new Date(session.timestamp).getTime();
    const csvContent = [
      ["Timestamp (ms)", "Temps", "Capteur 1", "Capteur 2", "Capteur 3"],
      ...Array.from({ length: session.dataPoints }, (_, i) => {
        const timestamp = startTime + (i * 1000);
        const time = new Date(timestamp).toLocaleTimeString();
        return [
          timestamp,
          time,
          Math.round(Math.random() * 4095),
          Math.round(Math.random() * 4095),
          Math.round(Math.random() * 4095)
        ];
      })
    ].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const timestamp = new Date(session.timestamp).toISOString().replace(/[:.]/g, '-');
    a.download = `fsr-session-${session.id}-${timestamp}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDurationChange = (value: string) => {
    if (value === "custom") {
      setDuration(parseInt(customDuration) || 60);
    } else {
      setDuration(parseInt(value));
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Enregistrement des données</h3>
        </div>

        {/* Duration Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Label>Durée d'enregistrement:</Label>
            <Select 
              value={duration.toString()} 
              onValueChange={handleDurationChange}
              disabled={isRecording}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {presetDurations.map(preset => (
                  <SelectItem key={preset.value} value={preset.value.toString()}>
                    {preset.label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Personnalisé</SelectItem>
              </SelectContent>
            </Select>
            
            {duration.toString() === "custom" && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Secondes"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  className="w-24"
                  disabled={isRecording}
                />
                <Label className="text-sm text-muted-foreground">secondes</Label>
              </div>
            )}
          </div>
        </div>

        {/* Recording Controls */}
        <div className="flex items-center gap-4">
          {!isRecording ? (
            <Button onClick={handleStartRecording} className="bg-primary hover:bg-primary-hover">
              <Play className="h-4 w-4 mr-2" />
              Démarrer
            </Button>
          ) : (
            <>
              <Button onClick={handlePauseRecording} variant="secondary">
                {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                {isPaused ? "Reprendre" : "Pause"}
              </Button>
              <Button onClick={handleStopRecording} variant="destructive">
                <Square className="h-4 w-4 mr-2" />
                Arrêter
              </Button>
            </>
          )}
          
          <Badge variant={isRecording ? (isPaused ? "outline" : "default") : "secondary"}>
            {isRecording ? (isPaused ? "En pause" : "En cours") : "Arrêté"}
          </Badge>
        </div>

        {/* Progress Display */}
        {isRecording && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Progression</span>
              <span className="text-sm font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="text-center text-sm text-muted-foreground">
              Temps restant: {formatTime(Math.max(0, duration - currentTime))}
            </div>
          </div>
        )}

        {/* Sessions List */}
        {sessions.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Sessions enregistrées</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sessions.map(session => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{session.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(session.timestamp).toLocaleString()} • {formatTime(session.duration)} • {session.dataPoints} points
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => exportSessionData(session)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Exporter
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};