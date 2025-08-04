import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Brush, ReferenceArea } from "recharts";
import { SensorDisplay } from "./SensorDisplay";
import { ChartControls } from "./ChartControls";
import { ChartTimer } from "./ChartTimer";
import { EnhancedDataRecording } from "./EnhancedDataRecording";
import { useToast } from "@/hooks/use-toast";
import { useHardwareConnection } from "@/hooks/useHardwareConnection";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface DataPoint {
  timestamp: number;
  time: string;
  sensor1: number;
  sensor2: number;
  sensor3: number;
}

export const EnhancedSensorChart = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [allData, setAllData] = useState<DataPoint[]>([]);
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);
  const [historicalData, setHistoricalData] = useState<Record<string, DataPoint[]>>({});
  const [visibleSensors, setVisibleSensors] = useState({
    sensor1: true,
    sensor2: true,
    sensor3: true,
  });
  const [isPaused, setIsPaused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Recording states for EnhancedDataRecording
  const [recordingDuration, setRecordingDuration] = useState(60);
  const [recordingCurrentTime, setRecordingCurrentTime] = useState(0);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  
  const [thresholds, setThresholds] = useState({
    general: { warning: 2048 },
  });
  const [windowSize, setWindowSize] = useState(30);
  const [isZoomed, setIsZoomed] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [zoomArea, setZoomArea] = useState({ left: null, right: null, refAreaLeft: '', refAreaRight: '' });
  const [isSelecting, setIsSelecting] = useState(false);
  const isRealTime = true;
  
  const chartRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isConnected, currentData, isConnecting, connect, disconnect } = useHardwareConnection();

  // Historical datasets with CSV filename format
  const historicalDatasets = [
    { id: "current", label: "Données actuelles" },
    { id: "session1", label: "data_20250115_1430.csv" },
    { id: "session2", label: "data_20250114_0915.csv" },
    { id: "session3", label: "data_20250113_1642.csv" },
  ];

  const sensorConfigs = [
    { key: "sensor1", label: "Capteur 1", color: "hsl(var(--sensor-1))", bgColor: "bg-sensor-1" },
    { key: "sensor2", label: "Capteur 2", color: "hsl(var(--sensor-2))", bgColor: "bg-sensor-2" },
    { key: "sensor3", label: "Capteur 3", color: "hsl(var(--sensor-3))", bgColor: "bg-sensor-3" },
  ];

  // Initialisation avec des données de test
  useEffect(() => {
    console.log('Initializing chart data...');
    // Générer quelques données de test si pas de connexion hardware
    if (!isConnected) {
      const testData: DataPoint[] = Array.from({ length: 10 }, (_, i) => ({
        timestamp: Date.now() - (10 - i) * 1000,
        time: `00:${String(i).padStart(2, '0')}`,
        sensor1: Math.random() * 2000 + 1000,
        sensor2: Math.random() * 2000 + 500,
        sensor3: Math.random() * 2000 + 800,
      }));
      console.log('Setting test data:', testData);
      setData(testData);
      setAllData(testData);
      // Ne pas démarrer le timer automatiquement
    }
  }, [isConnected]);

  // Mise à jour avec les vraies données du hardware
  useEffect(() => {
    console.log('Hardware connection status:', { isConnected, currentData, isPaused, isRecording });
    
    if (!isConnected || !currentData || isPaused || !isRecording) {
      return;
    }

    const newPoint: DataPoint = {
      timestamp: currentData.timestamp,
      time: currentData.time,
      sensor1: currentData.sensor1,
      sensor2: currentData.sensor2,
      sensor3: currentData.sensor3,
    };

    console.log('Adding new data point:', newPoint);

    setData(prev => {
      const newData = [...prev, newPoint];
      const windowedData = newData.slice(-windowSize);
      console.log('Current data length:', windowedData.length);
      return windowedData;
    });
    
    setAllData(prev => [...prev, newPoint]);
    // Garder le timer en route pendant l'enregistrement (déjà démarré par handleRecordingToggle)
  }, [currentData, isConnected, isPaused, isRecording, windowSize]);

  const toggleSensorVisibility = (sensor: string) => {
    setVisibleSensors(prev => ({
      ...prev,
      [sensor]: !prev[sensor],
    }));
  };

  const toggleHistoricalDataset = (datasetId: string) => {
    if (selectedDatasets.includes(datasetId)) {
      // Remove dataset
      setSelectedDatasets(prev => prev.filter(id => id !== datasetId));
      setHistoricalData(prev => {
        const newData = { ...prev };
        delete newData[datasetId];
        return newData;
      });
      
      toast({
        title: "Dataset retiré",
        description: `${historicalDatasets.find(h => h.id === datasetId)?.label} masqué`,
      });
    } else {
      // Add dataset
      setSelectedDatasets(prev => [...prev, datasetId]);
      // Generate simulated historical data with same time scale as current data
      const baseTime = Date.now() - 50000; // Start 50 seconds ago
      const historicalDataPoints: DataPoint[] = Array.from({ length: 50 }, (_, i) => ({
        timestamp: baseTime + (i * 1000),
        time: `${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
        sensor1: Math.random() * 3000 + 500, // Different range for visibility
        sensor2: Math.random() * 3000 + 800,
        sensor3: Math.random() * 3000 + 1200,
      }));
      
      console.log(`Loading historical dataset ${datasetId}:`, historicalDataPoints);
      
      setHistoricalData(prev => ({
        ...prev,
        [datasetId]: historicalDataPoints
      }));
      
      toast({
        title: "Dataset ajouté",
        description: `${historicalDatasets.find(h => h.id === datasetId)?.label} affiché en pointillés`,
      });
    }
  };

  // Get chart data (only real-time data, historical data handled separately)
  const getChartData = () => {
    if (zoomArea.left && zoomArea.right) {
      return data.slice(zoomArea.left, zoomArea.right + 1);
    }
    return data;
  };

  const exportData = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${year}${month}${day}_${hours}${minutes}`;
    
    const csvContent = [
      ["Timestamp (ms)", "Capteur 1", "Capteur 2", "Capteur 3"],
      ...data.map(row => [row.timestamp, row.sensor1, row.sensor2, row.sensor3])
    ].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `data_${timestamp}.csv`;
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
    setSelectedDatasets([]);
    setHistoricalData({});
    setIsZoomed(false);
    setTimerRunning(false);
    setResetTrigger(prev => prev + 1);
    setZoomArea({ left: null, right: null, refAreaLeft: '', refAreaRight: '' });
    
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
      setZoomArea({ left: null, right: null, refAreaLeft: '', refAreaRight: '' });
      setIsZoomed(false);
    } else {
      setIsZoomed(!isZoomed);
    }
  };

  const handleRecordingToggle = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Start recording
      setResetTrigger(prev => prev + 1);
      setRecordingCurrentTime(0);
      setIsRecordingPaused(false);
      setTimeout(() => {
        setTimerRunning(true);
      }, 100);
      toast({
        title: "Enregistrement démarré",
        description: "Les données sont maintenant enregistrées",
      });
    } else {
      // Stop recording
      setTimerRunning(false);
      setIsRecordingPaused(false);
      toast({
        title: "Enregistrement arrêté",
        description: "L'enregistrement des données est terminé",
      });
    }
  };

  const handleRecordingPauseToggle = () => {
    setIsRecordingPaused(!isRecordingPaused);
    toast({
      title: isRecordingPaused ? "Enregistrement repris" : "Enregistrement en pause",
      description: `Temps écoulé: ${Math.floor(recordingCurrentTime / 60)}:${String(recordingCurrentTime % 60).padStart(2, '0')}`,
    });
  };

  const handleRecordingStop = () => {
    setIsRecording(false);
    setIsRecordingPaused(false);
    setTimerRunning(false);
    toast({
      title: "Enregistrement terminé",
      description: "Session sauvegardée avec succès",
    });
  };

  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
    // Le timer continue à tourner même en pause pour garder le temps total
  };

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
      
      // Find indices based on time values
      const leftIndex = data.findIndex(item => item.time === refAreaLeft);
      const rightIndex = data.findIndex(item => item.time === refAreaRight);
      
      if (leftIndex !== -1 && rightIndex !== -1) {
        const startIndex = Math.min(leftIndex, rightIndex);
        const endIndex = Math.max(leftIndex, rightIndex);
        
        // Only zoom if we have a meaningful selection (more than 1 point)
        if (endIndex - startIndex > 0) {
          setZoomArea({
            left: startIndex,
            right: endIndex,
            refAreaLeft: '',
            refAreaRight: ''
          });
          setIsZoomed(true);
          
          toast({
            title: "Zoom appliqué",
            description: `Zone sélectionnée: ${data[startIndex].time} - ${data[endIndex].time}`,
          });
        }
      }
    }
    setIsSelecting(false);
    setZoomArea(prev => ({ ...prev, refAreaLeft: '', refAreaRight: '' }));
  };

  return (
    <div className="space-y-6">
      {/* Sensor Display with Recording Controls */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <SensorDisplay data={data} sensorConfigs={sensorConfigs} />
        </div>
        <div className="lg:w-80">
          <EnhancedDataRecording 
            isRecording={isRecording}
            isPaused={isRecordingPaused}
            duration={recordingDuration}
            currentTime={recordingCurrentTime}
            onDurationChange={setRecordingDuration}
            onCurrentTimeChange={setRecordingCurrentTime}
          />
        </div>
      </div>

      {/* Controls */}
      <ChartControls
        selectedDatasets={selectedDatasets}
        historicalDatasets={historicalDatasets}
        isRealTime={isRealTime}
        isRecording={isRecording}
        visibleSensors={visibleSensors}
        sensorConfigs={sensorConfigs}
        thresholds={thresholds}
        onDatasetToggle={toggleHistoricalDataset}
        onSensorToggle={toggleSensorVisibility}
        onExportData={exportData}
        onReset={handleReset}
        onScreenshot={handleScreenshot}
        onExportPDF={handleExportPDF}
        onThresholdChange={handleThresholdChange}
        onZoom={handleZoom}
        isPaused={isPaused}
        onPauseToggle={handlePauseToggle}
        onRecordingToggle={handleRecordingToggle}
        recordingDuration={recordingDuration}
        recordingCurrentTime={recordingCurrentTime}
        isRecordingPaused={isRecordingPaused}
        onRecordingPauseToggle={handleRecordingPauseToggle}
        onRecordingStop={handleRecordingStop}
      />

      {/* Timer */}
      <div className="flex justify-center">
        <ChartTimer isRunning={timerRunning && isRecording && !isPaused} resetTrigger={resetTrigger} />
      </div>

      {/* Chart */}
      <div ref={chartRef} className="h-96 w-full bg-card p-4 rounded-lg border">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={getChartData()}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
              domain={zoomArea.left && zoomArea.right ? 
                [data[zoomArea.left]?.time, data[zoomArea.right]?.time] : 
                ['dataMin', 'dataMax']
              }
              type="category"
              scale="point"
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

            {/* Historical data lines as separate LineChart overlays */}
            {selectedDatasets.map((datasetId) => {
              const dataset = historicalData[datasetId];
              const datasetLabel = historicalDatasets.find(h => h.id === datasetId)?.label || datasetId;
              
              if (!dataset || dataset.length === 0) return null;
              
              console.log(`Rendering historical dataset ${datasetId} with ${dataset.length} points`);
              
              // Render historical data as separate lines with their own data
              return dataset.map((point, index) => {
                const x = (index / (dataset.length - 1)) * 100; // Position as percentage
                const y1 = 100 - ((point.sensor1 / 4095) * 100); // Invert Y for SVG
                const y2 = 100 - ((point.sensor2 / 4095) * 100);
                const y3 = 100 - ((point.sensor3 / 4095) * 100);
                
                if (index === 0) return null; // Skip first point for line drawing
                
                const prevPoint = dataset[index - 1];
                const prevX = ((index - 1) / (dataset.length - 1)) * 100;
                const prevY1 = 100 - ((prevPoint.sensor1 / 4095) * 100);
                const prevY2 = 100 - ((prevPoint.sensor2 / 4095) * 100);
                const prevY3 = 100 - ((prevPoint.sensor3 / 4095) * 100);
                
                return (
                  <g key={`${datasetId}-${index}`}>
                    {visibleSensors.sensor1 && (
                      <line
                        x1={`${prevX}%`}
                        y1={`${prevY1}%`}
                        x2={`${x}%`}
                        y2={`${y1}%`}
                        stroke={sensorConfigs[0].color}
                        strokeWidth="1"
                        strokeDasharray="5,5"
                        opacity="0.7"
                      />
                    )}
                    {visibleSensors.sensor2 && (
                      <line
                        x1={`${prevX}%`}
                        y1={`${prevY2}%`}
                        x2={`${x}%`}
                        y2={`${y2}%`}
                        stroke={sensorConfigs[1].color}
                        strokeWidth="1"
                        strokeDasharray="5,5"
                        opacity="0.7"
                      />
                    )}
                    {visibleSensors.sensor3 && (
                      <line
                        x1={`${prevX}%`}
                        y1={`${prevY3}%`}
                        x2={`${x}%`}
                        y2={`${y3}%`}
                        stroke={sensorConfigs[2].color}
                        strokeWidth="1"
                        strokeDasharray="5,5"
                        opacity="0.7"
                      />
                    )}
                  </g>
                );
              });
            }).flat().filter(Boolean)}
            
            {/* Real-time data lines (solid, in front) */}
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