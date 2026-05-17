import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Thermometer, Clock } from 'lucide-react';
import api from '@/lib/api';

const PrinterStatusWidget = () => {
  const { data: status, isLoading, isError } = useQuery({
    queryKey: ['printer-status'],
    queryFn: () => api.get('/api/printer/status').then(res => res.data),
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const [mountTime] = useState(() => Date.now());
  const [lastValidDataTime, setLastValidDataTime] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const hasValidData = !isError && status && Object.keys(status).length > 0;
    if (hasValidData) {
      const timer = setTimeout(() => setLastValidDataTime(Date.now()), 0);
      return () => clearTimeout(timer);
    }
  }, [status, isError]);

  const idleDuration = now - (lastValidDataTime ?? mountTime);
  const isWarning = idleDuration > 60000; // 1 minute
  const isOffline = idleDuration > 300000; // 5 minutes

  const hasValidData = !isError && status && Object.keys(status).length > 0;

  if (isLoading || !hasValidData) {
    if (isOffline) {
      return (
        <Card className="overflow-hidden border-none bg-gradient-to-br from-red-900 to-red-800 text-white shadow-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium opacity-70">Printer Status</CardTitle>
              <Activity className="h-4 w-4 text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="h-12 w-12 text-red-500 mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-red-200 mb-1">Printer not working</h3>
              <p className="text-red-300/60 text-xs">Connection lost or power off for {Math.floor(idleDuration / 60000)}m</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (isWarning) {
      return (
        <Card className="overflow-hidden border-none bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-xl animate-in fade-in duration-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium opacity-80">Printer Status</CardTitle>
              <Activity className="h-4 w-4 text-white/50 animate-pulse" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="relative mb-4">
                <Activity className="h-12 w-12 text-white/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">?</span>
                </div>
              </div>
              <p className="font-bold text-sm mb-1">Printer probably not running</p>
              <p className="text-white/60 text-[10px]">Waiting for confirmation...</p>
              <div className="mt-4 px-3 py-1 bg-white/20 rounded-full text-[10px] font-mono animate-pulse">
                Auto-offline in {Math.ceil((300000 - idleDuration) / 60000)}m
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="overflow-hidden border-none bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-lg animate-pulse">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium opacity-70">Printer Status</CardTitle>
            <Activity className="h-4 w-4 text-gray-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <Activity className="h-12 w-12 text-gray-700 mb-4 animate-spin-slow" />
            <p className="text-gray-400 text-sm">Initializing connection...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const gcodeState = status.gcode_state || 'IDLE';
  const progress = status.percent || 0;
  const nozzleTemp = Math.round(status.nozzle_temper || 0);
  const bedTemp = Math.round(status.bed_temper || 0);
  const chamberTemp = status.info?.temp || status.chamber_temper || 0;
  const remainingTime = status.remain_time || 0;
  const layerNum = status.layer_num || 0;
  const totalLayers = status.total_layer_num || 0;
  const speedLvl = status.spd_lvl || 2;

  const getSpeedLabel = (lvl: number) => {
    switch (lvl) {
      case 1: return "Silent";
      case 2: return "Standard";
      case 3: return "Sport";
      case 4: return "Ludicrous";
      default: return "Standard";
    }
  };

  // State-aware style generator for telemetry card
  const getCardStyle = (state: string, hovered: boolean) => {
    switch (state) {
      case 'RUNNING':
        return {
          style: {
            background: 'linear-gradient(135deg, #000000 0%, #09090b 50%, #022c22 100%)',
            borderColor: hovered ? '#10b981' : 'color-mix(in srgb, #10b981 20%, #1c1c1f)',
            boxShadow: hovered ? '0 0 20px rgba(16, 185, 129, 0.15)' : 'none',
          },
          dotColor: 'bg-emerald-400 animate-pulse',
          textColor: 'text-emerald-400',
          progressBg: 'bg-emerald-500',
          progressShadow: 'shadow-[0_0_10px_rgba(16,185,129,0.5)]',
        };
      case 'PAUSE':
        return {
          style: {
            background: 'linear-gradient(135deg, #000000 0%, #09090b 50%, #451a03 100%)',
            borderColor: hovered ? '#f59e0b' : 'color-mix(in srgb, #f59e0b 20%, #1c1c1f)',
            boxShadow: hovered ? '0 0 20px rgba(245, 158, 11, 0.15)' : 'none',
          },
          dotColor: 'bg-amber-400 animate-bounce',
          textColor: 'text-amber-400',
          progressBg: 'bg-amber-500',
          progressShadow: 'shadow-[0_0_10px_rgba(245,158,11,0.5)]',
        };
      case 'FAILED':
        return {
          style: {
            background: 'linear-gradient(135deg, #000000 0%, #09090b 50%, #450a0a 100%)',
            borderColor: hovered ? '#ef4444' : 'color-mix(in srgb, #ef4444 20%, #1c1c1f)',
            boxShadow: hovered ? '0 0 20px rgba(239, 68, 68, 0.15)' : 'none',
          },
          dotColor: 'bg-red-400 animate-pulse',
          textColor: 'text-red-400',
          progressBg: 'bg-red-500',
          progressShadow: 'shadow-[0_0_10px_rgba(239,68,68,0.5)]',
        };
      case 'FINISH':
        return {
          style: {
            background: 'linear-gradient(135deg, #000000 0%, #09090b 50%, #1e3a8a 100%)',
            borderColor: hovered ? '#3b82f6' : 'color-mix(in srgb, #3b82f6 20%, #1c1c1f)',
            boxShadow: hovered ? '0 0 20px rgba(59, 130, 246, 0.15)' : 'none',
          },
          dotColor: 'bg-blue-400',
          textColor: 'text-blue-400',
          progressBg: 'bg-blue-500',
          progressShadow: 'shadow-[0_0_10px_rgba(59,130,246,0.5)]',
        };
      default: // IDLE
        return {
          style: {
            background: 'linear-gradient(135deg, #000000 0%, #09090b 60%, #172554 100%)',
            borderColor: hovered ? '#3b82f6' : 'color-mix(in srgb, #3b82f6 15%, #1c1c1f)',
            boxShadow: hovered ? '0 0 20px rgba(59, 130, 246, 0.15)' : 'none',
          },
          dotColor: 'bg-blue-500 animate-pulse',
          textColor: 'text-blue-400',
          progressBg: 'bg-blue-500',
          progressShadow: 'shadow-[0_0_10px_rgba(59,130,246,0.5)]',
        };
    }
  };

  const cardTheme = getCardStyle(gcodeState, isHovered);

  return (
    <Card 
      className="overflow-hidden border transition-all duration-300 text-white shadow-xl relative"
      style={cardTheme.style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-2 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${cardTheme.dotColor}`} />
            <CardTitle className="text-sm font-bold uppercase tracking-wider font-mono">
              {gcodeState}
            </CardTitle>
          </div>
          <div className="text-[10px] bg-white/15 px-2 py-0.5 rounded-full font-mono font-medium">
            {getSpeedLabel(speedLvl)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white/70">
              <Thermometer className="h-4 w-4" />
              <span className="text-xs font-medium">Bed / Cham / Nozzle</span>
            </div>
            <div className="text-lg font-bold">
              {bedTemp}° / {chamberTemp}° / {nozzleTemp}°
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white/70">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Remaining</span>
            </div>
            <div className="text-lg font-bold">
              {remainingTime}m
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-white/80">Progress ({layerNum}/{totalLayers})</span>
            <span className="font-bold">{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
            <div
              className={`h-full ${cardTheme.progressBg} ${cardTheme.progressShadow} transition-all duration-1000 ease-in-out`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-4 text-[10px] text-white/40 font-mono truncate">
          {status.subtask_name || 'Printer Standby'}
        </div>
      </CardContent>
    </Card>
  );
};

export default PrinterStatusWidget;
