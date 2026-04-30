import { Link } from 'react-router-dom';
import { LayoutDashboard, Clock, Library, Box, Settings } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl">
          <Box className="w-6 h-6 text-primary" />
          <span>3D Manager</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-1 hover:text-primary transition-colors">
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <Link to="/pending" className="flex items-center gap-1 hover:text-primary transition-colors">
            <Clock className="w-4 h-4" />
            <span>Pending</span>
          </Link>
          <Link to="/stock" className="flex items-center gap-1 hover:text-primary transition-colors">
            <Box className="w-4 h-4" />
            <span>Stock</span>
          </Link>
          <Link to="/models" className="flex items-center gap-1 hover:text-primary transition-colors">
            <Library className="w-4 h-4" />
            <span>Models</span>
          </Link>
          <Link to="/settings" className="flex items-center gap-1 hover:text-primary transition-colors">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
