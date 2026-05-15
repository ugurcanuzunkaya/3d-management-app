import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Thermometer, Clock } from 'lucide-react';
import api from '@/lib/api';

const PrinterStatusWidget = () => {
  const { data: status, isLoading } = useQuery({
    queryKey: ['printer-status'],
    queryFn: () => api.get('/api/printer/status').then(res => res.data),
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const [mountTime] = useState(() => Date.now());
  const [lastValidDataTime, setLastValidDataTime] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (status && Object.keys(status).length > 0) {
      const timer = setTimeout(() => setLastValidDataTime(Date.now()), 0);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const idleDuration = now - (lastValidDataTime ?? mountTime);
  const isWarning = idleDuration > 60000; // 1 minute
  const isOffline = idleDuration > 300000; // 5 minutes

  const hasData = status && Object.keys(status).length > 0;

  if (isLoading || !hasData) {
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
      <Card className="overflow-hidden border-none bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium opacity-70">Printer Status</CardTitle>
            <Activity className="h-4 w-4 text-gray-500 animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <Activity className="h-12 w-12 text-gray-700 mb-4 animate-pulse" />
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

  const getStateColor = (state: string) => {
    switch (state) {
      case 'RUNNING': return 'bg-green-400 animate-pulse';
      case 'PAUSE': return 'bg-yellow-400 animate-bounce';
      case 'FINISH': return 'bg-blue-400';
      case 'FAILED': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const getSpeedLabel = (lvl: number) => {
    switch (lvl) {
      case 1: return "Silent";
      case 2: return "Standard";
      case 3: return "Sport";
      case 4: return "Ludicrous";
      default: return "Standard";
    }
  };

  return (
    <Card className="overflow-hidden border-none bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl">
      <CardHeader className="pb-2 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${getStateColor(gcodeState)}`} />
            <CardTitle className="text-sm font-bold uppercase tracking-wider">
              {gcodeState}
            </CardTitle>
          </div>
          <div className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
            {getSpeedLabel(speedLvl)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white/70">
              <Thermometer className="h-4 w-4" />
              <span className="text-xs font-medium">Bed / Chamber / Nozzle</span>
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
              className="h-full bg-white transition-all duration-1000 ease-in-out shadow-[0_0_8px_rgba(255,255,255,0.5)]"
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
