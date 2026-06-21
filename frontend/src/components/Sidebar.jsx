// frontend/src/components/Sidebar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  ClipboardList, 
  ShieldAlert, 
  LogOut, 
  FileText,
  Cpu,
  Layers
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

function Sidebar() {
  const navigate = useNavigate();
  const { username, role, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/upload', label: 'Upload PDF', icon: UploadCloud },
    { to: '/review', label: 'Review Queue', icon: ClipboardList }
  ];

  if (role === 'Admin') {
    navItems.push({ to: '/audit', label: 'System Audit', icon: ShieldAlert });
  }

  return (
    <aside className="w-64 bg-[#090D16]/90 border-r border-gray-800/80 backdrop-blur-xl flex flex-col justify-between h-screen sticky top-0 z-40 text-gray-200">
      
      {/* Top Section - Logo & Branding */}
      <div>
        <div className="p-6 border-b border-gray-800/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-blue-500 to-cyan-400 p-[1.5px]">
              <div className="w-full h-full bg-[#090D16] rounded-[10px] flex items-center justify-center">
                <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-300">
                ConsensusDoc AI
              </h1>
              <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-500/80 block -mt-0.5">
                Multi-Agent Hub
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          <div className="px-3 mb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">
            Navigation
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-600/25 via-blue-600/15 to-cyan-500/10 border-l-2 border-cyan-400 text-cyan-300 font-semibold shadow-md shadow-indigo-900/10' 
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/40'
                }`
              }
            >
              {({ isActive }) => {
                const IconComponent = item.icon;
                return (
                  <>
                    <IconComponent className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-cyan-400' : 'text-gray-400 group-hover:text-cyan-400'}`} />
                    <span>{item.label}</span>
                  </>
                );
              }}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Section - System Status & User Info */}
      <div className="p-4 border-t border-gray-800/40 bg-gray-950/20">
        
        {/* Ray Cluster status pill */}
        <div className="mb-4 p-3 rounded-xl bg-indigo-950/20 border border-indigo-900/30 flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping"></div>
          <div className="text-[11px] leading-tight">
            <span className="text-gray-400 block font-semibold">Ray Cluster</span>
            <span className="text-cyan-400 font-mono">5 Agents Active</span>
          </div>
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-gray-900/45 border border-gray-800/40">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{username}</p>
            <p className="text-[10px] text-gray-400 font-mono">{role}</p>
          </div>
          <button 
            onClick={handleLogout}
            title="Log Out"
            className="p-2 rounded-lg bg-gray-850 hover:bg-red-950/40 hover:text-red-400 text-gray-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </aside>
  );
}

export default Sidebar;
