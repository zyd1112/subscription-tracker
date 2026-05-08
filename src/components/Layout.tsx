import { Outlet, NavLink } from 'react-router-dom';
import { Home, List, PieChart, Settings } from 'lucide-react';
import clsx from 'clsx';

export default function Layout() {
  const navItems = [
    { to: '/', icon: Home, label: '总览' },
    { to: '/subscriptions', icon: List, label: '订阅' },
    { to: '/insights', icon: PieChart, label: '统计' },
    { to: '/settings', icon: Settings, label: '设置' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      
      <nav className="absolute bottom-0 w-full bg-white border-t border-gray-200 z-50 safe-area-pb">
        <div className="max-w-3xl mx-auto flex justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  "flex flex-col items-center py-2 px-4 text-xs font-medium transition-colors",
                  isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
                )
              }
            >
              <item.icon className="w-6 h-6 mb-1" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
