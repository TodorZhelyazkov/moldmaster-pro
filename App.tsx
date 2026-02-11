
import React, { useState, useMemo } from 'react';
import { InjectionMold, ToolStatus, RepairLog, AppView, SparePart, SettingsTab, UserRole, AuthorizedUser } from './types';
import { INITIAL_MOLDS, INITIAL_PARTS } from './constants';
import ToolCard from './components/ToolCard';
import DashboardStats from './components/DashboardStats';
import { analyzeMoldCondition } from './services/geminiService';

const App: React.FC = () => {
  // Auth & Access state - Permanent Users as requested
  const [users, setUsers] = useState<AuthorizedUser[]>([
    { id: 'u1', email: 'petar.simeonov@gotmar.com', role: UserRole.ADMIN, addedAt: '2024-05-20' },
    { id: 'u2', email: 'delyan.nedev@gotmar.com', role: UserRole.ADMIN, addedAt: '2024-05-20' },
    { id: 'u3', email: 'todor.zhelyazkov@gotmar.com', role: UserRole.ADMIN, addedAt: '2024-03-20' },
    { id: 'u4', email: 'admin@moldmaster.pro', role: UserRole.ADMIN, addedAt: '2023-10-01' }
  ]);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthorizedUser | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // App Data State
  const [molds, setMolds] = useState<InjectionMold[]>(INITIAL_MOLDS);
  const [parts, setParts] = useState<SparePart[]>(INITIAL_PARTS);
  
  // UI State
  const [activeView, setActiveView] = useState<AppView>(AppView.DASHBOARD);
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>(SettingsTab.GENERAL);
  const [selectedMoldId, setSelectedMoldId] = useState<string | null>(null);
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // User management state
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.USER);
  const [isAddingUser, setIsAddingUser] = useState(false);
  
  // Modals
  const [showAddMoldModal, setShowAddMoldModal] = useState(false);
  const [showLogRepairModal, setShowLogRepairModal] = useState(false);
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  
  // Forms
  const [newMold, setNewMold] = useState({ name: '', sn: '', cavities: 4, shots: 0, manufacturer: 'Gotmar Internal' });
  const [newRepair, setNewRepair] = useState({ description: '', technician: '', duration: 1, parts: '' });
  const [newPartData, setNewPartData] = useState({ name: '', sku: '', quantity: 0, minQuantity: 0, location: '' });

  const selectedMold = useMemo(() => molds.find(m => m.id === selectedMoldId), [molds, selectedMoldId]);
  const allRepairs = useMemo(() => molds.flatMap(m => m.repairHistory).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [molds]);
  
  const filteredMolds = useMemo(() => {
    return molds.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [molds, searchQuery]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const foundUser = users.find(u => u.email.toLowerCase() === loginEmail.toLowerCase());
    
    if (!foundUser) {
      setLoginError('Нямате оторизиран достъп с този имейл.');
      return;
    }
    
    // Fixed password as requested: Gotmar123
    if (loginPassword !== 'Gotmar123') {
      setLoginError('Грешна парола.');
      return;
    }
    
    setCurrentUser(foundUser);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginEmail('');
    setLoginPassword('');
    setLoginError(null);
    setActiveView(AppView.DASHBOARD);
  };

  const handleRunAI = async () => {
    if (!selectedMold) return;
    setIsAIAnalyzing(true);
    setAiAnalysis(null);
    try {
      const result = await analyzeMoldCondition(selectedMold);
      setAiAnalysis(result);
    } catch (err) {
      setAiAnalysis("Грешка при анализа.");
    } finally {
      setIsAIAnalyzing(false);
    }
  };

  const updateMoldStatus = (id: string, newStatus: ToolStatus) => {
    setMolds(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
  };

  const handleAddMold = () => {
    const mold: InjectionMold = {
      id: Math.random().toString(36).substr(2, 9),
      name: newMold.name || 'Нова Матрица',
      serialNumber: newMold.sn || `SN-${Date.now()}`,
      manufacturer: newMold.manufacturer,
      totalShots: Number(newMold.shots),
      cavities: Number(newMold.cavities),
      status: ToolStatus.ACTIVE,
      repairHistory: []
    };
    setMolds(prev => [...prev, mold]);
    setShowAddMoldModal(false);
    setNewMold({ name: '', sn: '', cavities: 4, shots: 0, manufacturer: 'Gotmar Internal' });
  };

  const handleLogRepair = () => {
    if (!selectedMoldId) return;
    const repair: RepairLog = {
      id: Math.random().toString(36).substr(2, 9),
      moldId: selectedMoldId,
      moldName: selectedMold?.name || '',
      date: new Date().toISOString().split('T')[0],
      technician: newRepair.technician || currentUser?.email || 'Служител',
      description: newRepair.description,
      partsReplaced: newRepair.parts.split(',').map(p => p.trim()).filter(p => p !== ''),
      durationHours: Number(newRepair.duration)
    };

    setMolds(prev => prev.map(m => 
      m.id === selectedMoldId 
        ? { ...m, repairHistory: [repair, ...m.repairHistory], status: ToolStatus.ACTIVE } 
        : m
    ));
    setShowLogRepairModal(false);
    setNewRepair({ description: '', technician: '', duration: 1, parts: '' });
  };

  const handleAddPart = () => {
    const part: SparePart = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPartData.name || 'Нова част',
      sku: newPartData.sku || `SKU-${Date.now()}`,
      quantity: Number(newPartData.quantity),
      minQuantity: Number(newPartData.minQuantity),
      location: newPartData.location || 'Склад'
    };
    setParts(prev => [...prev, part]);
    setShowAddPartModal(false);
    setNewPartData({ name: '', sku: '', quantity: 0, minQuantity: 0, location: '' });
  };

  const handleOrderPart = (id: string) => {
    setParts(prev => prev.map(p => p.id === id ? { ...p, quantity: p.quantity + 10 } : p));
    alert('Симулирана поръчка: Добавени са 10 единици към наличността.');
  };

  const handleAddUser = () => {
    if (!newUserEmail || !newUserEmail.includes('@')) {
      alert('Моля въведете валиден имейл адрес.');
      return;
    }
    setIsAddingUser(true);
    setTimeout(() => {
      const newUser: AuthorizedUser = {
        id: Math.random().toString(36).substr(2, 9),
        email: newUserEmail,
        role: newUserRole,
        addedAt: new Date().toISOString().split('T')[0]
      };
      setUsers(prev => [...prev, newUser]);
      setNewUserEmail('');
      setIsAddingUser(false);
    }, 600);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Сигурни ли сте, че искате да премахнете този потребител?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const NavItem = ({ view, icon }: { view: AppView, icon: string }) => (
    <button
      onClick={() => { setActiveView(view); setSelectedMoldId(null); }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeView === view ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-semibold text-sm">{view}</span>
    </button>
  );

  // Login Screen View
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-3xl"></div>
        <div className="w-full max-w-[440px] z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-3xl shadow-2xl shadow-blue-200 mb-6 text-white text-3xl font-black italic">M</div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">MoldMaster<span className="text-blue-600">Pro</span></h1>
            <p className="text-slate-400 mt-2 font-medium">Система за управление на производството</p>
          </div>
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 p-10 border border-white/50 backdrop-blur-sm">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Служебен имейл</label>
                <input 
                  type="email" 
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
                  placeholder="name@gotmar.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Парола</label>
                <input 
                  type="password" 
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
              {loginError && (
                <div className="bg-red-50 text-red-600 text-xs font-bold py-3 px-4 rounded-xl border border-red-100 flex items-center space-x-2 animate-in slide-in-from-top-1">
                  <span>⚠️</span>
                  <span>{loginError}</span>
                </div>
              )}
              <button 
                type="submit"
                className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 hover:scale-[1.02] active:scale-[0.98] mt-4"
              >
                Вход в системата
              </button>
            </form>
            <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                    Достъп за оторизирани служители на Gotmar <br/> Парола: Gotmar123
                </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-40">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white italic shadow-lg shadow-blue-100">M</div>
            <h1 className="text-lg font-black text-slate-800 tracking-tight">MoldMaster<span className="text-blue-600">Pro</span></h1>
          </div>
          <nav className="space-y-1">
            <NavItem view={AppView.DASHBOARD} icon="📊" />
            <NavItem view={AppView.INVENTORY} icon="📦" />
            <NavItem view={AppView.REPAIRS} icon="🔧" />
            <NavItem view={AppView.PARTS} icon="🔩" />
            <NavItem view={AppView.SETTINGS} icon="⚙️" />
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-slate-100">
          <div className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Потребител</p>
             <p className="text-xs font-bold text-slate-700 truncate">{currentUser?.email}</p>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center space-x-3 text-slate-500 hover:text-red-600 px-4 py-2 rounded-xl hover:bg-red-50 transition-all">
            <span>🚪</span>
            <span className="text-sm font-semibold">Изход</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-800">{activeView}</h2>
            <p className="text-slate-400 text-sm">Управление на производството и поддръжката</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800">{currentUser?.email}</p>
              <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">{currentUser?.role}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200 border border-white shadow-sm overflow-hidden ring-2 ring-blue-100">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.email}`} alt="User" />
            </div>
          </div>
        </header>

        {activeView === AppView.DASHBOARD && (
          <div className="animate-in fade-in duration-500">
            <DashboardStats molds={molds} />
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Бърз преглед</h3>
                  <button onClick={() => setActiveView(AppView.INVENTORY)} className="text-blue-600 text-sm font-bold hover:underline">Виж всички →</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {molds.slice(0, 4).map(mold => (
                    <ToolCard key={mold.id} mold={mold} onClick={setSelectedMoldId} />
                  ))}
                </div>
              </div>
              <div className="w-full lg:w-96">
                {selectedMold ? (
                  <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden sticky top-8">
                    <div className="bg-slate-50 p-6 border-b border-slate-100">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-slate-800">{selectedMold.name}</h3>
                        <button onClick={() => setSelectedMoldId(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                      </div>
                      <p className="text-xs font-mono text-slate-400 mb-4">{selectedMold.serialNumber}</p>
                      <div className="flex gap-2">
                        <button onClick={() => { setShowLogRepairModal(true); updateMoldStatus(selectedMold.id, ToolStatus.IN_REPAIR); }} className="flex-1 bg-red-600 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-100">В Ремонт</button>
                        <button onClick={() => updateMoldStatus(selectedMold.id, ToolStatus.ACTIVE)} className="flex-1 bg-green-600 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-100">Активна</button>
                      </div>
                    </div>
                    <div className="p-6 space-y-6">
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 text-white relative overflow-hidden">
                        {isAIAnalyzing && <div className="absolute inset-0 bg-blue-600/50 backdrop-blur-sm flex items-center justify-center z-10 font-bold text-xs animate-pulse">Анализиране...</div>}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">AI Инженер-Асистент</span>
                          <button onClick={handleRunAI} disabled={isAIAnalyzing} className="bg-white/20 hover:bg-white/30 text-[10px] px-2 py-1 rounded-lg transition-colors">Обнови</button>
                        </div>
                        {aiAnalysis ? <p className="text-xs leading-relaxed italic opacity-90">{aiAnalysis}</p> : <p className="text-xs opacity-70">Стартирайте анализ за прогноза на състоянието въз основа на удари и история.</p>}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-4">Последен ремонт</h4>
                        {selectedMold.repairHistory[0] ? (
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <p className="text-xs font-bold text-slate-700">{selectedMold.repairHistory[0].date}</p>
                            <p className="text-xs text-slate-500 mt-1">{selectedMold.repairHistory[0].description}</p>
                          </div>
                        ) : <p className="text-xs text-slate-400 italic">Няма данни за ремонти.</p>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 text-sm text-center p-8">Изберете матрица за детайлен технически анализ и управление.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === AppView.INVENTORY && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="relative w-72">
                <input 
                  type="text" 
                  placeholder="Търси матрица (име или SN)..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                />
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
              </div>
              <button onClick={() => setShowAddMoldModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all">+ Добави нова</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                    <th className="px-6 py-4">Матрица</th>
                    <th className="px-6 py-4">Статус</th>
                    <th className="px-6 py-4">Общо удари</th>
                    <th className="px-6 py-4">Гнезда</th>
                    <th className="px-6 py-4">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMolds.map(mold => (
                    <tr key={mold.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 text-sm">{mold.name}</p>
                        <p className="text-xs text-slate-400">{mold.serialNumber}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${mold.status === ToolStatus.ACTIVE ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>{mold.status}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-600">{mold.totalShots.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{mold.cavities}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => { setSelectedMoldId(mold.id); setActiveView(AppView.DASHBOARD); }} className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase tracking-wider">Детайли</button>
                      </td>
                    </tr>
                  ))}
                  {filteredMolds.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-slate-400 italic">Няма намерени матрици по зададените критерии.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === AppView.REPAIRS && (
          <div className="space-y-4 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wider text-sm">История на поддръжката</h3>
            </div>
            {allRepairs.map(repair => (
              <div key={repair.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start space-x-6 hover:border-blue-200 transition-colors">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-2xl shadow-inner">🛠️</div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-slate-800">{repair.moldName}</h4>
                    <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">{repair.date}</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{repair.description}</p>
                  <div className="flex items-center space-x-4 text-xs font-medium">
                    <span className="flex items-center space-x-1 text-slate-400">👤 <span>{repair.technician}</span></span>
                    <span className="flex items-center space-x-1 text-slate-400">⏱️ <span>{repair.durationHours}ч</span></span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 max-w-[200px] justify-end">
                  {repair.partsReplaced.map((p, i) => <span key={i} className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[10px] font-bold border border-blue-100">{p}</span>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeView === AppView.PARTS && (
          <div className="animate-in slide-in-from-bottom-4 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Управление на наличностите</h3>
              <button onClick={() => setShowAddPartModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all">+ Добави част</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {parts.map(part => (
                <div key={part.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-slate-800">{part.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono tracking-tighter">{part.sku}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-black ${part.quantity <= part.minQuantity ? 'bg-red-100 text-red-600 animate-pulse border border-red-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>{part.quantity} бр.</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-50">
                    <span className="text-slate-400">Локация: <span className="text-slate-700 font-bold">{part.location}</span></span>
                    <button onClick={() => handleOrderPart(part.id)} className="text-blue-600 font-black hover:underline px-3 py-1 bg-blue-50 rounded-lg">Поръчай →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === AppView.SETTINGS && (
          <div className="max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in">
            <div className="flex border-b border-slate-100">
              <button onClick={() => setActiveSettingsTab(SettingsTab.GENERAL)} className={`flex-1 py-5 text-sm font-bold transition-all ${activeSettingsTab === SettingsTab.GENERAL ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>📊 {SettingsTab.GENERAL}</button>
              <button onClick={() => setActiveSettingsTab(SettingsTab.ACCESS)} className={`flex-1 py-5 text-sm font-bold transition-all ${activeSettingsTab === SettingsTab.ACCESS ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>🔐 {SettingsTab.ACCESS}</button>
            </div>
            <div className="p-8">
              {activeSettingsTab === SettingsTab.GENERAL ? (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Общи настройки</h3>
                  {[
                    { title: "Автоматично архивиране", desc: "Ежедневно архивиране на данните в облака", active: true },
                    { title: "Известия при ниски наличности", desc: "Получавай известия за резервни части под минимума", active: true },
                    { title: "Интеграция с ERP", desc: "Синхронизиране на ударите директно от машините", active: false }
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-700 text-sm">{s.title}</p>
                        <p className="text-xs text-slate-400">{s.desc}</p>
                      </div>
                      <div className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${s.active ? 'bg-blue-600' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${s.active ? 'right-1' : 'left-1'}`}></div></div>
                    </div>
                  ))}
                  <button className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all">Запази промените</button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-6">
                      <h3 className="text-lg font-bold text-slate-800">Добавяне на достъп</h3>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Имейл адрес</label>
                          <input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="user@gotmar.com" className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-blue-500 transition-all" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Роля</label>
                          <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as UserRole)} className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-blue-500 transition-all">
                            <option value={UserRole.USER}>{UserRole.USER}</option>
                            <option value={UserRole.ADMIN}>{UserRole.ADMIN}</option>
                          </select>
                        </div>
                        <button onClick={handleAddUser} disabled={isAddingUser} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-200 disabled:opacity-50 transition-all">
                          {isAddingUser ? 'Добавяне...' : 'Покани Потребител'}
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Списък с оторизирани лица</h3>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {users.map(user => (
                          <div key={user.id} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-slate-800">{user.email}</p>
                              <div className="flex items-center space-x-2 mt-0.5">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase ${user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{user.role}</span>
                              </div>
                            </div>
                            <button onClick={() => handleDeleteUser(user.id)} className="text-slate-300 hover:text-red-500 transition-colors">🗑️</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Add Mold Modal */}
      {showAddMoldModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Нова Матрица</h2>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Наименование</label>
                <input type="text" value={newMold.name} onChange={(e) => setNewMold({...newMold, name: e.target.value})} placeholder="Напр. Капак Преден А" className="w-full p-3 bg-slate-50 border-0 rounded-2xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">SN</label>
                  <input type="text" value={newMold.sn} onChange={(e) => setNewMold({...newMold, sn: e.target.value})} placeholder="MOLD-XXX" className="w-full p-3 bg-slate-50 border-0 rounded-2xl text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Гнезда</label>
                  <input type="number" value={newMold.cavities} onChange={(e) => setNewMold({...newMold, cavities: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border-0 rounded-2xl text-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Производител</label>
                <input type="text" value={newMold.manufacturer} onChange={(e) => setNewMold({...newMold, manufacturer: e.target.value})} className="w-full p-3 bg-slate-50 border-0 rounded-2xl text-sm" />
              </div>
            </div>
            <div className="mt-10 flex gap-4">
              <button onClick={() => setShowAddMoldModal(false)} className="flex-1 py-4 text-slate-500 font-bold">Отказ</button>
              <button onClick={handleAddMold} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-200">Запази</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Part Modal */}
      {showAddPartModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Нова Резервна Част</h2>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Наименование</label>
                <input type="text" value={newPartData.name} onChange={(e) => setNewPartData({...newPartData, name: e.target.value})} placeholder="Напр. Изхвъргач 10мм" className="w-full p-3 bg-slate-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">SKU / Каталожен номер</label>
                <input type="text" value={newPartData.sku} onChange={(e) => setNewPartData({...newPartData, sku: e.target.value})} placeholder="SKU-XXX-YYY" className="w-full p-3 bg-slate-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Текущо количество</label>
                  <input type="number" value={newPartData.quantity} onChange={(e) => setNewPartData({...newPartData, quantity: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border-0 rounded-2xl text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Мин. количество</label>
                  <input type="number" value={newPartData.minQuantity} onChange={(e) => setNewPartData({...newPartData, minQuantity: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border-0 rounded-2xl text-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Локация в склада</label>
                <input type="text" value={newPartData.location} onChange={(e) => setNewPartData({...newPartData, location: e.target.value})} placeholder="Шкаф B, Полица 3" className="w-full p-3 bg-slate-50 border-0 rounded-2xl text-sm" />
              </div>
            </div>
            <div className="mt-10 flex gap-4">
              <button onClick={() => setShowAddPartModal(false)} className="flex-1 py-4 text-slate-500 font-bold hover:text-slate-700 transition-colors">Отказ</button>
              <button onClick={handleAddPart} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all">Добави в инвентара</button>
            </div>
          </div>
        </div>
      )}

      {/* Log Repair Modal */}
      {showLogRepairModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-900">Регистриране на ремонт</h2>
              <span className="bg-red-50 text-red-600 px-3 py-1 rounded-xl text-xs font-bold border border-red-100">{selectedMold?.name}</span>
            </div>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Описание на ремонта</label>
                <textarea rows={3} value={newRepair.description} onChange={(e) => setNewRepair({...newRepair, description: e.target.value})} placeholder="Опишете извършените дейности..." className="w-full p-4 bg-slate-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-red-500 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Използвани части (разделни със запетая)</label>
                <input type="text" value={newRepair.parts} onChange={(e) => setNewRepair({...newRepair, parts: e.target.value})} placeholder="Изхвъргач 12мм, Пружина..." className="w-full p-3 bg-slate-50 border-0 rounded-2xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Продължителност (ч)</label>
                  <input type="number" value={newRepair.duration} onChange={(e) => setNewRepair({...newRepair, duration: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border-0 rounded-2xl text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Техник</label>
                  <input type="text" value={newRepair.technician} onChange={(e) => setNewRepair({...newRepair, technician: e.target.value})} placeholder={currentUser?.email || 'Техник'} className="w-full p-3 bg-slate-50 border-0 rounded-2xl text-sm" />
                </div>
              </div>
            </div>
            <div className="mt-10 flex gap-4">
              <button onClick={() => setShowLogRepairModal(false)} className="flex-1 py-4 text-slate-500 font-bold">Отказ</button>
              <button onClick={handleLogRepair} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-red-200 hover:bg-red-700 transition-all">Приключи Ремонт</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
