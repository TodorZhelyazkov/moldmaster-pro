
import React, { useState, useMemo } from 'react';
import { InjectionMold, ToolStatus, RepairLog, AppView, SparePart, SettingsTab, UserRole, AuthorizedUser } from './types';
import { INITIAL_MOLDS, INITIAL_PARTS } from './constants';
import ToolCard from './components/ToolCard';
import DashboardStats from './components/DashboardStats';
import { analyzeMoldCondition } from './services/geminiService';

const App: React.FC = () => {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthorizedUser | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // App State
  const [activeView, setActiveView] = useState<AppView>(AppView.DASHBOARD);
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>(SettingsTab.GENERAL);
  const [molds, setMolds] = useState<InjectionMold[]>(INITIAL_MOLDS);
  const [parts, setParts] = useState<SparePart[]>(INITIAL_PARTS);
  const [selectedMoldId, setSelectedMoldId] = useState<string | null>(null);
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Auth & Access state
  const [users, setUsers] = useState<AuthorizedUser[]>([
    { id: 'u1', email: 'admin@moldmaster.pro', role: UserRole.ADMIN, addedAt: '2023-10-01' },
    { id: 'u2', email: 'technician@moldmaster.pro', role: UserRole.USER, addedAt: '2023-11-15' },
    { id: 'u3', email: 'gotmar@example.com', role: UserRole.ADMIN, addedAt: '2024-01-01' },
    { id: 'u4', email: 'todor.zhelyazkov@gotmar.com', role: UserRole.ADMIN, addedAt: '2024-03-20' }
  ]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.USER);
  const [isAddingUser, setIsAddingUser] = useState(false);

  const selectedMold = useMemo(() => molds.find(m => m.id === selectedMoldId), [molds, selectedMoldId]);
  const allRepairs = useMemo(() => molds.flatMap(m => m.repairHistory).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [molds]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const foundUser = users.find(u => u.email.toLowerCase() === loginEmail.toLowerCase());
    
    if (!foundUser) {
      setLoginError('Неоторизиран имейл адрес.');
      return;
    }

    if (loginPassword !== 'Gotmar123') {
      setLoginError('Невалидна парола.');
      return;
    }

    setCurrentUser(foundUser);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginEmail('');
    setLoginPassword('');
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

  // If not logged in, show login screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Accents */}
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
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Имейл адрес</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">📧</span>
                  <input 
                    type="email" 
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
                    placeholder="name@company.pro"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Парола</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔒</span>
                  <input 
                    type="password" 
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {loginError && (
                <div className="bg-red-50 text-red-600 text-xs font-bold py-3 px-4 rounded-xl border border-red-100 flex items-center space-x-2 animate-in fade-in slide-in-from-top-1">
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
          </div>

          <div className="mt-8 text-center">
            <p className="text-slate-400 text-xs">Забравена парола? Свържете се с Вашия администратор.</p>
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
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 text-slate-500 hover:text-red-600 transition-colors px-4 py-2 rounded-xl hover:bg-red-50"
          >
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
              <p className="text-sm font-bold text-slate-800">{currentUser.email}</p>
              <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">{currentUser.role}</p>
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-600 relative">
              <span>🔔</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-slate-200 border border-white shadow-sm overflow-hidden ring-2 ring-blue-100">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email}`} alt="User" />
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
                        <button onClick={() => updateMoldStatus(selectedMold.id, ToolStatus.IN_REPAIR)} className="flex-1 bg-red-600 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-100">В Ремонт</button>
                        <button onClick={() => updateMoldStatus(selectedMold.id, ToolStatus.ACTIVE)} className="flex-1 bg-green-600 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-100">Активна</button>
                      </div>
                    </div>
                    <div className="p-6 space-y-6">
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 text-white">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">AI Анализ</span>
                          <button onClick={handleRunAI} disabled={isAIAnalyzing} className="bg-white/20 hover:bg-white/30 text-[10px] px-2 py-1 rounded-lg backdrop-blur-md transition-colors">{isAIAnalyzing ? 'Мисли...' : 'Обнови'}</button>
                        </div>
                        {aiAnalysis ? <p className="text-xs leading-relaxed italic opacity-90">{aiAnalysis}</p> : <p className="text-xs opacity-70">Стартирайте анализ за прогноза на състоянието.</p>}
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
                  <div className="h-64 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 text-sm text-center p-8">Изберете матрица за подробен анализ.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === AppView.INVENTORY && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="relative w-72">
                <input type="text" placeholder="Търси матрица..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
              </div>
              <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">+ Добави</button>
            </div>
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
                {molds.map(mold => (
                  <tr key={mold.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 text-sm">{mold.name}</p>
                      <p className="text-xs text-slate-400">{mold.serialNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${mold.status === ToolStatus.ACTIVE ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{mold.status}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">{mold.totalShots.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{mold.cavities}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => { setSelectedMoldId(mold.id); setActiveView(AppView.DASHBOARD); }} className="text-slate-400 hover:text-blue-600 font-bold text-xs uppercase tracking-wider">Детайли</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeView === AppView.REPAIRS && (
          <div className="space-y-4">
            {allRepairs.map(repair => (
              <div key={repair.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start space-x-6 hover:border-blue-200 transition-colors">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-2xl">🛠️</div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-slate-800">{repair.moldName}</h4>
                    <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">{repair.date}</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{repair.description}</p>
                  <div className="flex items-center space-x-4 text-xs">
                    <span className="flex items-center space-x-1 text-slate-400"><span>👤</span> <span>{repair.technician}</span></span>
                    <span className="flex items-center space-x-1 text-slate-400"><span>⏱️</span> <span>{repair.durationHours}ч</span></span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 max-w-[200px] justify-end">
                  {repair.partsReplaced.map((p, i) => <span key={i} className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[10px] font-bold">{p}</span>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeView === AppView.PARTS && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {parts.map(part => (
              <div key={part.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-slate-800">{part.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">{part.sku}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${part.quantity <= part.minQuantity ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>{part.quantity} бр.</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-50">
                  <span className="text-slate-400">Локация: <span className="text-slate-700 font-bold">{part.location}</span></span>
                  <button className="text-blue-600 font-bold hover:underline">Поръчай →</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeView === AppView.SETTINGS && (
          <div className="max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            {/* Settings Tab Bar */}
            <div className="flex border-b border-slate-100">
              <button 
                onClick={() => setActiveSettingsTab(SettingsTab.GENERAL)}
                className={`flex-1 py-5 text-sm font-bold transition-all ${activeSettingsTab === SettingsTab.GENERAL ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                📊 {SettingsTab.GENERAL}
              </button>
              <button 
                onClick={() => setActiveSettingsTab(SettingsTab.ACCESS)}
                className={`flex-1 py-5 text-sm font-bold transition-all ${activeSettingsTab === SettingsTab.ACCESS ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                🔐 {SettingsTab.ACCESS}
              </button>
            </div>

            <div className="p-8">
              {activeSettingsTab === SettingsTab.GENERAL ? (
                <div className="space-y-6 animate-in slide-in-from-left-2 duration-300">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Общи настройки</h3>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div>
                      <p className="font-bold text-slate-700 text-sm">Автоматично архивиране</p>
                      <p className="text-xs text-slate-400">Ежедневно архивиране на данните в облака</p>
                    </div>
                    <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div>
                      <p className="font-bold text-slate-700 text-sm">Известия при ниски наличности</p>
                      <p className="text-xs text-slate-400">Получавай известия за резервни части под минимума</p>
                    </div>
                    <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                  </div>
                  <button className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">Запази настройките</button>
                </div>
              ) : (
                <div className="space-y-8 animate-in slide-in-from-right-2 duration-300">
                  <div className="flex flex-col md:flex-row md:items-start gap-8">
                    {/* Add User Section */}
                    <div className="flex-1 space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">Добавяне на достъп</h3>
                        <p className="text-xs text-slate-400 italic">Поканете колеги чрез техния имейл адрес и задайте роля.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Имейл адрес</label>
                          <input 
                            type="email" 
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            placeholder="user@moldmaster.pro" 
                            className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Роля в системата</label>
                          <select 
                            value={newUserRole}
                            onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                            className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
                          >
                            <option value={UserRole.USER}>{UserRole.USER} (Преглед и редакция)</option>
                            <option value={UserRole.ADMIN}>{UserRole.ADMIN} (Пълен достъп)</option>
                          </select>
                        </div>
                        <button 
                          onClick={handleAddUser}
                          disabled={isAddingUser}
                          className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50"
                        >
                          {isAddingUser ? 'Добавяне...' : 'Покани Потребител'}
                        </button>
                      </div>
                    </div>

                    {/* User List Section */}
                    <div className="flex-1 space-y-4">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Списък с достъпи</h3>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {users.map(user => (
                          <div key={user.id} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-center justify-between group">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">👤</div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">{user.email}</p>
                                <div className="flex items-center space-x-2 mt-0.5">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase ${user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {user.role}
                                  </span>
                                  <span className="text-[9px] text-slate-400 uppercase">Добавен: {user.addedAt}</span>
                                </div>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-slate-300 hover:text-red-500 transition-colors p-2"
                              title="Премахни достъп"
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center justify-center space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span>Системата е защитена чрез сесийна автентификация</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Add Mold Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Нова Матрица</h2>
            <p className="text-slate-400 text-sm mb-8">Въведете технически данни за новата единица.</p>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Име</label>
                  <input type="text" placeholder="Напр. Корпус A1" className="w-full p-3 bg-slate-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">SN</label>
                  <input type="text" placeholder="MOLD-XXX" className="w-full p-3 bg-slate-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Гнезда</label>
                  <input type="number" className="w-full p-3 bg-slate-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Общо удари</label>
                  <input type="number" defaultValue={0} className="w-full p-3 bg-slate-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
              </div>
            </div>
            <div className="mt-10 flex gap-4">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-slate-500 font-bold hover:text-slate-700 transition-colors">Отказ</button>
              <button onClick={() => setShowAddModal(false)} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-[1.02]">Запази</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
