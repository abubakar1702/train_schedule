import { NavLink, Route, Routes } from 'react-router-dom'
import { FaTrain, FaSubway } from 'react-icons/fa'
import SearchPage from './pages/SearchPage'
import TrainTablePage from './pages/TrainTablePage'
import MetroPage from './pages/MetroPage'

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),rgba(255,255,255,0))] font-sans text-slate-900 selection:bg-blue-200 selection:text-blue-900">
      <nav className="glass-panel sticky top-0 z-40 border-b border-slate-200/50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
               <FaTrain className="text-lg" />
             </div>
             <p className="text-xl font-bold tracking-tight text-slate-900">Rail<span className="text-blue-600">BD</span></p>
          </div>
          
          <div className="flex gap-2 rounded-2xl bg-slate-100/80 p-1 shadow-inner backdrop-blur-md border border-slate-200/50">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${isActive ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`
              }
            >
              Search
            </NavLink>
            <NavLink
              to="/trains"
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${isActive ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`
              }
            >
              Intercity
            </NavLink>
            <NavLink
              to="/metro"
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${isActive ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200/50' : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50/50'}`
              }
            >
              <FaSubway /> Metro Rail
            </NavLink>
          </div>
        </div>
      </nav>

      <main className="relative grow">
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/trains" element={<TrainTablePage />} />
          <Route path="/metro" element={<MetroPage />} />
        </Routes>
      </main>
      
      <footer className="border-t border-slate-200 bg-white/50 py-8 backdrop-blur text-center mt-auto">
         <p className="text-sm font-medium text-slate-500">© 2026 RailBD Schedule Application.</p>
      </footer>
    </div>
  )
}

export default App
