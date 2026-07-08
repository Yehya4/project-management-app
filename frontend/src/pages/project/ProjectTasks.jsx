import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTasks, useTeam, useAuth } from '../../context/AppContext';
import { PlusCircle, MoreHorizontal, X, Clock, AlertTriangle, CheckCircle, Tag, User } from 'lucide-react';

const ProjectTasks = () => {
  const { project, isPending } = useOutletContext();
  const { tasks, addTask, updateTaskStatus } = useTasks();
  const { getTeamByProjectId } = useTeam();
  const { user } = useAuth();

  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const teamMembers = getTeamByProjectId(project.id) || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Moyenne',
    assigneeId: '',
    status: 'En cours'
  });

  const columns = [
    { id: 'En cours', title: 'En cours' },
    { id: 'Fait', title: 'Fait' },
    { id: 'Clôturée', title: 'Clôturée' },
    { id: 'Archivée', title: 'Archivée' }
  ];

  const handleAddTask = (e) => {
    e.preventDefault();
    addTask({
      ...formData,
      projectId: project.id
    });
    setIsModalOpen(false);
    setFormData({ title: '', description: '', priority: 'Moyenne', assigneeId: '', status: 'En cours' });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Basse': return 'bg-slate-100 text-slate-700';
      case 'Moyenne': return 'bg-blue-100 text-blue-700';
      case 'Haute': return 'bg-amber-100 text-amber-700';
      case 'Critique': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getAssigneeName = (id) => {
    if (!id) return 'Non assigné';
    const member = teamMembers.find(m => m.userId.toString() === id.toString());
    return member ? `${member.user.prenom} ${member.user.nom}` : 'Inconnu';
  };

  const handleDragStart = (e, taskId) => {
    if (user?.role === 'Developer' || user?.role === 'Tester') {
      const taskToDrag = projectTasks.find(t => t.id === taskId);
      if (!taskToDrag || taskToDrag.assigneeId?.toString() !== user.id?.toString()) {
        e.preventDefault();
        return;
      }
    }
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      if (user?.role === 'Developer' || user?.role === 'Tester') {
        const taskToDrag = projectTasks.find(t => t.id === taskId);
        if (!taskToDrag || taskToDrag.assigneeId?.toString() !== user.id?.toString()) {
          return;
        }
      }
      updateTaskStatus(taskId, status);
    }
  };

  const handleStatusChange = (taskId, newStatus) => {
    updateTaskStatus(taskId, newStatus);
    setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tâches de développement</h2>
          <p className="text-slate-500">Gérez les tâches de {project.nom}.</p>
        </div>
        {!isPending && (user?.role === 'Project Manager' || user?.role === 'Admin') && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusCircle size={20} />
            Nouvelle tâche
          </button>
        )}
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {columns.map(column => {
          const colTasks = projectTasks.filter(t => t.status === column.id);
          return (
            <div 
              key={column.id} 
              className="flex flex-col bg-slate-100/80 rounded-2xl w-80 shrink-0 border border-slate-200"
              onDrop={(e) => handleDrop(e, column.id)}
              onDragOver={handleDragOver}
            >
              <div className="p-4 flex items-center justify-between border-b border-slate-200/50">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-800">{column.title}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold">{colTasks.length}</span>
                </div>
                <button className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors">
                  <MoreHorizontal size={20} />
                </button>
              </div>
              
              <div className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto">
                {colTasks.length > 0 ? (
                  colTasks.map(task => (
                    <div 
                      key={task.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => setSelectedTask(task)}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow hover:border-blue-300 transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className="text-xs font-mono text-slate-400">{task.id.split('-')[1].slice(-4)}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm mb-1 leading-tight group-hover:text-blue-600 transition-colors">{task.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">{task.description}</p>
                      
                      <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                        <div className="flex -space-x-2">
                          {task.assigneeId ? (
                            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm" title={getAssigneeName(task.assigneeId)}>
                              {getAssigneeName(task.assigneeId).charAt(0)}
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 border-2 border-white" title="Non assigné">
                              <User size={12} />
                            </div>
                          )}
                        </div>
                         {column.id === 'En cours' && <Clock size={14} className="text-blue-500 animate-pulse" />}
                         {column.id === 'Fait' && <CheckCircle size={14} className="text-emerald-500" />}
                         {column.id === 'Clôturée' && <CheckCircle size={14} className="text-purple-500" />}
                         {column.id === 'Archivée' && <Tag size={14} className="text-slate-500" />}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm p-4 text-center border-2 border-dashed border-slate-200 rounded-xl m-1 opacity-50">
                    <p>Déposez des tâches ici</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <PlusCircle className="text-blue-600" /> Créer une nouvelle tâche
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1">
              <form id="task-form" onSubmit={handleAddTask} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Résumé / Titre <span className="text-red-500">*</span></label>
                  <input 
                    type="text"
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                    placeholder="ex: Implémenter la page de connexion..."
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Description détaillée</label>
                  <textarea 
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[120px]"
                    placeholder="Décrivez la tâche, les critères d'acceptation, etc."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Tag size={16} /> Priorité
                    </label>
                    <select 
                      className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    >
                      <option value="Basse">⬇️ Basse</option>
                      <option value="Moyenne">⏺️ Moyenne</option>
                      <option value="Haute">⬆️ Haute</option>
                      <option value="Critique">🔥 Critique</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Assigner à</label>
                    <select 
                      className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.assigneeId}
                      onChange={(e) => setFormData({...formData, assigneeId: e.target.value})}
                    >
                      <option value="">Non assigné</option>
                      {teamMembers.map(m => (
                        <option key={m.userId} value={m.userId}>{m.user.prenom} {m.user.nom} ({m.role})</option>
                      ))}
                    </select>
                    {teamMembers.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">L'équipe est vide. Allez dans "Équipe" pour ajouter des membres.</p>
                    )}
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button 
                type="submit"
                form="task-form"
                disabled={!formData.title}
                className="px-6 py-2.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-500/30"
              >
                Créer la tâche
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Détails Tâche */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0 bg-slate-50">
              <div>
                <span className="text-xs font-mono text-slate-400 block mb-1">{selectedTask.id}</span>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  Détails de la tâche
                </h3>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200/50 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 space-y-6 flex-1">
              <div>
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Titre</h4>
                <p className="text-lg font-bold text-slate-800">{selectedTask.title}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 text-slate-700 text-sm whitespace-pre-wrap min-h-[100px] leading-relaxed">
                  {selectedTask.description || <em className="text-slate-400">Aucune description détaillée fournie.</em>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-2">
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Priorité</h4>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(selectedTask.priority)}`}>
                    {selectedTask.priority === 'Basse' && '⬇️'}
                    {selectedTask.priority === 'Moyenne' && '⏺️'}
                    {selectedTask.priority === 'Haute' && '⬆️'}
                    {selectedTask.priority === 'Critique' && '🔥'}
                    {selectedTask.priority}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Statut / Colonne</h4>
                  {user?.role === 'Project Manager' || user?.role === 'Admin' || selectedTask.assigneeId?.toString() === user?.id?.toString() ? (
                    <select
                      className="border border-slate-300 rounded-lg p-1.5 text-xs font-bold bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={selectedTask.status}
                      onChange={(e) => handleStatusChange(selectedTask.id, e.target.value)}
                    >
                      {columns.map(col => (
                        <option key={col.id} value={col.id}>{col.title}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {selectedTask.status}
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Assigné à</h4>
                <div className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  {selectedTask.assigneeId ? (
                    <>
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                        {getAssigneeName(selectedTask.assigneeId).charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{getAssigneeName(selectedTask.assigneeId)}</p>
                        <p className="text-xs text-slate-400">Membre de l'équipe</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                        <User size={18} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-500 text-sm">Non assigné</p>
                        <p className="text-xs text-slate-400">Aucun collaborateur affecté</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button 
                type="button" 
                onClick={() => setSelectedTask(null)}
                className="px-6 py-2.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm shadow-blue-500/20"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTasks;
