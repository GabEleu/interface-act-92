import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SensorDisplayProps {
  data: any[];
  sensorConfigs: Array<{
    key: string;
    label: string;
    color: string;
    bgColor: string;
  }>;
}

export const SensorDisplay = ({ data, sensorConfigs }: SensorDisplayProps) => {
  const latestData = data[data.length - 1];

  if (!latestData) return null;

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Valeurs actuelles des capteurs</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sensorConfigs.map(sensor => {
          const value = latestData[sensor.key];
          return (
            <div key={sensor.key} className="flex flex-col items-center p-4 border rounded-lg">
              <div className={`w-4 h-4 rounded-full ${sensor.bgColor} mb-2`} />
              <span className="text-sm text-muted-foreground">{sensor.label}</span>
              <Badge variant="outline" className="text-lg font-mono mt-1">
                {value ? Math.round(value) : '0'}
              </Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
};