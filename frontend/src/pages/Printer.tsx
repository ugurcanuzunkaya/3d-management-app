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
  const [isHovered, setIsHovered] = useState(false);

  const { data: status, isLoading, isError } = useQuery({
    queryKey: ['printer-status'],
    queryFn: () => api.get('/api/printer/status').then(res => res.data),
    refetchInterval: 60000, // Poll every 1 minute
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
        {/* Core Status Card (Now premium Obsidian black) */}
        <Card 
          className="lg:col-span-2 overflow-hidden border transition-all duration-300 text-white shadow-xl relative"
          style={cardTheme.style}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <CardHeader className="pb-2 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${cardTheme.dotColor}`} />
                <CardTitle className="text-lg font-bold uppercase tracking-wider font-mono">
                  {gcodeState}
                </CardTitle>
              </div>
              <Activity className={`h-5 w-5 ${cardTheme.textColor}`} />
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
                  className={`h-full ${cardTheme.progressBg} ${cardTheme.progressShadow} transition-all duration-1000 ease-in-out`}
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

        {/* Thermals Card */}
        <Card className="group relative overflow-hidden transition-all duration-300 border-l-4 border-l-orange-500 hover:shadow-[0_0_15px_rgba(249,115,22,0.12)] hover:-translate-y-0.5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-950/70 dark:text-orange-200/70 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-orange-500 transition-transform duration-300 group-hover:scale-110" />
              Thermals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nozzle</span>
              <div className="text-right">
                <div className="text-xl font-bold text-orange-600">{Math.round(status.nozzle_temper || 0)}°C</div>
                <div className="text-[10px] text-muted-foreground">Target: {status.nozzle_target_temper}°C</div>
              </div>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Bed</span>
              <div className="text-right">
                <div className="text-xl font-bold text-orange-600">{Math.round(status.bed_temper || 0)}°C</div>
                <div className="text-[10px] text-muted-foreground">Target: {status.bed_target_temper}°C</div>
              </div>
            </div>
            <div className="flex justify-between items-end pt-2 border-t border-orange-100 dark:border-orange-900">
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Chamber</span>
              <span className="text-xl font-bold text-orange-600">{status.info?.temp || status.chamber_temper || 0}°C</span>
            </div>
          </CardContent>
        </Card>

        {/* Speed & Mechanics Card */}
        <Card className="group relative overflow-hidden transition-all duration-300 border-l-4 border-l-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.12)] hover:-translate-y-0.5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-950/70 dark:text-emerald-200/70 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-500 transition-transform duration-300 group-hover:scale-110" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Speed Level</span>
              <div className="text-right">
                <div className="text-xl font-bold text-emerald-600">{getSpeedLabel(status.spd_lvl)}</div>
                <div className="text-[10px] text-muted-foreground">{status.spd_mag}% Magnitude</div>
              </div>
            </div>
            <div className="flex justify-between items-end pt-4 border-t border-emerald-100 dark:border-emerald-900">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nozzle Type</span>
              <div className="text-right">
                <div className="text-md font-bold text-emerald-600 truncate max-w-[100px]">{status.nozzle_type || 'Stainless'}</div>
                <div className="text-[10px] text-muted-foreground">{status.nozzle_diameter || '0.4'}mm</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AMS Detailed Card */}
        <Card className="lg:col-span-4 border-none border-l-4 border-l-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.12)] hover:-translate-y-0.5 transition-all duration-300 shadow-md bg-gray-50/50 dark:bg-gray-900 mt-6 group">
          <CardHeader>
            <CardTitle className="text-md font-bold flex items-center gap-2 text-blue-950 dark:text-blue-100">
              <Box className="w-5 h-5 text-blue-500 transition-transform duration-300 group-hover:scale-110" />
              AMS Internal Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-100 hover:border-blue-300 transition-colors">
                <p className="text-[10px] uppercase font-bold text-blue-600/70 mb-1">Humidity</p>
                <p className="text-2xl font-bold text-blue-600">{amsUnit.humidity_raw || 0}%</p>
                <p className="text-[10px] text-muted-foreground">Raw: {amsUnit.humidity || 0}</p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-orange-100 hover:border-orange-300 transition-colors">
                <p className="text-[10px] uppercase font-bold text-orange-600/70 mb-1">Internal Temp</p>
                <p className="text-2xl font-bold text-orange-600">{amsUnit.temp || 0}°C</p>
              </div>
              <div className="lg:col-span-2 flex items-center justify-center p-6 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-xs text-muted-foreground text-center font-medium">
                  Live data connection active for serial{' '}
                  <span className="font-bold text-blue-600">{status.serial || 'Printer'}</span>
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
