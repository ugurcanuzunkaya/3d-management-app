import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Library, Box, Settings, Activity, Eye, EyeOff } from 'lucide-react';

const Navbar = () => {
  const [showPersonalInfo, setShowPersonalInfo] = useState(() => {
    const saved = localStorage.getItem('showPersonalInfo');
    return saved ? JSON.parse(saved) : false;
  });

  const [privacySettings, setPrivacySettings] = useState(() => {
    const saved = localStorage.getItem('privacySettings');
    return saved ? JSON.parse(saved) : {};
  });

  const togglePersonalInfo = () => {
    const newValue = !showPersonalInfo;
    setShowPersonalInfo(newValue);
    localStorage.setItem('showPersonalInfo', JSON.stringify(newValue));
    window.dispatchEvent(new Event('credentials-visibility-change'));
  };

  useEffect(() => {
    const handleUpdate = () => {
      const savedShow = localStorage.getItem('showPersonalInfo');
      setShowPersonalInfo(savedShow ? JSON.parse(savedShow) : false);
      const savedPrivacy = localStorage.getItem('privacySettings');
      setPrivacySettings(savedPrivacy ? JSON.parse(savedPrivacy) : {});
    };
    window.addEventListener('credentials-visibility-change', handleUpdate);
    return () => window.removeEventListener('credentials-visibility-change', handleUpdate);
  }, []);

  const isMasked = (key: string) => {
    return !showPersonalInfo && !!privacySettings[key];
  };

  return (
    <nav className="border-b bg-white dark:bg-zinc-950 sticky top-0 z-40 border-zinc-200 dark:border-zinc-800">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl text-zinc-950 dark:text-zinc-50">
          <Box className="w-6 h-6 text-primary" />
          <span>{isMasked('maskAppName') ? '•••••' : '3D Manager'}</span>
        </div>
        <div className="flex items-center gap-6 text-zinc-700 dark:text-zinc-300">
          <Link to="/" className="flex items-center gap-1 hover:text-primary transition-colors">
            <LayoutDashboard className="w-4 h-4" />
            <span>{isMasked('maskNavDashboard') ? '•••••' : 'Dashboard'}</span>
          </Link>
          <Link to="/jobs" className="flex items-center gap-1 hover:text-primary transition-colors">
            <ClipboardList className="w-4 h-4" />
            <span>{isMasked('maskNavJobs') ? '•••••' : 'Jobs'}</span>
          </Link>
          <Link to="/stock" className="flex items-center gap-1 hover:text-primary transition-colors">
            <Box className="w-4 h-4" />
            <span>{isMasked('maskNavStock') ? '•••••' : 'Stock'}</span>
          </Link>
          <Link to="/models" className="flex items-center gap-1 hover:text-primary transition-colors">
            <Library className="w-4 h-4" />
            <span>{isMasked('maskNavModels') ? '•••••' : 'Models'}</span>
          </Link>
          <Link to="/printer" className="flex items-center gap-1 hover:text-primary transition-colors">
            <Activity className="w-4 h-4" />
            <span>{isMasked('maskNavPrinter') ? '•••••' : 'Printer'}</span>
          </Link>
          <Link to="/settings" className="flex items-center gap-1 hover:text-primary transition-colors">
            <Settings className="w-4 h-4" />
            <span>{isMasked('maskNavSettings') ? '•••••' : 'Settings'}</span>
          </Link>
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
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
