import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface ChartTimerProps {
  isRunning: boolean;
  resetTrigger?: number;
  onTimeUpdate?: (seconds: number) => void;
}

export const ChartTimer = ({ isRunning, resetTrigger, onTimeUpdate }: ChartTimerProps) => {
  const [seconds, setSeconds] = useState(0);

  // Reset timer when resetTrigger changes
  useEffect(() => {
    setSeconds(0);
  }, [resetTrigger]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(prev => {
          const newSeconds = prev + 1;
          onTimeUpdate?.(newSeconds);
          return newSeconds;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, onTimeUpdate]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Badge variant="outline" className="bg-card">
      <Clock className="h-3 w-3 mr-1" />
      {formatTime(seconds)}
    </Badge>
  );
};