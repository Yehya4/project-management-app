import React, { useState } from 'react';
import Layout from '../components/Layout';
import ConfigEditor from '../components/dashboards/ConfigEditor';
import ArchiveManager from '../components/dashboards/ArchiveManager';
import { Settings, Archive, Sliders, ShieldCheck } from 'lucide-react';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('config');

  return (
    <Layout title="Paramètres Administration">
      <div className="space-y-8 max-w-6xl mx-auto pb-12">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md text-blue-400">
                <Settings size={28} />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Paramètres & Configuration Système
              </h1>
            </div>
            <p className="text-slate-300 mt-2 text-sm md:text-base max-w-2xl">
              Gérez l'ensemble des paramètres globaux, éditez les catégories, domaines, natures de besoin et administrez les éléments archivés.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/60 backdrop-blur-md shrink-0">
            <button
              onClick={() => setActiveTab('config')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs md:text-sm transition-all ${
                activeTab === 'config'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Sliders size={16} /> Configuration
            </button>
            <button
              onClick={() => setActiveTab('archive')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs md:text-sm transition-all ${
                activeTab === 'archive'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Archive size={16} /> Archives & Restauration
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'config' ? (
          <div className="space-y-6 animate-fade-in">
            <ConfigEditor />
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <ArchiveManager />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SettingsPage;
