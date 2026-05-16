import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Percent, Clock, Thermometer, Gauge, Box } from 'lucide-react';

interface StatusCardProps {
  gcodeState: string;
  progress: number;
  remainTime: number;
  layerNum: number;
  totalLayerNum: number;
}

export const StatusCard = ({ gcodeState, progress, remainTime, layerNum, totalLayerNum }: StatusCardProps) => {
  const getStateColor = (state: string) => {
    switch (state) {
      case 'RUNNING': return 'bg-green-400 animate-pulse';
      case 'PAUSE': return 'bg-yellow-400 animate-bounce';
      case 'FINISH': return 'bg-blue-400';
      case 'FAILED': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <Card className="lg:col-span-2 overflow-hidden border-none bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl">
      <CardHeader className="pb-2 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${getStateColor(gcodeState)}`} />
            <CardTitle className="text-lg font-bold uppercase tracking-wider">{gcodeState}</CardTitle>
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
            <div className="text-3xl font-bold">{remainTime || 0}m</div>
          </div>
        </div>
        <div className="mt-8 space-y-4">
          <div className="h-3 w-full rounded-full bg-white/20 overflow-hidden">
            <div className="h-full bg-white transition-all duration-1000 ease-in-out shadow-[0_0_10px_rgba(255,255,255,0.8)]" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-xs font-medium text-white/60">
            <span>Layer {layerNum || 0}</span>
            <span>Total {totalLayerNum || 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface ThermalCardProps {
  nozzle: number;
  nozzleTarget: number;
  bed: number;
  bedTarget: number;
  chamber: number;
}

export const ThermalCard = ({ nozzle, nozzleTarget, bed, bedTarget, chamber }: ThermalCardProps) => (
  <Card className="border-none shadow-md">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Thermometer className="w-4 h-4" /> Thermals
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex justify-between items-end">
        <span className="text-sm">Nozzle</span>
        <div className="text-right">
          <div className="text-xl font-bold">{Math.round(nozzle || 0)}°C</div>
          <div className="text-[10px] text-muted-foreground">Target: {nozzleTarget}°C</div>
        </div>
      </div>
      <div className="flex justify-between items-end">
        <span className="text-sm">Bed</span>
        <div className="text-right">
          <div className="text-xl font-bold">{Math.round(bed || 0)}°C</div>
          <div className="text-[10px] text-muted-foreground">Target: {bedTarget}°C</div>
        </div>
      </div>
      <div className="flex justify-between items-end pt-2 border-t">
        <span className="text-sm font-medium">Chamber</span>
        <span className="text-xl font-bold">{chamber || 0}°C</span>
      </div>
    </CardContent>
  </Card>
);

interface PerformanceCardProps {
  spdLvl: number;
  spdMag: number;
  nozzleType: string;
  nozzleDiam: string;
}

export const PerformanceCard = ({ spdLvl, spdMag, nozzleType, nozzleDiam }: PerformanceCardProps) => {
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
    <Card className="border-none shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Gauge className="w-4 h-4" /> Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-end">
          <span className="text-sm">Speed Level</span>
          <div className="text-right">
            <div className="text-xl font-bold">{getSpeedLabel(spdLvl)}</div>
            <div className="text-[10px] text-muted-foreground">{spdMag}% Magnitude</div>
          </div>
        </div>
        <div className="flex justify-between items-end">
          <span className="text-sm">Nozzle Type</span>
          <div className="text-right">
            <div className="text-md font-bold truncate max-w-[100px]">{nozzleType || 'Stainless'}</div>
            <div className="text-[10px] text-muted-foreground">{nozzleDiam || '0.4'}mm</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface AMSInfoCardProps {
  humidityRaw: number;
  humidity: number;
  temp: number;
  serial: string;
}

export const AMSInfoCard = ({ humidityRaw, humidity, temp, serial }: AMSInfoCardProps) => (
  <Card className="lg:col-span-4 border-none shadow-md bg-gray-50 dark:bg-gray-900 mt-6">
    <CardHeader>
      <CardTitle className="text-md font-bold flex items-center gap-2">
        <Box className="w-5 h-5 text-blue-500" /> AMS Internal Info
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Humidity</p>
          <p className="text-2xl font-bold text-blue-600">{humidityRaw || 0}%</p>
          <p className="text-[10px] text-muted-foreground">Raw: {humidity || 0}</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Internal Temp</p>
          <p className="text-2xl font-bold text-orange-600">{temp || 0}°C</p>
        </div>
        <div className="lg:col-span-2 flex items-center justify-center p-6 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-xs text-muted-foreground text-center">
            Live data connection active for serial {serial || 'Printer'}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);
