import { Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PrinterStatusViewsProps {
  idleDuration: number;
  onRetry: () => void;
}

export const OfflineStatus = ({ idleDuration, onRetry }: PrinterStatusViewsProps) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
    <Activity className="w-20 h-20 text-red-500 mb-6 opacity-40" />
    <h2 className="text-3xl font-bold text-red-600 mb-2">Printer Offline</h2>
    <p className="text-muted-foreground max-w-md">
      Connection lost or printer turned off for {Math.floor(idleDuration / 60000)} minutes.
      Check power and network connection.
    </p>
    <Button variant="outline" className="mt-8" onClick={onRetry}>
      Try Reconnecting
    </Button>
  </div>
);

export const UncertainStatus = ({ idleDuration }: { idleDuration: number }) => (
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

export const SyncStatus = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
    <Activity className="w-16 h-16 text-primary animate-spin-slow" />
    <p className="text-xl font-medium text-muted-foreground">Synchronizing printer telemetry...</p>
  </div>
);
