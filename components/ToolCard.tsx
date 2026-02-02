
import React from 'react';
import { InjectionMold, ToolStatus } from '../types';

interface ToolCardProps {
  mold: InjectionMold;
  onClick: (id: string) => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ mold, onClick }) => {
  const getStatusColor = (status: ToolStatus) => {
    switch (status) {
      case ToolStatus.ACTIVE: return 'bg-green-100 text-green-800 border-green-200';
      case ToolStatus.IN_REPAIR: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div 
      onClick={() => onClick(mold.id)}
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{mold.name}</h3>
          <p className="text-sm text-slate-500 font-mono uppercase">{mold.serialNumber}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(mold.status)}`}>
          {mold.status}
        </span>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Общо удари</p>
            <p className="font-semibold text-slate-700">{mold.totalShots.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-slate-400">Гнезда</p>
            <p className="font-semibold text-slate-700">{mold.cavities}</p>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-50">
           <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Производител: {mold.manufacturer}</p>
        </div>
      </div>
    </div>
  );
};

export default ToolCard;
