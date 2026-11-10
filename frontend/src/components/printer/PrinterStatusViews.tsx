import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Activity, Plus, X } from 'lucide-react';
import type { Printer, PrinterStatus } from '@/types';
import { usePrivacy } from '@/context/PrivacyContext';
import { PrivacyWrapper } from '@/components/shared/PrivacyWrapper';

export const EmptyFleetView = ({ onAddClick }: { onAddClick: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/30 dark:bg-zinc-950/10">
    <Activity className="w-16 h-16 text-zinc-300 dark:text-zinc-800 mb-6" />
    <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200 mb-2">No printer added</h2>
    <p className="text-muted-foreground max-w-sm mb-8">
      You don't have any printers configured yet. Add your Bambu Lab printer to start receiving real-time MQTT telemetry.
    </p>
    <Button onClick={onAddClick} className="gap-2 shadow-md">
      <Plus className="w-4 h-4" /> Add Your First Printer
    </Button>
  </div>
);

export const DisabledPrinterView = ({ onEnableClick }: { onEnableClick: () => void }) => (
  <Card className="border border-dashed border-zinc-800 p-8 text-center bg-zinc-950/80 text-white">
    <Activity className="w-12 h-12 text-zinc-600 opacity-50 mx-auto mb-4" />
    <h3 className="font-semibold text-lg text-zinc-300">Telemetry Stream Off</h3>
    <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
      This printer is currently disabled. Toggle connection on in the settings dialog to resume live MQTT telemetry monitoring.
    </p>
    <Button size="sm" variant="outline" onClick={onEnableClick} className="self-center border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 hover:text-white">
      Enable Printer Connection
    </Button>
  </Card>
);

export const OfflinePrinterView = ({
  printer,
  status,
  now,
  onRecheck,
}: {
  printer: Printer;
  status: PrinterStatus | null | undefined;
  now: number;
  onRecheck: () => void;
}) => {
  const minutesOffline = status?.last_updated ? Math.max(0, Math.floor((now - status.last_updated * 1000) / 60000)) : 'several';
  return (
    <Card className="border border-red-900 p-8 text-center bg-zinc-950/80 text-white shadow-[0_0_15px_rgba(239,68,68,0.05)]">
      <Activity className="w-12 h-12 text-red-500 opacity-60 mx-auto mb-4 animate-pulse" />
      <h3 className="font-semibold text-lg text-red-400">Printer Offline</h3>
      <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1 mb-6">
        No telemetry packets have been received from IP{' '}
        <PrivacyWrapper keyName="maskPrinterIp" placeholder="•••.•••.•••.•••" inline>
          {printer.ip_address}
        </PrivacyWrapper>{' '}
        in the last {minutesOffline} minutes. Check if the printer is powered on and connected to the same local network.
      </p>
      <Button variant="outline" size="sm" onClick={onRecheck} className="self-center border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 hover:text-white">
        Recheck Connection
      </Button>
    </Card>
  );
};

export const AwaitingTelemetryView = () => (
  <Card className="p-8 text-center border border-zinc-800 bg-zinc-950/80 text-white">
    <Activity className="w-10 h-10 text-indigo-400 animate-spin mx-auto mb-4" />
    <h3 className="font-medium text-zinc-300">Awaiting Telemetry...</h3>
    <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-1">
      Subscribing to MQTT topic and syncing printer logs. This may take up to a minute.
    </p>
  </Card>
);

export interface PrinterFormValues {
  name: string;
  ip_address: string;
  serial_number: string;
  access_code: string;
  is_active: boolean;
}

const PrinterFormInputs = ({
  values,
  setValues,
  isMasked,
}: {
  values: PrinterFormValues;
  setValues: React.Dispatch<React.SetStateAction<PrinterFormValues>>;
  isMasked: (k: string) => boolean;
}) => (
  <CardContent className="pt-6 space-y-4">
    <div className="space-y-1.5">
      <Label htmlFor="printer-name">Friendly Name</Label>
      <Input id="printer-name" placeholder="e.g. Bambu Lab P2S" value={values.name} onChange={e => setValues({ ...values, name: e.target.value })} />
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="printer-ip">Local IP Address</Label>
      <Input id="printer-ip" type={isMasked('maskPrinterIp') ? 'password' : 'text'} placeholder="e.g. 192.168.1.150" value={values.ip_address} onChange={e => setValues({ ...values, ip_address: e.target.value })} />
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="printer-serial">Bambu Serial Number</Label>
      <Input id="printer-serial" type={isMasked('maskPrinterSerial') ? 'password' : 'text'} placeholder="e.g. 22E8BA572201450" value={values.serial_number} onChange={e => setValues({ ...values, serial_number: e.target.value })} />
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="printer-access">LAN Access Code</Label>
      <Input id="printer-access" type={isMasked('maskPrinterAccessCode') ? 'password' : 'text'} placeholder="8-character alphanumeric code" value={values.access_code} onChange={e => setValues({ ...values, access_code: e.target.value })} />
    </div>
    <div className="flex items-center gap-2 pt-2">
      <input id="printer-active" type="checkbox" checked={values.is_active} onChange={e => setValues({ ...values, is_active: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
      <Label htmlFor="printer-active" className="cursor-pointer">Active connection stream</Label>
    </div>
  </CardContent>
);

export const PrinterConnectionModal = ({
  isOpen,
  title,
  submitLabel,
  pendingLabel,
  initialValues,
  isPending,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  title: string;
  submitLabel: string;
  pendingLabel: string;
  initialValues: PrinterFormValues;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: PrinterFormValues) => void;
}) => {
  const [values, setValues] = useState<PrinterFormValues>(initialValues);
  const { isMasked } = usePrivacy();

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name || !values.ip_address || !values.serial_number || !values.access_code) {
      alert('Please fill out all fields.');
      return;
    }
    onSubmit(values);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-900">
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <form onSubmit={handleFormSubmit}>
          <PrinterFormInputs values={values} setValues={setValues} isMasked={isMasked} />
          <div className="p-6 pt-0 flex gap-3 border-t border-zinc-100 dark:border-zinc-900 mt-6 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-500 text-white">
              {isPending ? pendingLabel : submitLabel}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
