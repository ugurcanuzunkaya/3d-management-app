import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PrinterStatusBadgeProps {
  status: string;
  className?: string;
}

export const PrinterStatusBadge: React.FC<PrinterStatusBadgeProps> = ({ status, className }) => {
  const sLower = status.toLowerCase();
  if (sLower === 'offline' || sLower === 'disconnected') {
    return <Badge variant="destructive" className={className}>Offline</Badge>;
  }
  if (sLower === 'running' || sLower === 'printing') {
    return <Badge variant="default" className={cn('bg-green-600 hover:bg-green-700', className)}>Printing</Badge>;
  }
  if (sLower === 'finish' || sLower === 'completed') {
    return <Badge variant="secondary" className={className}>Finished</Badge>;
  }
  return <Badge variant="outline" className={className}>{sLower === 'idle' ? 'Idle' : status || 'Unknown'}</Badge>;
};
