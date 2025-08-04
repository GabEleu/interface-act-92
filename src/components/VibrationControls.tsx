import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Vibrate } from "lucide-react";

export const VibrationControls = () => {
  const [vibration1, setVibration1] = useState([30]);
  const [vibration2, setVibration2] = useState([30]);
  const [vibration3, setVibration3] = useState([30]);

  const vibratorConfigs = [
    {
      id: 1,
      label: "Vibreur 1",
      value: vibration1,
      setValue: setVibration1,
      color: "bg-sensor-1",
    },
    {
      id: 2,
      label: "Vibreur 2",
      value: vibration2,
      setValue: setVibration2,
      color: "bg-sensor-2",
    },
    {
      id: 3,
      label: "Vibreur 3",
      value: vibration3,
      setValue: setVibration3,
      color: "bg-sensor-3",
    },
  ];

  return (
    <div className="space-y-6">
      {vibratorConfigs.map((vibrator) => (
        <Card key={vibrator.id} className="p-4 border border-border/50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Vibrate className="h-4 w-4" />
                {vibrator.label}
              </Label>
              <Badge variant="secondary" className="font-mono">
                {vibrator.value[0]}%
              </Badge>
            </div>
            
            <div className="space-y-2">
              <Slider
                value={vibrator.value}
                onValueChange={vibrator.setValue}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Visual intensity indicator */}
            <div className="flex items-center gap-1">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-3 rounded-sm ${
                    i < Math.floor(vibrator.value[0] / 10)
                      ? vibrator.color
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};