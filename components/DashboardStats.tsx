
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { InjectionMold, ToolStatus } from '../types';

interface StatsProps {
  molds: InjectionMold[];
}

const DashboardStats: React.FC<StatsProps> = ({ molds }) => {
  const stats = {
    total: molds.length,
    active: molds.filter(m => m.status === ToolStatus.ACTIVE).length,
    repair: molds.filter(m => m.status === ToolStatus.IN_REPAIR).length,
  };

  const chartData = [
    { name: 'Активни', value: stats.active, color: '#22c55e' },
    { name: 'В ремонт', value: stats.repair, color: '#ef4444' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
      <div className="lg:col-span-1 grid grid-cols-1 gap-4">
        {[
          { label: 'Общо Матрици', val: stats.total, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Активни', val: stats.active, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'В Ремонт', val: stats.repair, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((item, i) => (
          <div key={i} className={`${item.bg} p-4 rounded-xl border border-white shadow-sm`}>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{item.label}</p>
            <p className={`text-2xl font-bold ${item.color}`}>{item.val}</p>
          </div>
        ))}
      </div>

      <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700 mb-6">Текущо състояние на инвентара</h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
