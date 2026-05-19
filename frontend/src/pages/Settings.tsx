import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import api from '@/lib/api';
import type { Settings } from '@/types';
import { useState, useEffect } from 'react';
import { SettingsSkeleton } from '@/components/ui/Skeleton';

const DEFAULT_PRIVACY_SETTINGS = {
  // Original credentials/financial fields
  maskPrinterIp: true,
  maskPrinterSerial: true,
  maskPrinterAccessCode: true,
  maskPrinterSubtaskName: true,
  maskFilamentPrice: true,
  maskInventoryValue: true,
  maskJobName: true,
  maskJobTotalCost: true,
  maskJobProductionCost: true,
  maskJobProfit: true,
  maskSettingsElectricPrice: true,
  maskSettingsFallbackWattage: true,

  // New elements: Navbar & Layout
  maskAppName: false,
  maskNavDashboard: false,
  maskNavJobs: false,
  maskNavStock: false,
  maskNavModels: false,
  maskNavPrinter: false,
  maskNavSettings: false,

  // New elements: Page Titles
  maskDashboardTitle: false,
  maskPrinterTitle: false,
  maskStockTitle: false,
  maskLibraryTitle: false,
  maskJobsTitle: false,
  maskStockSettingsTitle: false,

  // New elements: Page details / stats / text
  maskDashboardStats: false,
  maskPrinterTelemetryName: false,
  maskStockSpoolName: false,
  maskLibraryModelName: false,
  maskJobsTableData: false,
  maskStockSettingsList: false,

  // Job Log specifics
  maskJobDate: false,
  maskJobType: false,
  maskJobFilaments: false,
  maskJobDuration: false,
};

const PRIVACY_FIELDS_METADATA: Record<keyof typeof DEFAULT_PRIVACY_SETTINGS, { label: string; description: string }> = {
  // Credentials & Financials
  maskPrinterIp: { label: "Printer IP Address", description: "Hides IP addresses on printers page." },
  maskPrinterSerial: { label: "Printer Serial Number", description: "Hides device serial numbers." },
  maskPrinterAccessCode: { label: "Printer Access Code", description: "Hides local LAN access codes." },
  maskPrinterSubtaskName: { label: "Print Job Filename", description: "Hides active G-code subtask names." },
  maskFilamentPrice: { label: "Filament Price per kg", description: "Hides price per kg on filament cards." },
  maskInventoryValue: { label: "Warehouse Inventory Value", description: "Hides total estimated warehouse stock value." },
  maskJobName: { label: "Job Customer/Client Name", description: "Hides print job names in history logs." },
  maskJobTotalCost: { label: "Job Total Sales Price", description: "Hides sales prices charged to clients." },
  maskJobProductionCost: { label: "Job Production Cost", description: "Hides production and calculated costs." },
  maskJobProfit: { label: "Job Profit Margin", description: "Hides calculated profit margins." },
  maskSettingsElectricPrice: { label: "Electricity Cost Input", description: "Hides electricity configuration input values." },
  maskSettingsFallbackWattage: { label: "Fallback Wattage Input", description: "Hides fallback wattage configuration input values." },

  // Navbar
  maskAppName: { label: "Navbar: App Name", description: "Hides '3D Manager' logo text." },
  maskNavDashboard: { label: "Navbar: Dashboard Link", description: "Hides the text label 'Dashboard'." },
  maskNavJobs: { label: "Navbar: Jobs Link", description: "Hides the text label 'Jobs'." },
  maskNavStock: { label: "Navbar: Stock Link", description: "Hides the text label 'Stock'." },
  maskNavModels: { label: "Navbar: Models Link", description: "Hides the text label 'Models'." },
  maskNavPrinter: { label: "Navbar: Printer Link", description: "Hides the text label 'Printer'." },
  maskNavSettings: { label: "Navbar: Settings Link", description: "Hides the text label 'Settings'." },

  // Page Titles
  maskDashboardTitle: { label: "Title: Dashboard Title", description: "Hides 'Dashboard' page title." },
  maskPrinterTitle: { label: "Title: Printer Manager Title", description: "Hides 'Printers Manager' page title." },
  maskStockTitle: { label: "Title: Filament Stock Title", description: "Hides 'Filament Stock' page title." },
  maskLibraryTitle: { label: "Title: Model Library Title", description: "Hides '3D Model Library' page title." },
  maskJobsTitle: { label: "Title: Print Jobs Title", description: "Hides 'Print Jobs' page title." },
  maskStockSettingsTitle: { label: "Title: Stock Settings Title", description: "Hides 'Stock Settings' page title." },

  // Page Data
  maskDashboardStats: { label: "Page Data: Dashboard Stats", description: "Hides total stock weight summaries." },
  maskPrinterTelemetryName: { label: "Page Data: Printer Telemetry Details", description: "Hides printer names, temps, and speeds." },
  maskStockSpoolName: { label: "Page Data: Filament Spool Info", description: "Hides brand, color names, and weights." },
  maskLibraryModelName: { label: "Page Data: 3D Model Stats", description: "Hides model names, file sizes, and print times." },
  maskJobsTableData: { label: "Page Data: Jobs Table Fields", description: "Hides dates, weights, notes, and printer names." },
  maskStockSettingsList: { label: "Page Data: Stock Settings Lists", description: "Hides configuration tables for types/colors." },
  
  // Job Log specifics
  maskJobDate: { label: "Job Log: Date", description: "Hides the print job date/time in history log." },
  maskJobType: { label: "Job Log: Type", description: "Hides the type description of the printed object." },
  maskJobFilaments: { label: "Job Log: Filaments", description: "Hides the names and spools of filaments used." },
  maskJobDuration: { label: "Job Log: Duration", description: "Hides the printing duration in minutes." },
};

const SettingsForm = ({ initialSettings }: { initialSettings: Settings }) => {
  const queryClient = useQueryClient();
  const [electricPrice, setElectricPrice] = useState(initialSettings.electric_price.toString());
  const [fallbackWattage, setFallbackWattage] = useState(initialSettings.fallback_wattage.toString());
  
  const [showPersonalInfo, setShowPersonalInfo] = useState(() => {
    const saved = localStorage.getItem('showPersonalInfo');
    return saved ? JSON.parse(saved) : false;
  });

  const [privacySettings, setPrivacySettings] = useState(() => {
    const saved = localStorage.getItem('privacySettings');
    return saved ? { ...DEFAULT_PRIVACY_SETTINGS, ...JSON.parse(saved) } : DEFAULT_PRIVACY_SETTINGS;
  });

  const [selectedLeft, setSelectedLeft] = useState<string[]>([]);
  const [selectedRight, setSelectedRight] = useState<string[]>([]);

  useEffect(() => {
    const handleUpdate = () => {
      const savedShow = localStorage.getItem('showPersonalInfo');
      setShowPersonalInfo(savedShow ? JSON.parse(savedShow) : false);

      const savedPriv = localStorage.getItem('privacySettings');
      setPrivacySettings(savedPriv ? { ...DEFAULT_PRIVACY_SETTINGS, ...JSON.parse(savedPriv) } : DEFAULT_PRIVACY_SETTINGS);
    };
    window.addEventListener('credentials-visibility-change', handleUpdate);
    return () => window.removeEventListener('credentials-visibility-change', handleUpdate);
  }, []);

  const savePrivacySettings = (newSettings: typeof DEFAULT_PRIVACY_SETTINGS) => {
    setPrivacySettings(newSettings);
    localStorage.setItem('privacySettings', JSON.stringify(newSettings));
    window.dispatchEvent(new Event('credentials-visibility-change'));
  };

  const handleSelectLeft = (key: string) => {
    setSelectedLeft(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSelectRight = (key: string) => {
    setSelectedRight(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const moveLeft = () => {
    if (selectedRight.length === 0) return;
    const newSettings = { ...privacySettings };
    selectedRight.forEach(key => {
      newSettings[key as keyof typeof DEFAULT_PRIVACY_SETTINGS] = true;
    });
    savePrivacySettings(newSettings);
    setSelectedRight([]);
  };

  const moveRight = () => {
    if (selectedLeft.length === 0) return;
    const newSettings = { ...privacySettings };
    selectedLeft.forEach(key => {
      newSettings[key as keyof typeof DEFAULT_PRIVACY_SETTINGS] = false;
    });
    savePrivacySettings(newSettings);
    setSelectedLeft([]);
  };

  const moveAllLeft = () => {
    const newSettings = { ...privacySettings };
    Object.keys(DEFAULT_PRIVACY_SETTINGS).forEach(key => {
      newSettings[key as keyof typeof DEFAULT_PRIVACY_SETTINGS] = true;
    });
    savePrivacySettings(newSettings);
    setSelectedRight([]);
    setSelectedLeft([]);
  };

  const moveAllRight = () => {
    const newSettings = { ...privacySettings };
    Object.keys(DEFAULT_PRIVACY_SETTINGS).forEach(key => {
      newSettings[key as keyof typeof DEFAULT_PRIVACY_SETTINGS] = false;
    });
    savePrivacySettings(newSettings);
    setSelectedRight([]);
    setSelectedLeft([]);
  };

  const mutation = useMutation({
    mutationFn: (newSettings: Settings) => api.post('/api/settings', newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });

  const handleSave = () => {
    mutation.mutate({
      electric_price: parseFloat(electricPrice),
      fallback_wattage: parseFloat(fallbackWattage)
    });
  };

  // Derived lists
  const maskedKeys = Object.keys(DEFAULT_PRIVACY_SETTINGS).filter(
    (key) => privacySettings[key as keyof typeof DEFAULT_PRIVACY_SETTINGS] === true
  ) as Array<keyof typeof DEFAULT_PRIVACY_SETTINGS>;

  const shownKeys = Object.keys(DEFAULT_PRIVACY_SETTINGS).filter(
    (key) => privacySettings[key as keyof typeof DEFAULT_PRIVACY_SETTINGS] === false
  ) as Array<keyof typeof DEFAULT_PRIVACY_SETTINGS>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Settings</h1>

      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40">
        <CardHeader>
          <CardTitle>Financial Configuration</CardTitle>
          <CardDescription>Adjust electricity prices and fallback values for cost calculations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="electric">Electric Price (TL/kWh)</Label>
            <Input
              id="electric"
              type={showPersonalInfo || !privacySettings.maskSettingsElectricPrice ? "text" : "password"}
              value={electricPrice}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setElectricPrice(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wattage">Fallback Printer Wattage (W)</Label>
            <Input
              id="wattage"
              type={showPersonalInfo || !privacySettings.maskSettingsFallbackWattage ? "text" : "password"}
              value={fallbackWattage}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFallbackWattage(e.target.value)}
            />
          </div>
          <div className="pt-2">
            <Button onClick={handleSave} disabled={mutation.isPending} className="bg-indigo-600 hover:bg-indigo-500 text-white">
              <Save className="w-4 h-4 mr-1.5" /> Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 shadow-md">
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-900 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-50 dark:to-zinc-400 bg-clip-text text-transparent">
                Privacy Toggle Configuration Menu
              </CardTitle>
              <CardDescription className="text-muted-foreground text-xs mt-1">
                Drag or transfer fields between columns to define what gets hidden when global "Hide Info" is activated.
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-50 dark:bg-zinc-900 border rounded-lg text-xs font-semibold text-zinc-500">
              {showPersonalInfo ? <Unlock className="w-3.5 h-3.5 text-indigo-500" /> : <Lock className="w-3.5 h-3.5 text-zinc-400" />}
              <span>Privacy Toggle is {showPersonalInfo ? "OFF (Showing)" : "ON (Masking)"}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-9 gap-4 items-center">
            
            {/* Left Column: Selected/Masked Fields */}
            <div className="md:col-span-4 flex flex-col h-[400px] border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/10 overflow-hidden">
              <div className="p-3 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <EyeOff className="w-3.5 h-3.5" /> Masked Fields (Selected)
                </span>
                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full">
                  {maskedKeys.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
                {maskedKeys.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400 dark:text-zinc-600">
                    <Unlock className="w-8 h-8 mb-2 opacity-55" />
                    <span className="text-xs">No fields masked. Everything remains visible.</span>
                  </div>
                ) : (
                  maskedKeys.map(key => {
                    const meta = PRIVACY_FIELDS_METADATA[key];
                    const isSelected = selectedLeft.includes(key);
                    return (
                      <div
                        key={key}
                        onClick={() => handleSelectLeft(key)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-950 dark:text-indigo-200"
                            : "bg-white dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                        }`}
                      >
                        <div className="font-semibold text-xs flex items-center justify-between">
                          <span>{meta.label}</span>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">{meta.description}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Middle: Actions */}
            <div className="md:col-span-1 flex md:flex-col justify-center items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={moveLeft}
                disabled={selectedRight.length === 0}
                title="Mask Selected Fields"
                className="shadow-sm border-zinc-200 dark:border-zinc-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4 md:rotate-0 rotate-90" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={moveRight}
                disabled={selectedLeft.length === 0}
                title="Show Selected Fields"
                className="shadow-sm border-zinc-200 dark:border-zinc-800 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4 md:rotate-0 rotate-90" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={moveAllLeft}
                disabled={shownKeys.length === 0}
                title="Mask All Fields"
                className="mt-2 md:mt-0 shadow-sm border-zinc-200 dark:border-zinc-800 disabled:opacity-40"
              >
                <ChevronsLeft className="w-4 h-4 md:rotate-0 rotate-90" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={moveAllRight}
                disabled={maskedKeys.length === 0}
                title="Show All Fields"
                className="shadow-sm border-zinc-200 dark:border-zinc-800 disabled:opacity-40"
              >
                <ChevronsRight className="w-4 h-4 md:rotate-0 rotate-90" />
              </Button>
            </div>

            {/* Right Column: Unselected/Shown Fields */}
            <div className="md:col-span-4 flex flex-col h-[400px] border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/10 overflow-hidden">
              <div className="p-3 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Shown Fields (Unselected)
                </span>
                <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold px-2 py-0.5 rounded-full">
                  {shownKeys.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
                {shownKeys.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400 dark:text-zinc-600">
                    <Lock className="w-8 h-8 mb-2 opacity-55" />
                    <span className="text-xs">All fields masked when privacy mode is active.</span>
                  </div>
                ) : (
                  shownKeys.map(key => {
                    const meta = PRIVACY_FIELDS_METADATA[key];
                    const isSelected = selectedRight.includes(key);
                    return (
                      <div
                        key={key}
                        onClick={() => handleSelectRight(key)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-950 dark:text-indigo-200"
                            : "bg-white dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                        }`}
                      >
                        <div className="font-semibold text-xs flex items-center justify-between">
                          <span>{meta.label}</span>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">{meta.description}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40">
        <CardHeader>
          <CardTitle>Cost Template</CardTitle>
          <CardDescription>Base formula: (Filament + Power) * 3</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground italic">
            The labor fee is automatically included by the 3x multiplier of production costs.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SettingsPage = () => {
  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: () => api.get('/api/settings').then(res => res.data)
  });

  if (isLoading || !settings) return <SettingsSkeleton />;

  return <SettingsForm initialSettings={settings} />;
};

export default SettingsPage;
