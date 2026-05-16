import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PrinterStatusBadgeProps {
  status: string;
  className?: string;
}

export const PrinterStatusBadge: React.FC<PrinterStatusBadgeProps> = ({ status, className }) => {
  const getStatusConfig = (s: string) => {
    const s_lower = s.toLowerCase();
    if (s_lower === 'offline' || s_lower === 'disconnected') 
      return { label: 'Offline', variant: 'destructive' as const };
    if (s_lower === 'running' || s_lower === 'printing') 
      return { label: 'Printing', variant: 'default' as const, className: 'bg-green-600 hover:bg-green-700' };
    if (s_lower === 'finish' || s_lower === 'completed') 
      return { label: 'Finished', variant: 'secondary' as const };
    if (s_lower === 'idle') 
      return { label: 'Idle', variant: 'outline' as const };
    return { label: s || 'Unknown', variant: 'outline' as const };
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
};
