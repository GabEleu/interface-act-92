import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Brush, ReferenceArea } from "recharts";
import { SensorDisplay } from "./SensorDisplay";
import { ChartControls } from "./ChartControls";
import { ChartTimer } from "./ChartTimer";
import { useToast } from "@/hooks/use-toast";
import { useHardwareConnection } from "@/hooks/useHardwareConnection";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const EnhancedSensorChart = () => {
  const [data, setData] = useState<any[]>([]);
  const [allData, setAllData] = useState<any[]>([]); // Store all data for overlay
  const [overlayDatasets, setOverlayDatasets] = useState<string[]>([]);
  const [visibleSensors, setVisibleSensors] = useState({
    sensor1: true,
    sensor2: true,
    sensor3: true,
  });
  const [selectedDataset, setSelectedDataset] = useState("current");
  const [isRealTime, setIsRealTime] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [thresholds, setThresholds] = useState({
    general: { warning: 2048 }, // Mid-range for 0-4095
  });
  const [windowSize, setWindowSize] = useState(30); // 30 seconds window
  const [isZoomed, setIsZoomed] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [zoomArea, setZoomArea] = useState({ left: null, right: null, refAreaLeft: '', refAreaRight: '' });
  const [isSelecting, setIsSelecting] = useState(false);
  
  const chartRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isConnected, currentData, isConnecting, connect, disconnect } = useHardwareConnection();

  // Historical datasets simulation
  const historicalDatasets = [
    { id: "current", label: "Données actuelles" },
    { id: "session1", label: "Session 1 - 15/01/2024" },
    { id: "session2", label: "Session 2 - 14/01/2024" },
    { id: "session3", label: "Session 3 - 13/01/2024" },
  ];

  const sensorConfigs = [
    { key: "sensor1", label: "Capteur 1", color: "hsl(var(--sensor-1))", bgColor: "bg-sensor-1" },
    { key: "sensor2", label: "Capteur 2", color: "hsl(var(--sensor-2))", bgColor: "bg-sensor-2" },
    { key: "sensor3", label: "Capteur 3", color: "hsl(var(--sensor-3))", bgColor: "bg-sensor-3" },
  ];

  // Initialisation - ne pas générer de fausses données
  useEffect(() => {
    setData([]);
    setAllData([]);
    setTimerRunning(false);
  }, []);

  // Mise à jour avec les vraies données du hardware
  useEffect(() => {
    if (!isConnected || !currentData || selectedDataset !== "current" || isPaused) {
      return;
    }

    // Ajouter les nouvelles données réelles
    const newPoint = {
      timestamp: currentData.timestamp,
      time: currentData.time,
      sensor1: currentData.sensor1,
      sensor2: currentData.sensor2,
      sensor3: currentData.sensor3,
    };

    setData(prev => {
      const newData = [...prev, newPoint];
      // Garder seulement les 30 derniers points
      return newData.slice(-windowSize);
    });
    
    setAllData(prev => [...prev, newPoint]);
    setTimerRunning(true);
  }, [currentData, isConnected, selectedDataset, isPaused, windowSize]);

  // Auto-scaling: keep only last 30 seconds of data visible
  useEffect(() => {
    if (data.length > windowSize) {
      setData(prev => prev.slice(-windowSize));
    }
  }, [data.length, windowSize]);

  const toggleSensorVisibility = (sensor: string) => {
    setVisibleSensors(prev => ({
      ...prev,
      [sensor]: !prev[sensor],
    }));
  };

  const loadHistoricalData = (datasetId: string) => {
    setSelectedDataset(datasetId);
    setIsRealTime(datasetId === "current");
    setTimerRunning(datasetId === "current");
    
    if (datasetId !== "current") {
      // Load simulated historical data
      const historicalData = Array.from({ length: 50 }, (_, i) => ({
        timestamp: Date.now() - (49 - i) * 2000,
        time: new Date(Date.now() - (49 - i) * 2000).toLocaleTimeString(),
        sensor1: Math.random() * 4095,
        sensor2: Math.random() * 4095,
        sensor3: Math.random() * 4095,
      }));
      setData(historicalData);
    }
  };

  const exportData = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const csvContent = [
      ["Timestamp (ms)", "Temps", "Capteur 1", "Capteur 2", "Capteur 3"],
      ...data.map(row => [row.timestamp, row.time, row.sensor1, row.sensor2, row.sensor3])
    ].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fsr-data-${selectedDataset}-${timestamp}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export réussi",
      description: `Données exportées dans ${a.download}`,
    });
  };

  const handleReset = () => {
    setData([]);
    setAllData([]);
    setOverlayDatasets([]);
    setIsZoomed(false);
    setTimerRunning(false);
    setResetTrigger(prev => prev + 1); // Trigger timer reset
    setZoomArea({ left: null, right: null, refAreaLeft: '', refAreaRight: '' }); // Reset zoom
    
    toast({
      title: "Remise à zéro",
      description: "Toutes les données ont été effacées",
    });
  };

  const handleScreenshot = async () => {
    if (chartRef.current) {
      try {
        const canvas = await html2canvas(chartRef.current);
        const link = document.createElement('a');
        link.download = `chart-screenshot-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
        
        toast({
          title: "Capture réussie",
          description: "Capture d'écran sauvegardée",
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de prendre la capture",
          variant: "destructive",
        });
      }
    }
  };

  const handleExportPDF = async () => {
    if (chartRef.current) {
      try {
        const canvas = await html2canvas(chartRef.current);
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF();
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        // Add metrics
        const stats = calculateMetrics();
        pdf.addPage();
        pdf.text('Métriques des capteurs:', 20, 30);
        pdf.text(`Capteur 1 - Moyenne: ${stats.sensor1.avg.toFixed(0)}, Médiane: ${stats.sensor1.median.toFixed(0)}`, 20, 50);
        pdf.text(`Capteur 2 - Moyenne: ${stats.sensor2.avg.toFixed(0)}, Médiane: ${stats.sensor2.median.toFixed(0)}`, 20, 70);
        pdf.text(`Capteur 3 - Moyenne: ${stats.sensor3.avg.toFixed(0)}, Médiane: ${stats.sensor3.median.toFixed(0)}`, 20, 90);
        
        pdf.save(`fsr-report-${Date.now()}.pdf`);
        
        toast({
          title: "PDF généré",
          description: "Rapport PDF avec métriques sauvegardé",
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de générer le PDF",
          variant: "destructive",
        });
      }
    }
  };

  const calculateMetrics = () => {
    const sensors = ['sensor1', 'sensor2', 'sensor3'] as const;
    const stats = {} as Record<string, { avg: number; median: number }>;
    
    sensors.forEach(sensor => {
      const values = data.map(d => d[sensor]).filter(v => v !== undefined);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const sorted = values.sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      stats[sensor] = { avg, median };
    });
    
    return stats;
  };

  const handleThresholdChange = (sensor: string, type: 'warning' | 'danger', value: number) => {
    setThresholds({
      general: { warning: value }
    });
  };

  const handleZoom = () => {
    if (zoomArea.left && zoomArea.right) {
      // Reset zoom if already zoomed
      setZoomArea({ left: null, right: null, refAreaLeft: '', refAreaRight: '' });
      setIsZoomed(false);
    } else {
      setIsZoomed(!isZoomed);
    }
  };

  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
  };

  // Zoom selection handlers
  const handleMouseDown = (e: any) => {
    if (e && e.activeLabel) {
      setZoomArea(prev => ({ ...prev, refAreaLeft: e.activeLabel }));
      setIsSelecting(true);
    }
  };

  const handleMouseMove = (e: any) => {
    if (isSelecting && e && e.activeLabel) {
      setZoomArea(prev => ({ ...prev, refAreaRight: e.activeLabel }));
    }
  };

  const handleMouseUp = () => {
    if (isSelecting && zoomArea.refAreaLeft && zoomArea.refAreaRight) {
      const { refAreaLeft, refAreaRight } = zoomArea;
      
      // Find the indices of the selected area
      const leftIndex = data.findIndex(item => item.time === refAreaLeft);
      const rightIndex = data.findIndex(item => item.time === refAreaRight);
      
      if (leftIndex !== -1 && rightIndex !== -1) {
        const startIndex = Math.min(leftIndex, rightIndex);
        const endIndex = Math.max(leftIndex, rightIndex);
        
        if (endIndex - startIndex > 1) {
          // Zoom to selected area
          setZoomArea({
            left: startIndex,
            right: endIndex,
            refAreaLeft: '',
            refAreaRight: ''
          });
          setIsZoomed(true);
        }
      }
    }
    setIsSelecting(false);
    setZoomArea(prev => ({ ...prev, refAreaLeft: '', refAreaRight: '' }));
  };

  return (
    <div className="space-y-6">
      {/* Sensor Display */}
      <SensorDisplay data={data} sensorConfigs={sensorConfigs} />

      {/* Controls */}
      <ChartControls
        selectedDataset={selectedDataset}
        historicalDatasets={historicalDatasets}
        isRealTime={isRealTime}
        visibleSensors={visibleSensors}
        sensorConfigs={sensorConfigs}
        thresholds={thresholds}
        onDatasetChange={loadHistoricalData}
        onSensorToggle={toggleSensorVisibility}
        onExportData={exportData}
        onReset={handleReset}
        onScreenshot={handleScreenshot}
        onExportPDF={handleExportPDF}
        onThresholdChange={handleThresholdChange}
        onZoom={handleZoom}
        isPaused={isPaused}
        onPauseToggle={handlePauseToggle}
      />

      {/* Timer */}
      <div className="flex justify-center">
        <ChartTimer isRunning={timerRunning && !isPaused} resetTrigger={resetTrigger} />
      </div>

      {/* Chart */}
      <div ref={chartRef} className="h-96 w-full bg-card p-4 rounded-lg border">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={zoomArea.left && zoomArea.right ? data.slice(zoomArea.left, zoomArea.right + 1) : data}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: 'Valeur', angle: -90, position: 'insideLeft' }}
              domain={[0, 4095]}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            
            {/* Reference Area for selection */}
            {zoomArea.refAreaLeft && zoomArea.refAreaRight && (
              <ReferenceArea
                x1={zoomArea.refAreaLeft}
                x2={zoomArea.refAreaRight}
                strokeOpacity={0.3}
                fill="hsl(var(--primary))"
                fillOpacity={0.1}
              />
            )}
            
            {/* Single threshold line */}
            <ReferenceLine
              y={thresholds.general.warning}
              stroke="hsl(var(--threshold-warning))"
              strokeDasharray="5 5"
              label="Seuil d'alerte"
            />
            
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
            
            {!isZoomed && !zoomArea.left && (
              <Brush dataKey="time" height={30} stroke="hsl(var(--primary))" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
