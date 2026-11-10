import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Thermometer, Clock, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { printerApi } from '@/api/printer';
import { queryKeys } from '@/lib/query-keys';
import type { Printer, PrinterStatus } from '@/types';
import { usePrivacy } from '@/context/PrivacyContext';
import { PrivacyWrapper } from '@/components/shared/PrivacyWrapper';
import {
  computeIdleDuration,
  extractWidgetTelemetry,
  getSpeedLabel,
  getWidgetCardStyle,
  getWidgetDotColor,
  getWidgetStateLabel,
  isPrinterOffline,
} from '@/lib/printer-utils';

const LoadingWidget = () => (
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

const EmptyWidget = () => (
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
        <Button size="sm" className="gap-2"><Settings className="w-4 h-4" /> Configure Printer</Button>
      </Link>
    </CardContent>
  </Card>
);

const DisabledWidget = ({
  printerName,
  showControls,
  onPrev,
  onNext,
}: {
  printerName: string;
  showControls: boolean;
  onPrev: () => void;
  onNext: () => void;
}) => (
  <Card className="overflow-hidden border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-50 shadow-sm">
    <CardHeader className="pb-2 border-b border-zinc-200/50 dark:border-zinc-900/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-zinc-400" />
          <CardTitle className="text-sm font-bold uppercase tracking-wider font-mono">
            <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="•••••" inline>{printerName}</PrivacyWrapper>
          </CardTitle>
        </div>
        {showControls && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onPrev}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onNext}><ChevronRight className="h-4 w-4" /></Button>
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
      <Link to="/printer"><Button size="sm" variant="outline">Manage Printer</Button></Link>
    </CardContent>
  </Card>
);

const LiveWidgetStats = ({ status }: { status: PrinterStatus }) => {
  const { isMasked } = usePrivacy();
  const t = extractWidgetTelemetry(status);
  const barWidth = isMasked('maskPrinterTelemetryName') ? '0%' : `${t.progress}%`;

  return (
    <div className="transition-all duration-300">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white/70">
            <Thermometer className="h-4 w-4" /><span className="text-xs font-medium">Bed / Cham / Nozzle</span>
          </div>
          <div className="text-lg font-bold">
            <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="•• / •• / ••" inline>
              {t.bedTemp}° / {t.chamberTemp}° / {t.nozzleTemp}°
            </PrivacyWrapper>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white/70">
            <Clock className="h-4 w-4" /><span className="text-xs font-medium">Remaining</span>
          </div>
          <div className="text-lg font-bold">
            <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="•••" inline>{t.remainTime}m</PrivacyWrapper>
          </div>
        </div>
      </div>
      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-white/80">
            Progress (<PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="••/••" inline>{t.layerNum}/{t.totalLayerNum}</PrivacyWrapper>)
          </span>
          <span className="font-bold">
            <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="••%" inline>{t.progress}%</PrivacyWrapper>
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
          <div className="h-full bg-white transition-all duration-1000 ease-in-out" style={{ width: barWidth }} />
        </div>
      </div>
      <div className="mt-4 text-[10px] text-white/40 font-mono truncate">
        <PrivacyWrapper keyName="maskPrinterSubtaskName" placeholder="••••••••••••••••" inline>{t.subtaskName}</PrivacyWrapper>
      </div>
    </div>
  );
};

const WidgetBodyContent = ({
  status,
  hasValidData,
  isOffline,
  isWarning,
  idleDuration,
}: {
  status: PrinterStatus | null | undefined;
  hasValidData: boolean;
  isOffline: boolean;
  isWarning: boolean;
  idleDuration: number;
}) => {
  if (isOffline) {
    const offlineMinutes = Math.max(0, Math.floor(idleDuration / 60000));
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Activity className="h-12 w-12 text-red-500 mb-4 opacity-50" />
        <h3 className="text-lg font-bold text-red-200 mb-1">Printer Offline</h3>
        <p className="text-red-300/60 text-xs">
          {status?.last_updated
            ? `Connection lost or power off for ${offlineMinutes}m`
            : 'Printer unreachable on local network'}
        </p>
      </div>
    );
  }
  if (isWarning) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="relative mb-4">
          <Activity className="h-12 w-12 text-white/20" />
          <div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl font-bold">?</span></div>
        </div>
        <p className="font-bold text-sm mb-1">Status Uncertain</p>
        <p className="text-white/60 text-[10px]">Waiting for confirmation...</p>
        <div className="mt-4 px-3 py-1 bg-white/20 rounded-full text-[10px] font-mono animate-pulse">
          Auto-offline in {Math.ceil((300000 - idleDuration) / 60000)}m
        </div>
      </div>
    );
  }
  if (!hasValidData || !status) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Activity className="h-12 w-12 text-gray-700 mb-4 animate-spin-slow" />
        <p className="text-gray-400 text-sm">Connecting telemetry...</p>
      </div>
    );
  }
  return <LiveWidgetStats status={status} />;
};

const ActivePrinterWidgetCard = ({
  activePrinter,
  printersCount,
  status,
  isError,
  dataUpdatedAt,
  mountTime,
  now,
  onPrev,
  onNext,
}: {
  activePrinter: Printer;
  printersCount: number;
  status: PrinterStatus | undefined;
  isError: boolean;
  dataUpdatedAt: number;
  mountTime: number;
  now: number;
  onPrev: () => void;
  onNext: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const hasValidData = Boolean(!isError && status && Object.keys(status).length > 0);
  const idleDuration = computeIdleDuration(status, hasValidData, dataUpdatedAt, mountTime, now);
  const isWarning = idleDuration > 60000;
  const isOffline = idleDuration > 300000 || isPrinterOffline(status, now);
  const gcodeState = status?.gcode_state || 'IDLE';

  return (
    <Card
      className="overflow-hidden border text-white shadow-xl relative transition-all duration-300"
      style={getWidgetCardStyle(gcodeState, isOffline, isWarning, isHovered)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-2 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${getWidgetDotColor(isOffline, isWarning, gcodeState)}`} />
            <CardTitle className="text-sm font-bold uppercase tracking-wider font-mono">
              <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="•••••" inline>{activePrinter.name}</PrivacyWrapper>{' '}
              ({getWidgetStateLabel(isOffline, isWarning, gcodeState)})
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {!isOffline && !isWarning && hasValidData && (
              <div className="text-[10px] bg-white/15 px-2 py-0.5 rounded-full font-mono font-medium">
                <PrivacyWrapper keyName="maskPrinterTelemetryName" placeholder="•••••" inline>{getSpeedLabel(status?.spd_lvl)}</PrivacyWrapper>
              </div>
            )}
            {printersCount > 1 && (
              <div className="flex items-center gap-0.5 bg-black/30 rounded-md p-0.5">
                <Button variant="ghost" size="icon" className="h-5 w-5 text-white/70 hover:text-white hover:bg-white/10" onClick={onPrev}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-5 w-5 text-white/70 hover:text-white hover:bg-white/10" onClick={onNext}><ChevronRight className="h-3.5 w-3.5" /></Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 relative overflow-hidden min-h-[160px] flex flex-col justify-between">
        <WidgetBodyContent status={status} hasValidData={hasValidData} isOffline={isOffline} isWarning={isWarning} idleDuration={idleDuration} />
      </CardContent>
    </Card>
  );
};

const PrinterStatusWidget = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mountTime] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  const { data: printers, isLoading: isLoadingPrinters } = useQuery<Printer[]>({
    queryKey: queryKeys.printers,
    queryFn: printerApi.list,
    refetchInterval: 10000,
  });

  const validatedIndex = printers && currentIndex >= printers.length ? 0 : currentIndex;
  const activePrinter = printers && printers.length > 0 ? printers[validatedIndex] : null;

  const { data: status, isError, dataUpdatedAt } = useQuery<PrinterStatus>({
    queryKey: queryKeys.printerStatus(activePrinter?.id),
    queryFn: () => printerApi.getStatus(activePrinter!.id),
    enabled: Boolean(activePrinter),
    refetchInterval: 5000,
  });

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  if (isLoadingPrinters) return <LoadingWidget />;
  if (!printers || printers.length === 0 || !activePrinter) return <EmptyWidget />;

  const handlePrev = () => setCurrentIndex(validatedIndex === 0 ? printers.length - 1 : validatedIndex - 1);
  const handleNext = () => setCurrentIndex(validatedIndex === printers.length - 1 ? 0 : validatedIndex + 1);

  if (!activePrinter.is_active) {
    return <DisabledWidget printerName={activePrinter.name} showControls={printers.length > 1} onPrev={handlePrev} onNext={handleNext} />;
  }

  return (
    <ActivePrinterWidgetCard
      activePrinter={activePrinter}
      printersCount={printers.length}
      status={status}
      isError={isError}
      dataUpdatedAt={dataUpdatedAt}
      mountTime={mountTime}
      now={now}
      onPrev={handlePrev}
      onNext={handleNext}
    />
  );
};

export default PrinterStatusWidget;
