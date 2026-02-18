import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Clock, Sliders, Settings2, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'My Runs', path: '/runs', icon: Clock },
  { name: 'Configurations', path: '/configs', icon: Sliders },
  { name: 'Preferences', path: '/preferences', icon: Settings2 },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="fixed inset-y-0 left-0 w-60 z-40 bg-white border-r border-efx-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-efx-gray-200">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-efx-red rounded flex items-center justify-center text-white font-bold text-sm">
            EFX
          </div>
          <span className="text-lg font-semibold text-efx-gray-900">BizMatch</span>
        </Link>
      </div>

      {/* New Run CTA */}
      <div className="p-4">
        <Link to="/runs/new">
          <Button className="w-full" variant="primary">
            + New Run
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.path === '/runs' && location.pathname.startsWith('/runs'));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-efx-red text-white'
                  : 'text-efx-gray-700 hover:bg-efx-gray-100'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-efx-gray-200">
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="w-8 h-8 bg-efx-gray-200 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-efx-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-efx-gray-900 truncate">Demo User</div>
            <div className="text-xs text-efx-gray-600 truncate">Acme Corp</div>
          </div>
        </div>
      </div>
    </div>
  );
}
