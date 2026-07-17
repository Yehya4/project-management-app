import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AppContext';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, AlignLeft, X, Trash2 } from 'lucide-react';

const PRESETS_COLORS = [
  { value: '#3480fa', name: 'Bleu', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', bullet: 'bg-blue-500' },
  { value: '#10b981', name: 'Vert', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', bullet: 'bg-emerald-500' },
  { value: '#f59e0b', name: 'Orange', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', bullet: 'bg-amber-500' },
  { value: '#ef4444', name: 'Rouge', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', bullet: 'bg-rose-500' },
  { value: '#6366f1', name: 'Indigo', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', bullet: 'bg-indigo-500' }
];

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const ProjectCalendar = () => {
  const { project } = useOutletContext();
  const { user, token } = useAuth();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    color: '#3b82f6'
  });

  const isController = user?.role === 'Project Manager' || user?.role === 'Sponsor' || user?.role === 'Admin';
  const API_URL = `http://localhost:5000/api/projects/${project.id}/events`;
  const BASE_EVENT_URL = `http://localhost:5000/api/events`;

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(API_URL, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error('Error fetching calendar events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (project?.id) {
      fetchEvents();
    }
  }, [project?.id]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayIndex = (y, m) => {
    const day = new Date(y, m, 1).getDay();
    return day === 0 ? 6 : day - 1; 
  };

  const totalDays = getDaysInMonth(year, month);
  const startOffset = getFirstDayIndex(year, month);

  
  const daysGrid = [];
  
  for (let i = 0; i < startOffset; i++) {
    daysGrid.push(null);
  }
  
  for (let i = 1; i <= totalDays; i++) {
    daysGrid.push(new Date(year, month, i));
  }

  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const getEventsForDay = (day) => {
    if (!day) return [];
    return events.filter(event => {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      const target = new Date(day);
      target.setHours(0, 0, 0, 0);
      
      const checkStart = new Date(start);
      checkStart.setHours(0, 0, 0, 0);
      const checkEnd = new Date(end);
      checkEnd.setHours(23, 59, 59, 999);

      return target >= checkStart && target <= checkEnd;
    });
  };

  const handleDayClick = (day) => {
    if (!day || !isController) return;
    const formattedDate = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}T09:00`;
    const formattedEndDate = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}T18:00`;
    
    setFormData({
      title: '',
      description: '',
      startDate: formattedDate,
      endDate: formattedEndDate,
      color: '#3b82f6'
    });
    setIsEditMode(false);
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (e, event) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      startDate: event.startDate.substring(0, 16),
      endDate: event.endDate.substring(0, 16),
      color: event.color || '#3b82f6'
    });
    setIsEditMode(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.startDate || !formData.endDate) return;

    try {
      if (isEditMode && selectedEvent) {
        
        const res = await fetch(`${BASE_EVENT_URL}/${selectedEvent.id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          const updated = await res.json();
          setEvents(prev => prev.map(evt => evt.id === selectedEvent.id ? { ...evt, ...updated } : evt));
          setIsModalOpen(false);
          setSelectedEvent(null);
        }
      } else {
        
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          const newEvent = await res.json();
          setEvents(prev => [...prev, newEvent]);
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      console.error('Error saving event:', err);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent || !window.confirm('Voulez-vous vraiment supprimer cet événement ?')) return;

    try {
      const res = await fetch(`${BASE_EVENT_URL}/${selectedEvent.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setEvents(prev => prev.filter(evt => evt.id !== selectedEvent.id));
        setSelectedEvent(null);
      }
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  const getEventColors = (colorVal) => {
    return PRESETS_COLORS.find(c => c.value === colorVal) || PRESETS_COLORS[0];
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
      {}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="text-blue-600" size={24} />
            Calendrier du Projet
          </h2>
          <p className="text-sm text-slate-500">Planifiez et visualisez les jalons et réunions de {project.nom}.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center border border-slate-200 bg-slate-50 rounded-xl p-1 shadow-inner">
            <button 
              onClick={handlePrevMonth} 
              className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-600 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-4 text-sm font-bold text-slate-700 min-w-[120px] text-center select-none">
              {MONTHS[month]} {year}
            </span>
            <button 
              onClick={handleNextMonth} 
              className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-600 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button 
            onClick={handleToday}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-all text-sm"
          >
            Aujourd'hui
          </button>

          {isController && (
            <button
              onClick={() => {
                const now = new Date();
                const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T09:00`;
                const formattedEndDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T18:00`;
                
                setFormData({
                  title: '',
                  description: '',
                  startDate: formattedDate,
                  endDate: formattedEndDate,
                  color: '#3b82f6'
                });
                setIsEditMode(false);
                setSelectedEvent(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm text-sm"
            >
              <Plus size={16} />
              Créer un événement
            </button>
          )}
        </div>
      </div>

      {}
      <div className="flex-1 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-0">
        {}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-center py-3 select-none text-xs font-bold text-slate-500 uppercase tracking-wider">
          {WEEKDAYS.map(day => (
            <div key={day} className="first:text-slate-400 last:text-slate-400">{day}</div>
          ))}
        </div>

        {}
        <div className="flex-1 grid grid-cols-7 grid-rows-5 divide-x divide-y divide-slate-100 min-h-0 overflow-y-auto">
          {daysGrid.map((day, idx) => {
            const isToday = isSameDay(day, new Date());
            const dayEvents = getEventsForDay(day);

            return (
              <div 
                key={idx} 
                onClick={() => handleDayClick(day)}
                className={`p-3 min-h-[90px] flex flex-col group transition-colors select-none ${
                  day 
                    ? isController ? 'hover:bg-slate-50/70 cursor-pointer' : 'bg-white'
                    : 'bg-slate-50/20'
                }`}
              >
                {day && (
                  <div className="flex justify-between items-center mb-2">
                    <span className={`w-7 h-7 flex items-center justify-center text-sm font-bold rounded-full ${
                      isToday 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                        : 'text-slate-700 group-hover:text-slate-900'
                    }`}>
                      {day.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400 select-none">
                        {dayEvents.length} évt.
                      </span>
                    )}
                  </div>
                )}

                {}
                <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin">
                  {day && dayEvents.map(event => {
                    const colors = getEventColors(event.color);
                    return (
                      <div
                        key={event.id}
                        onClick={(e) => handleEventClick(e, event)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all truncate hover:brightness-95 flex items-center gap-1.5 ${colors.bg} ${colors.border} ${colors.text}`}
                        title={event.title}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.bullet} shrink-0`} />
                        <span className="truncate">{event.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden transform transition-all flex flex-col"
          >
            {}
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <CalendarIcon size={20} className="text-blue-600" />
                {isEditMode ? "Modifier l'événement" : "Ajouter un événement"}
              </h3>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Titre de l'événement</label>
                <input 
                  type="text"
                  placeholder="Ex: Réunion de Sprint, Déploiement Prototype, etc."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 text-sm transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea 
                  placeholder="Détaillez le but de cet événement..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 text-sm min-h-[100px] transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Début</label>
                  <input 
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 text-slate-800 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fin</label>
                  <input 
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 text-slate-800 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Couleur de la pastille</label>
                <div className="flex gap-3">
                  {PRESETS_COLORS.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${color.bg} ${color.border} border-2 ${
                        formData.color === color.value ? 'scale-110 shadow-md ring-2 ring-blue-500/30' : 'hover:scale-105 opacity-80'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${color.bullet}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm transition-all"
              >
                Annuler
              </button>
              <button 
                type="submit"
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 text-sm transition-all shadow-sm"
              >
                {isEditMode ? 'Enregistrer les modifications' : 'Créer l\'événement'}
              </button>
            </div>
          </form>
        </div>
      )}

      {}
      {selectedEvent && !isEditMode && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden transform transition-all flex flex-col">
            {}
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getEventColors(selectedEvent.color).bg} ${getEventColors(selectedEvent.color).border} ${getEventColors(selectedEvent.color).text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${getEventColors(selectedEvent.color).bullet}`} />
                Événement
              </span>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {}
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-xl font-bold text-slate-800">{selectedEvent.title}</h4>
              </div>

              {selectedEvent.description && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><AlignLeft size={12} /> Description</span>
                  <p className="text-slate-600 text-sm bg-slate-50 p-4 rounded-2xl border border-slate-100 whitespace-pre-wrap">{selectedEvent.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Clock size={12} /> Début</span>
                  <span className="text-slate-800 text-xs font-bold">{new Date(selectedEvent.startDate).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <div className="space-y-1 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Clock size={12} /> Fin</span>
                  <span className="text-slate-800 text-xs font-bold">{new Date(selectedEvent.endDate).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
              </div>
            </div>

            {}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              {isController ? (
                <>
                  <button 
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100 rounded-xl font-semibold text-xs transition-all"
                  >
                    <Trash2 size={14} /> Supprimer
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsEditMode(true)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs transition-all"
                    >
                      Modifier
                    </button>
                    <button 
                      onClick={() => setSelectedEvent(null)}
                      className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-all shadow-sm"
                    >
                      Fermer
                    </button>
                  </div>
                </>
              ) : (
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="w-full text-center py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-all shadow-sm"
                >
                  Fermer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {}
      {selectedEvent && isEditMode && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden transform transition-all flex flex-col"
          >
            {}
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <CalendarIcon size={20} className="text-blue-600" />
                Modifier l'événement
              </h3>
              <button 
                type="button" 
                onClick={() => {
                  setIsEditMode(false);
                  setSelectedEvent(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Titre de l'événement</label>
                <input 
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 text-sm transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 text-sm min-h-[100px] transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Début</label>
                  <input 
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 text-slate-800 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fin</label>
                  <input 
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 text-slate-800 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Couleur de la pastille</label>
                <div className="flex gap-3">
                  {PRESETS_COLORS.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${color.bg} ${color.border} border-2 ${
                        formData.color === color.value ? 'scale-110 shadow-md ring-2 ring-blue-500/30' : 'hover:scale-105 opacity-80'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${color.bullet}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <button 
                type="button"
                onClick={() => setIsEditMode(false)}
                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm transition-all"
              >
                Retour
              </button>
              <button 
                type="submit"
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 text-sm transition-all shadow-sm"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProjectCalendar;
