// frontend/src/components/Navbar.jsx
import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  ClipboardList, 
  LogOut,
  User,
  Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { username, role, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get human readable title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard/admin')) return 'Admin Operations Center';
    if (path.startsWith('/dashboard/employee')) return 'Employee Control Panel';
    if (path.startsWith('/upload')) return 'Document Ingestion';
    if (path.startsWith('/review')) return 'Human Review Queue';
    if (path.startsWith('/override')) return 'Category Override Engine';
    if (path.startsWith('/result')) return 'Classification Analysis';
    if (path.startsWith('/audit')) return 'System Audit Trail';
    return 'ConsensusDoc AI';
  };

  return (
    <header className="h-16 border-b border-gray-800/50 bg-[#090D16]/50 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between text-gray-200">
      
      {/* Clickable Brand Logo with Animations & Page Title */}
      <div className="flex items-center gap-4">
        <NavLink to="/dashboard" className="flex items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ 
              opacity: 1, 
              x: 0,
              y: [-1.2, 1.2, -1.2]
            }}
            transition={{ 
              opacity: { duration: 0.6, ease: "easeOut" },
              x: { duration: 0.6, ease: "easeOut" },
              y: { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
            }}
            whileHover={{ 
              scale: 1.03,
              filter: "drop-shadow(0 0 8px rgba(168, 85, 247, 0.3))"
            }}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl cursor-pointer bg-transparent transition-all duration-200"
            style={{ originX: 0 }}
          >
            <img src={logo} alt="Anaptyss Logo" className="h-5 w-auto object-contain" />
            <span className="text-sm font-bold tracking-[2px] font-sans text-white uppercase hidden sm:inline select-none">
              anaptyss
            </span>
          </motion.div>
        </NavLink>

        <div className="h-5 w-[1px] bg-gray-800/80 hidden sm:block"></div>

        <h2 className="text-xs font-semibold tracking-wider text-gray-400 font-sans uppercase hidden md:block">
          {getPageTitle()}
        </h2>
      </div>

      {/* Horizontal Nav - Contains requested routes: Dashboard, Upload, Review Queue, Logout */}
      <nav className="flex items-center gap-1 md:gap-4">
        <NavLink 
          to="/dashboard"
          className={({ isActive }) => 
            `px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
              isActive 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
            }`
          }
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Dashboard</span>
        </NavLink>
        
        <NavLink 
          to="/upload"
          className={({ isActive }) => 
            `px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
              isActive 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
            }`
          }
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Upload</span>
        </NavLink>

        <NavLink 
          to="/review"
          className={({ isActive }) => 
            `px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
              isActive 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
            }`
          }
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Review Queue</span>
        </NavLink>

        <div className="h-4 w-[1px] bg-gray-800 mx-1"></div>

        {/* Profile and Logout Quick Access */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-900/40 border border-gray-800/60 text-xs">
            <div className="w-4 h-4 rounded-full bg-indigo-500/25 border border-indigo-400/30 flex items-center justify-center">
              <User className="w-2.5 h-2.5 text-indigo-400" />
            </div>
            <span className="text-[11px] font-semibold text-gray-300 hidden md:inline">{username}</span>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all duration-200 flex items-center gap-1 text-xs font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

    </header>
  );
}

export default Navbar;
