import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Thermometer, Clock, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import type { Printer } from '@/types';
import { usePrivacy } from '@/context/PrivacyContext';
import { PrivacyWrapper } from '@/components/shared/PrivacyWrapper';

const PrinterStatusWidget = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Fetch list of all printers
  const { data: printers, isLoading: isLoadingPrinters } = useQuery<Printer[]>({
    queryKey: ['printers'],
    queryFn: () => api.get('/api/printer').then(res => res.data),
    refetchInterval: 10000, // Poll list of printers every 10 seconds
  });

  const validatedIndex = printers && currentIndex >= printers.length ? 0 : currentIndex;
  const activePrinter = printers && printers.length > 0 ? printers[validatedIndex] : null;

  // Fetch status of the selected printer
  const { data: status, isError, dataUpdatedAt } = useQuery({
    queryKey: ['printer-status', activePrinter?.id],
    queryFn: () => {
      if (!activePrinter) return Promise.resolve(null);
      return api.get(`/api/printer/${activePrinter.id}/status`).then(res => res.data);
    },
    enabled: !!activePrinter,
    refetchInterval: 5000, // Poll active printer telemetry every 5 seconds
  });

  const [mountTime] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [isHovered, setIsHovered] = useState(false);

  const { isMasked } = usePrivacy();

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePrev = () => {
    if (!printers || printers.length <= 1 || isTransitioning) return;
    setSlideDirection('right');
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(validatedIndex === 0 ? printers.length - 1 : validatedIndex - 1);
      setIsTransitioning(false);
    }, 200);
  };

  const handleNext = () => {
    if (!printers || printers.length <= 1 || isTransitioning) return;
    setSlideDirection('left');
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(validatedIndex === printers.length - 1 ? 0 : validatedIndex + 1);
      setIsTransitioning(false);
    }, 200);
  };

  if (isLoadingPrinters) {
    return (
      <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium opacity-70">Printer Telemetry</CardTitle>
            <Activity className="h-4 w-4 text-zinc-400 animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <Activity className="h-10 w-10 text-indigo-500 mb-4 animate-spin" />
            <p className="text-muted-foreground text-sm">Loading printers...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!printers || printers.length === 0) {
    return (
      <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 shadow-md">
        <CardHeader className="pb-2 border-b border-zinc-100 dark:border-zinc-900">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold opacity-70">Printer Telemetry</CardTitle>
            <Activity className="h-4 w-4 text-zinc-400" />
          </div>
        </CardHeader>
        <CardContent className="pt-8 pb-8 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-4">
            <Activity className="w-6 h-6 text-zinc-400" />
          </div>
          <h3 className="font-bold text-lg mb-1 text-zinc-800 dark:text-zinc-200">No Printer Added</h3>
          <p className="text-muted-foreground text-xs max-w-xs mb-6">
            Configure a 3D printer in settings or the printer page to monitor live telemetry.
          </p>
          <Link to="/printer">
            <Button size="sm" className="gap-2">
              <Settings className="w-4 h-4" />
              Configure Printer
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Active printer data checks
  if (!activePrinter) return null;

  if (!activePrinter.is_active) {
    return (
      <Card className="overflow-hidden border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-50 shadow-sm">
        <CardHeader className="pb-2 border-b border-zinc-200/50 dark:border-zinc-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-zinc-400" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider font-mono">
                <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="•••••" inline>
                  {activePrinter.name}
                </PrivacyWrapper>
              </CardTitle>
            </div>
            {printers.length > 1 && (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handlePrev}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-8 pb-8 text-center flex flex-col items-center">
          <Activity className="h-10 w-10 text-zinc-400 mb-4 opacity-50" />
          <h3 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Printer Disabled</h3>
          <p className="text-xs text-muted-foreground max-w-xs mb-4">
            This printer is configured but marked inactive. Live telemetry monitoring is disabled.
          </p>
          <Link to="/printer">
            <Button size="sm" variant="outline">Manage Printer</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const hasValidData = !isError && status && Object.keys(status).length > 0;
  const lastValidDataTime = hasValidData ? dataUpdatedAt : null;
  const idleDuration = status?.last_updated
    ? (now - status.last_updated * 1000)
    : (lastValidDataTime ? (now - lastValidDataTime) : (now - mountTime));
  const isWarning = idleDuration > 60000; // 1 minute
  const isOffline = idleDuration > 300000 ||
    status?.gcode_state === 'OFFLINE' ||
    (status?.online === false || (typeof status?.online === 'object' && status?.online !== null && status?.online.ahb === false));

  const renderContent = () => {
    if (!hasValidData || isOffline || isWarning) {
      if (isOffline) {
        return (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-12 w-12 text-red-500 mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-red-200 mb-1">Printer Offline</h3>
            <p className="text-red-300/60 text-xs">Connection lost or power off for {Math.floor(idleDuration / 60000)}m</p>
          </div>
        );
      }

      if (isWarning) {
        return (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="relative mb-4">
              <Activity className="h-12 w-12 text-white/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">?</span>
              </div>
            </div>
            <p className="font-bold text-sm mb-1">Status Uncertain</p>
            <p className="text-white/60 text-[10px]">Waiting for confirmation...</p>
            <div className="mt-4 px-3 py-1 bg-white/20 rounded-full text-[10px] font-mono animate-pulse">
              Auto-offline in {Math.ceil((300000 - idleDuration) / 60000)}m
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Activity className="h-12 w-12 text-gray-700 mb-4 animate-spin-slow" />
          <p className="text-gray-400 text-sm">Connecting telemetry...</p>
        </div>
      );
    }

    const progress = status.percent || 0;
    const nozzleTemp = Math.round(status.nozzle_temper || 0);
    const bedTemp = Math.round(status.bed_temper || 0);
    const chamberTemp = status.info?.temp || status.chamber_temper || 0;
    const remainingTime = status.remain_time || 0;
    const layerNum = status.layer_num || 0;
    const totalLayers = status.total_layer_num || 0;

    return (
      <div className="transition-all duration-300">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white/70">
              <Thermometer className="h-4 w-4" />
              <span className="text-xs font-medium">Bed / Cham / Nozzle</span>
            </div>
            <div className="text-lg font-bold">
              <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="•• / •• / ••" inline>
                {bedTemp}° / {chamberTemp}° / {nozzleTemp}°
              </PrivacyWrapper>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white/70">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Remaining</span>
            </div>
            <div className="text-lg font-bold">
              <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="•••" inline>
                {remainingTime}m
              </PrivacyWrapper>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-white/80">
              Progress (
              <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="••/••" inline>
                {layerNum}/{totalLayers}
              </PrivacyWrapper>
              )
            </span>
            <span className="font-bold">
              <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="••%" inline>
                {progress}%
              </PrivacyWrapper>
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
            <div
              className={`h-full bg-white transition-all duration-1000 ease-in-out`}
              style={{ width: isMasked('maskPrinterTelemetryName') ? '0%' : `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-4 text-[10px] text-white/40 font-mono truncate">
          <PrivacyWrapper keyName="maskPrinterSubtaskName" placeholder="••••••••••••••••" inline>
            {status.subtask_name || 'Printer Standby'}
          </PrivacyWrapper>
        </div>
      </div>
    );
  };

  const gcodeState = status?.gcode_state || 'IDLE';
  const speedLvl = status?.spd_lvl || 2;

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
  const getCardStyle = (state: string, isOfflineState: boolean, isWarningState: boolean, hovered: boolean) => {
    if (isOfflineState) {
      return {
        background: 'linear-gradient(135deg, #450a0a 0%, #09090b 80%, #000000 100%)',
        borderColor: hovered ? '#ef4444' : 'rgba(239, 68, 68, 0.2)',
        boxShadow: hovered ? '0 0 20px rgba(239, 68, 68, 0.15)' : 'none',
      };
    }
    if (isWarningState) {
      return {
        background: 'linear-gradient(135deg, #451a03 0%, #09090b 80%, #000000 100%)',
        borderColor: hovered ? '#f59e0b' : 'rgba(245, 158, 11, 0.2)',
        boxShadow: hovered ? '0 0 20px rgba(245, 158, 11, 0.15)' : 'none',
      };
    }

    switch (state) {
      case 'RUNNING':
        return {
          background: 'linear-gradient(135deg, #022c22 0%, #09090b 80%, #000000 100%)',
          borderColor: hovered ? '#10b981' : 'rgba(16, 185, 129, 0.2)',
          boxShadow: hovered ? '0 0 20px rgba(16, 185, 129, 0.15)' : 'none',
        };
      case 'PAUSE':
        return {
          background: 'linear-gradient(135deg, #451a03 0%, #09090b 80%, #000000 100%)',
          borderColor: hovered ? '#f59e0b' : 'rgba(245, 158, 11, 0.2)',
          boxShadow: hovered ? '0 0 20px rgba(245, 158, 11, 0.15)' : 'none',
        };
      case 'FAILED':
        return {
          background: 'linear-gradient(135deg, #450a0a 0%, #09090b 80%, #000000 100%)',
          borderColor: hovered ? '#ef4444' : 'rgba(239, 68, 68, 0.2)',
          boxShadow: hovered ? '0 0 20px rgba(239, 68, 68, 0.15)' : 'none',
        };
      case 'FINISH':
        return {
          background: 'linear-gradient(135deg, #1e3a8a 0%, #09090b 80%, #000000 100%)',
          borderColor: hovered ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)',
          boxShadow: hovered ? '0 0 20px rgba(59, 130, 246, 0.15)' : 'none',
        };
      default: // IDLE
        return {
          background: 'linear-gradient(135deg, #1e3a8a 0%, #09090b 85%, #000000 100%)',
          borderColor: hovered ? '#3b82f6' : 'rgba(59, 130, 246, 0.15)',
          boxShadow: hovered ? '0 0 20px rgba(59, 130, 246, 0.15)' : 'none',
        };
    }
  };

  const cardStyle = getCardStyle(gcodeState, isOffline, isWarning, isHovered);

  return (
    <Card 
      className="overflow-hidden border text-white shadow-xl relative transition-all duration-300"
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-2 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${
              isOffline ? 'bg-red-400' : isWarning ? 'bg-amber-400' : 
              gcodeState === 'RUNNING' ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'
            }`} />
            <CardTitle className="text-sm font-bold uppercase tracking-wider font-mono">
              <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="•••••" inline>
                {activePrinter.name}
              </PrivacyWrapper> ({isOffline ? 'OFFLINE' : isWarning ? 'UNCERTAIN' : gcodeState})
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {!isOffline && !isWarning && hasValidData && (
              <div className="text-[10px] bg-white/15 px-2 py-0.5 rounded-full font-mono font-medium">
                <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="•••••" inline>
                  {getSpeedLabel(speedLvl)}
                </PrivacyWrapper>
              </div>
            )}
            {printers.length > 1 && (
              <div className="flex items-center gap-0.5 bg-black/30 rounded-md p-0.5">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 text-white/70 hover:text-white hover:bg-white/10" 
                  onClick={handlePrev}
                  disabled={isTransitioning}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 text-white/70 hover:text-white hover:bg-white/10" 
                  onClick={handleNext}
                  disabled={isTransitioning}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 relative overflow-hidden min-h-[160px] flex flex-col justify-between">
        <div className={`transition-all duration-200 transform ${
          isTransitioning 
            ? slideDirection === 'left' 
              ? 'opacity-0 -translate-x-8' 
              : 'opacity-0 translate-x-8' 
            : 'opacity-100 translate-x-0'
        }`}>
          {renderContent()}
        </div>

        {/* Carousel indicators */}
        {printers.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-4 pt-2">
            {printers.map((p, idx) => (
              <button
                key={p.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/30'
                }`}
                onClick={() => {
                  if (idx === currentIndex || isTransitioning) return;
                  setSlideDirection(idx > currentIndex ? 'left' : 'right');
                  setIsTransitioning(true);
                  setTimeout(() => {
                     setCurrentIndex(idx);
                     setIsTransitioning(false);
                  }, 200);
                }}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PrinterStatusWidget;
