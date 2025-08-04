import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Activity, Download, Eye, EyeOff, RotateCcw, Camera, FileText, ZoomIn, Play, Pause } from "lucide-react";

interface ChartControlsProps {
  selectedDatasets: string[];
  historicalDatasets: Array<{ id: string; label: string }>;
  isRealTime: boolean;
  isRecording: boolean;
  visibleSensors: Record<string, boolean>;
  sensorConfigs: Array<{
    key: string;
    label: string;
    color: string;
    bgColor: string;
  }>;
  thresholds: {
    general: { warning: number };
  };
  onDatasetToggle: (datasetId: string) => void;
  onSensorToggle: (sensor: string) => void;
  onExportData: () => void;
  onReset: () => void;
  onScreenshot: () => void;
  onExportPDF: () => void;
  onThresholdChange: (sensor: string, type: 'warning' | 'danger', value: number) => void;
  onZoom: () => void;
  isPaused: boolean;
  onPauseToggle: () => void;
  onRecordingToggle: () => void;
}

export const ChartControls = ({
  selectedDatasets,
  historicalDatasets,
  isRealTime,
  isRecording,
  visibleSensors,
  sensorConfigs,
  thresholds,
  onDatasetToggle,
  onSensorToggle,
  onExportData,
  onReset,
  onScreenshot,
  onExportPDF,
  onThresholdChange,
  onZoom,
  isPaused,
  onPauseToggle,
  onRecordingToggle,
}: ChartControlsProps) => {
  return (
    <div className="space-y-4">
      {/* Main Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Historical Data Selection */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Données historiques (affichage en pointillés):</Label>
            <div className="flex flex-wrap gap-2">
              {historicalDatasets
                .filter(dataset => dataset.id !== "current")
                .map(dataset => (
                <div key={dataset.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={dataset.id}
                    checked={selectedDatasets.includes(dataset.id)}
                    onCheckedChange={() => onDatasetToggle(dataset.id)}
                  />
                  <Label htmlFor={dataset.id} className="text-xs cursor-pointer">
                    {dataset.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time indicator */}
          {isRealTime && !isPaused && (
            <Badge className="bg-success text-success-foreground">
              <Activity className="h-3 w-3 mr-1 animate-pulse" />
              Temps réel
            </Badge>
          )}

          {isPaused && (
            <Badge variant="outline">
              <Pause className="h-3 w-3 mr-1" />
              En pause
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={onRecordingToggle} 
            variant={isRecording ? "destructive" : "default"}
            size="sm"
          >
            {isRecording ? "Arrêter" : "Démarrer"} l'enregistrement
          </Button>
          {isRealTime && isRecording && (
            <Button onClick={onPauseToggle} variant="outline" size="sm">
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
          )}
          <Button onClick={onReset} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button onClick={onScreenshot} variant="outline" size="sm">
            <Camera className="h-4 w-4" />
          </Button>
          <Button onClick={onExportPDF} variant="outline" size="sm">
            <FileText className="h-4 w-4" />
          </Button>
          <Button onClick={onExportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Sensor Visibility Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <Label className="text-sm font-medium">Capteurs visibles:</Label>
        {sensorConfigs.map(sensor => (
          <div key={sensor.key} className="flex items-center space-x-2">
            <Checkbox
              id={sensor.key}
              checked={visibleSensors[sensor.key]}
              onCheckedChange={() => onSensorToggle(sensor.key)}
            />
            <Label htmlFor={sensor.key} className="flex items-center gap-2 cursor-pointer">
              <div className={`w-3 h-3 rounded-full ${sensor.bgColor}`} />
              {sensor.label}
              {visibleSensors[sensor.key] ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3 text-muted-foreground" />
              )}
            </Label>
          </div>
        ))}
      </div>

      {/* Single Threshold Control */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Seuil d'alerte général</Label>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Valeur:</Label>
          <Input
            type="number"
            value={thresholds.general?.warning || 2048}
            onChange={(e) => onThresholdChange('general', 'warning', Number(e.target.value))}
            className="w-20 h-8 text-xs"
            min="0"
            max="4095"
          />
        </div>
      </div>
    </div>
  );
};