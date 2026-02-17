import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';

export default function Topbar() {
  return (
    <div className="h-16 bg-white border-b border-efx-gray-200 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-efx-gray-600">Org:</span>
          <span className="text-sm font-semibold text-efx-gray-900">Acme Corp</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Link
          to="/audit-log"
          className="p-2 text-efx-gray-600 hover:text-efx-gray-900 hover:bg-efx-gray-100 rounded-md transition-colors"
          title="View audit log"
        >
          <Bell className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
