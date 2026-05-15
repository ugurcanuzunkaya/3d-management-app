import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Activity, Thermometer, Clock, Percent,
  Gauge, Box, RefreshCw
} from 'lucide-react';
import api from '@/lib/api';

const PrinterPage = () => {
  const queryClient = useQueryClient();
  const [lastManualPoll, setLastManualPoll] = useState<Date | null>(null);

  const { data: status, isLoading, isError } = useQuery({
    queryKey: ['printer-status'],
    queryFn: () => api.get('/api/printer/status').then(res => res.data),
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const [mountTime] = useState(() => Date.now());
  const [lastValidDataTime, setLastValidDataTime] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
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

  const pollMutation = useMutation({
    mutationFn: () => api.post('/api/printer/poll'),
    onSuccess: () => {
      setLastManualPoll(new Date());
      queryClient.invalidateQueries({ queryKey: ['printer-status'] });
    }
  });

  if (isLoading || !hasValidData) {
    if (isOffline) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
          <Activity className="w-20 h-20 text-red-500 mb-6 opacity-40" />
          <h2 className="text-3xl font-bold text-red-600 mb-2">Printer Offline</h2>
          <p className="text-muted-foreground max-w-md">
            Connection lost or printer turned off for {Math.floor(idleDuration / 60000)} minutes.
            Check power and network connection.
          </p>
          <Button
            variant="outline"
            className="mt-8"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['printer-status'] })}
          >
            Try Reconnecting
          </Button>
        </div>
      );
    }

    if (isWarning) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-in fade-in zoom-in duration-500">
          <div className="relative mb-6">
            <Activity className="w-20 h-20 text-amber-500/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-amber-600">?</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-amber-700 mb-2">Printer Status Uncertain</h2>
          <p className="text-muted-foreground max-w-sm">
            We haven't received telemetry for over a minute. The printer might be powered off or disconnected.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="px-4 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
              Checking connection...
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              Auto-offline state in {Math.ceil((300000 - idleDuration) / 60000)} minutes
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Activity className="w-16 h-16 text-primary animate-spin-slow" />
        <p className="text-xl font-medium text-muted-foreground">Synchronizing printer telemetry...</p>
      </div>
    );
  }

  const gcodeState = status.gcode_state || 'IDLE';
  const progress = status.percent || 0;

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

  // Get first AMS unit info
  const amsUnit = status.ams?.ams?.[0] || {};

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Printer Terminal</h1>
          <p className="text-muted-foreground">Live telemetry from your Bambu Lab P2S.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Auto-polling every 60s</p>
            {lastManualPoll && (
              <p className="text-[10px] text-muted-foreground">Last manual: {lastManualPoll.toLocaleTimeString()}</p>
            )}
          </div>
          <Button
            onClick={() => pollMutation.mutate()}
            disabled={pollMutation.isPending}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${pollMutation.isPending ? 'animate-spin' : ''}`} />
            Manual Poll
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Core Status Card */}
        <Card className="lg:col-span-2 overflow-hidden border-none bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl">
          <CardHeader className="pb-2 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${getStateColor(gcodeState)}`} />
                <CardTitle className="text-lg font-bold uppercase tracking-wider">
                  {gcodeState}
                </CardTitle>
              </div>
              <Activity className="h-5 w-5 opacity-50" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white/70">
                  <Percent className="h-4 w-4" />
                  <span className="text-sm font-medium">Job Progress</span>
                </div>
                <div className="text-3xl font-bold">{progress}%</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white/70">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Remaining</span>
                </div>
                <div className="text-3xl font-bold">{status.remain_time || 0}m</div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="h-3 w-full rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-1000 ease-in-out shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-medium text-white/60">
                <span>Layer {status.layer_num || 0}</span>
                <span>Total {status.total_layer_num || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thermal Card */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Thermometer className="w-4 h-4" />
              Thermals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-sm">Nozzle</span>
              <div className="text-right">
                <div className="text-xl font-bold">{Math.round(status.nozzle_temper || 0)}°C</div>
                <div className="text-[10px] text-muted-foreground">Target: {status.nozzle_target_temper}°C</div>
              </div>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-sm">Bed</span>
              <div className="text-right">
                <div className="text-xl font-bold">{Math.round(status.bed_temper || 0)}°C</div>
                <div className="text-[10px] text-muted-foreground">Target: {status.bed_target_temper}°C</div>
              </div>
            </div>
            <div className="flex justify-between items-end pt-2 border-t">
              <span className="text-sm font-medium">Chamber</span>
              <span className="text-xl font-bold">{status.info?.temp || status.chamber_temper || 0}°C</span>
            </div>
          </CardContent>
        </Card>

        {/* Speed & Mechanics */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-sm">Speed Level</span>
              <div className="text-right">
                <div className="text-xl font-bold">{getSpeedLabel(status.spd_lvl)}</div>
                <div className="text-[10px] text-muted-foreground">{status.spd_mag}% Magnitude</div>
              </div>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-sm">Nozzle Type</span>
              <div className="text-right">
                <div className="text-md font-bold truncate max-w-[100px]">{status.nozzle_type || 'Stainless'}</div>
                <div className="text-[10px] text-muted-foreground">{status.nozzle_diameter || '0.4'}mm</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AMS Detailed Card */}
        <Card className="lg:col-span-4 border-none shadow-md bg-gray-50 dark:bg-gray-900 mt-6">
          <CardHeader>
            <CardTitle className="text-md font-bold flex items-center gap-2">
              <Box className="w-5 h-5 text-blue-500" />
              AMS Internal Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Humidity</p>
                <p className="text-2xl font-bold text-blue-600">{amsUnit.humidity_raw || 0}%</p>
                <p className="text-[10px] text-muted-foreground">Raw: {amsUnit.humidity || 0}</p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Internal Temp</p>
                <p className="text-2xl font-bold text-orange-600">{amsUnit.temp || 0}°C</p>
              </div>
              <div className="lg:col-span-2 flex items-center justify-center p-6 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-xs text-muted-foreground text-center">
                  Live data connection active for serial {status.serial || 'Printer'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrinterPage;
