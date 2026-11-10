import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Library, Box, Settings, Activity, Eye, EyeOff, Sliders } from 'lucide-react';
import { usePrivacy } from '@/context/PrivacyContext';
import { PrivacyWrapper } from '@/components/shared/PrivacyWrapper';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', keyName: 'maskNavDashboard', Icon: LayoutDashboard },
  { to: '/jobs', label: 'Jobs', keyName: 'maskNavJobs', Icon: ClipboardList },
  { to: '/stock', label: 'Stock', keyName: 'maskNavStock', Icon: Box },
  { to: '/models', label: 'Models', keyName: 'maskNavModels', Icon: Library },
  { to: '/printer', label: 'Printer', keyName: 'maskNavPrinter', Icon: Activity },
  { to: '/settings', label: 'Settings', keyName: 'maskNavSettings', Icon: Settings },
] as const;

const Navbar = () => {
  const { showPersonalInfo, togglePersonalInfo, isEditMode, toggleEditMode } = usePrivacy();
  const { pathname } = useLocation();

  return (
    <nav className="border-b bg-white dark:bg-zinc-950 sticky top-0 z-40 border-zinc-200 dark:border-zinc-800">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl text-zinc-950 dark:text-zinc-50">
          <Box className="w-6 h-6 text-primary" />
          <PrivacyWrapper keyName="maskAppName" placeholder="•••••" inline>
            3D Manager
          </PrivacyWrapper>
        </div>
        <div className="flex items-center gap-6 text-zinc-700 dark:text-zinc-300">
          {NAV_ITEMS.map(({ to, label, keyName, Icon }) => {
            const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 text-sm transition-colors ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'hover:text-primary'
                }`}
              >
                <Icon className="w-4 h-4" />
                <PrivacyWrapper keyName={keyName} placeholder="•••••" inline>
                  {label}
                </PrivacyWrapper>
              </Link>
            );
          })}
          
          <div className="flex items-center gap-1">
            <button
              onClick={togglePersonalInfo}
              className="flex items-center gap-1.5 hover:text-primary transition-colors text-sm font-medium focus:outline-none p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
              title={showPersonalInfo ? "Hide Sensitive/Personal Info" : "Show Sensitive/Personal Info"}
            >
              {showPersonalInfo ? (
                <EyeOff className="w-4 h-4 text-zinc-500" />
              ) : (
                <Eye className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              )}
              <span className="text-xs">{showPersonalInfo ? "Hide Info" : "Show Info"}</span>
            </button>

            <button
              onClick={toggleEditMode}
              className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-sm font-medium transition-all ${
                isEditMode
                  ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-500 hover:border-indigo-500'
                  : 'border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 border-zinc-200 dark:border-zinc-800'
              }`}
              title="Configure Page Privacy Toggles"
            >
              <Sliders className="w-4 h-4" />
              <span className="text-xs">Configure</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
