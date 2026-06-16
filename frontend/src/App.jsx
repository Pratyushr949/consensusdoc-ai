import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Result from './pages/Result';
import Review from './pages/Review';
import Audit from './pages/Audit';

function App() {
  const [user, setUser] = useState(null); // { username: 'john_doe', role: 'Admin' | 'Employee' }
  const [currentPage, setCurrentPage] = useState('login'); // login, dashboard, upload, result, review, audit
  const [activeDocId, setActiveDocId] = useState(null);

  const navigate = (page, docId = null) => {
    if (docId) setActiveDocId(docId);
    setCurrentPage(page);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('login');
    setActiveDocId(null);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text flex flex-col">
      {user && (
        <header className="glass sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📄</span>
            <h1 className="text-xl font-bold tracking-tight gradient-text">ConsensusDoc AI</h1>
          </div>
          <nav className="flex items-center gap-6">
            <button 
              onClick={() => navigate('dashboard')}
              className={`hover:text-indigo-400 transition text-sm ${currentPage === 'dashboard' ? 'text-indigo-400 font-semibold' : 'text-gray-400'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => navigate('upload')}
              className={`hover:text-indigo-400 transition text-sm ${currentPage === 'upload' ? 'text-indigo-400 font-semibold' : 'text-gray-400'}`}
            >
              Upload PDF
            </button>
            <button 
              onClick={() => navigate('review')}
              className={`hover:text-indigo-400 transition text-sm ${currentPage === 'review' ? 'text-indigo-400 font-semibold' : 'text-gray-400'}`}
            >
              Review Queue
            </button>
            {user.role === 'Admin' && (
              <button 
                onClick={() => navigate('audit')}
                className={`hover:text-indigo-400 transition text-sm ${currentPage === 'audit' ? 'text-indigo-400 font-semibold' : 'text-gray-400'}`}
              >
                Audit Log
              </button>
            )}
          </nav>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user.username}</p>
              <p className="text-xs text-gray-400">{user.role}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-dark-border hover:bg-gray-800 transition text-gray-300"
            >
              Sign Out
            </button>
          </div>
        </header>
      )}

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col justify-start">
        {currentPage === 'login' && <Login onLogin={(u) => { setUser(u); setCurrentPage('dashboard'); }} />}
        {currentPage === 'dashboard' && <Dashboard user={user} navigate={navigate} />}
        {currentPage === 'upload' && <Upload user={user} navigate={navigate} />}
        {currentPage === 'result' && <Result user={user} docId={activeDocId} navigate={navigate} />}
        {currentPage === 'review' && <Review user={user} navigate={navigate} />}
        {currentPage === 'audit' && user?.role === 'Admin' && <Audit navigate={navigate} />}
      </main>
      
      <footer className="py-6 border-t border-dark-border text-center text-xs text-gray-600">
        &copy; {new Date().getFullYear()} ConsensusDoc AI. Enterprise Intelligent Document Classification.
      </footer>
    </div>
  );
}

export default App;
