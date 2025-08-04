import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Activity, Download, Eye, EyeOff } from "lucide-react";

// Simulated real-time data
const generateRandomData = () => ({
  time: new Date().toLocaleTimeString(),
  sensor1: Math.random() * 100 + 20,
  sensor2: Math.random() * 80 + 30,
  sensor3: Math.random() * 90 + 10,
});

export const SensorChart = () => {
  const [data, setData] = useState<any[]>([]);
  const [visibleSensors, setVisibleSensors] = useState({
    sensor1: true,
    sensor2: true,
    sensor3: true,
  });
  const [selectedDataset, setSelectedDataset] = useState("current");
  const [isRealTime, setIsRealTime] = useState(true);

  // Historical datasets simulation
  const historicalDatasets = [
    { id: "current", label: "Données actuelles" },
    { id: "session1", label: "Session 1 - 15/01/2024" },
    { id: "session2", label: "Session 2 - 14/01/2024" },
    { id: "session3", label: "Session 3 - 13/01/2024" },
  ];

  // Generate initial data
  useEffect(() => {
    const initialData = Array.from({ length: 20 }, (_, i) => ({
      time: new Date(Date.now() - (19 - i) * 1000).toLocaleTimeString(),
      sensor1: Math.random() * 100 + 20,
      sensor2: Math.random() * 80 + 30,
      sensor3: Math.random() * 90 + 10,
    }));
    setData(initialData);
  }, []);

  // Real-time data update
  useEffect(() => {
    if (!isRealTime || selectedDataset !== "current") return;

    const interval = setInterval(() => {
      setData(prev => {
        const newData = [...prev.slice(1), generateRandomData()];
        return newData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRealTime, selectedDataset]);

  const toggleSensorVisibility = (sensor: keyof typeof visibleSensors) => {
    setVisibleSensors(prev => ({
      ...prev,
      [sensor]: !prev[sensor],
    }));
  };

  const loadHistoricalData = (datasetId: string) => {
    setSelectedDataset(datasetId);
    setIsRealTime(datasetId === "current");
    
    if (datasetId !== "current") {
      // Load simulated historical data
      const historicalData = Array.from({ length: 50 }, (_, i) => ({
        time: new Date(Date.now() - (49 - i) * 2000).toLocaleTimeString(),
        sensor1: Math.random() * 120 + 10,
        sensor2: Math.random() * 100 + 20,
        sensor3: Math.random() * 110 + 5,
      }));
      setData(historicalData);
    }
  };

  const exportData = () => {
    const csvContent = [
      ["Temps", "Capteur 1", "Capteur 2", "Capteur 3"],
      ...data.map(row => [row.time, row.sensor1, row.sensor2, row.sensor3])
    ].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fsr-data-${selectedDataset}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const sensorConfigs = [
    { key: "sensor1", label: "Capteur 1", color: "#3b82f6", bgColor: "bg-sensor-1" },
    { key: "sensor2", label: "Capteur 2", color: "#10b981", bgColor: "bg-sensor-2" },
    { key: "sensor3", label: "Capteur 3", color: "#8b5cf6", bgColor: "bg-sensor-3" },
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Dataset Selection */}
          <div className="flex items-center gap-2">
            <Label>Jeu de données:</Label>
            <Select value={selectedDataset} onValueChange={loadHistoricalData}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {historicalDatasets.map(dataset => (
                  <SelectItem key={dataset.id} value={dataset.id}>
                    {dataset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Real-time indicator */}
          {isRealTime && (
            <Badge className="bg-success text-success-foreground">
              <Activity className="h-3 w-3 mr-1 animate-pulse" />
              Temps réel
            </Badge>
          )}
        </div>

        <Button onClick={exportData} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      {/* Sensor Visibility Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <Label className="text-sm font-medium">Capteurs visibles:</Label>
        {sensorConfigs.map(sensor => (
          <div key={sensor.key} className="flex items-center space-x-2">
            <Checkbox
              id={sensor.key}
              checked={visibleSensors[sensor.key as keyof typeof visibleSensors]}
              onCheckedChange={() => toggleSensorVisibility(sensor.key as keyof typeof visibleSensors)}
            />
            <Label htmlFor={sensor.key} className="flex items-center gap-2 cursor-pointer">
              <div className={`w-3 h-3 rounded-full ${sensor.bgColor}`} />
              {sensor.label}
              {visibleSensors[sensor.key as keyof typeof visibleSensors] ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3 text-muted-foreground" />
              )}
            </Label>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: 'Force (N)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            
            {visibleSensors.sensor1 && (
              <Line
                type="monotone"
                dataKey="sensor1"
                stroke={sensorConfigs[0].color}
                strokeWidth={2}
                dot={false}
                name={sensorConfigs[0].label}
              />
            )}
            {visibleSensors.sensor2 && (
              <Line
                type="monotone"
                dataKey="sensor2"
                stroke={sensorConfigs[1].color}
                strokeWidth={2}
                dot={false}
                name={sensorConfigs[1].label}
              />
            )}
            {visibleSensors.sensor3 && (
              <Line
                type="monotone"
                dataKey="sensor3"
                stroke={sensorConfigs[2].color}
                strokeWidth={2}
                dot={false}
                name={sensorConfigs[2].label}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};