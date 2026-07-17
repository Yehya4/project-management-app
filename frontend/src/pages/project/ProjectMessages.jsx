import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth, useMessages, useUser, useTeam } from '../../context/AppContext';
import { Send, Users, MessageSquare, Hash, User, PlusCircle, Lock, Plus } from 'lucide-react';

const ProjectMessages = () => {
  const { project } = useOutletContext();
  const { user } = useAuth();
  const { users } = useUser();
  const { getTeamByProjectId } = useTeam();
  const { messages, sendMessage } = useMessages();
  
  const [inputValue, setInputValue] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentions, setMentions] = useState([]);
  

  const [activeChat, setActiveChat] = useState('general'); // 'general' or userId
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchPartnerQuery, setSearchPartnerQuery] = useState('');
  const [tempActiveChat, setTempActiveChat] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const teamMembers = getTeamByProjectId(project.id) || [];

  const memberUserIds = teamMembers.map(m => m.userId.toString());
  const projectTeamUsers = users.filter(u => memberUserIds.includes(u.id.toString()));
  
  const pmUser = users.find(u => 
    `${u.prenom || ''} ${u.nom || ''}`.trim() === project.chefProjet?.trim() || 
    (u.role === 'Project Manager' && project.chefProjet?.trim() !== 'Non assigné')
  );

  const projectUsers = [
    ...(pmUser ? [pmUser] : []),
    ...projectTeamUsers
  ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);


  const privateChats = messages.reduce((acc, msg) => {
    if (msg.projectId === project.id && msg.recipientId) {
      const partnerId = msg.senderId === user.id ? msg.recipientId : msg.senderId;
      if (partnerId && !acc.includes(partnerId)) {
        acc.push(partnerId);
      }
    }
    return acc;
  }, []);

  const activePrivateChatPartnerIds = [
    ...privateChats,
    ...(tempActiveChat && !privateChats.includes(tempActiveChat) ? [tempActiveChat] : [])
  ];


  const projectMessages = messages.filter(m => {
    if (m.projectId !== project.id) return false;
    
    if (activeChat === 'general') {
      return !m.recipientId;
    } else {
      return (
        (m.senderId === user.id && m.recipientId === activeChat) ||
        (m.senderId === activeChat && m.recipientId === user.id)
      );
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [projectMessages]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    if (activeChat === 'general') {
      const lastWord = value.split(' ').pop();
      if (lastWord.startsWith('@')) {
        setMentionFilter(lastWord.slice(1).toLowerCase());
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (selectedUser) => {
    const words = inputValue.split(' ');
    words.pop(); 
    const newValue = [...words, `@${selectedUser.prenom || ''} ${selectedUser.nom || ''} `].join(' ');
    setInputValue(newValue);
    setMentions([...mentions, selectedUser.id]);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    if (activeChat === 'general') {
      sendMessage(inputValue.trim(), mentions, project.id);
    } else {
      sendMessage(inputValue.trim(), [], project.id, activeChat);
    }
    setInputValue('');
    setMentions([]);
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredUsers = projectUsers.filter(u => 
    `${u.nom || ''} ${u.prenom || ''}`.toLowerCase().includes(mentionFilter)
    && u.id !== user.id
  );

  const potentialPartners = projectUsers.filter(u => u.id?.toString() !== user.id?.toString());

  return (
    <div className="flex h-[calc(100vh-10rem)] bg-slate-50 overflow-hidden rounded-2xl border border-slate-200 shadow-sm relative">
      {}
      <div className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare size={20} className="text-blue-600" /> Canal Projet
          </h2>
        </div>
        <div className="p-4 flex-1 flex flex-col min-h-0">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Canaux</h3>
          <div className="space-y-1 mb-6">
            <div 
              onClick={() => { setActiveChat('general'); setTempActiveChat(null); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium cursor-pointer transition-colors ${
                activeChat === 'general' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Hash size={18} />
              Général
            </div>
          </div>

          <div className="flex items-center justify-between mb-3 pr-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conversations privées</h3>
            <button 
              onClick={() => setShowNewChatModal(true)}
              className="text-blue-600 hover:text-blue-800 transition-colors"
              title="Nouvelle conversation"
            >
              <PlusCircle size={18} />
            </button>
          </div>

          <div className="space-y-1 overflow-y-auto flex-1">
            {activePrivateChatPartnerIds.length === 0 ? (
              <p className="text-xs text-slate-400 italic px-3 py-2">Aucune discussion privée</p>
            ) : (
              activePrivateChatPartnerIds.map(partnerId => {
                const partner = projectUsers.find(u => u.id?.toString() === partnerId?.toString());
                if (!partner) return null;
                const partnerName = partner.name || `${partner.prenom || ''} ${partner.nom || ''}`.trim();
                const isSelected = activeChat === partnerId;
                
                return (
                  <div
                    key={partnerId}
                    onClick={() => { setActiveChat(partnerId); setTempActiveChat(partnerId); }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {partnerName.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate text-sm">{partnerName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal shrink-0 italic">{partner.role}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {}
      <div className="flex-1 flex flex-col bg-slate-50/50">
        {}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between shrink-0">
          {activeChat === 'general' ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <Hash size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800">Général du Projet</h2>
                  <p className="text-xs text-slate-500">Discussion ouverte à toute l'équipe du projet {project.nom}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Users size={18} />
                <span className="text-sm font-medium">{projectUsers.length} membres</span>
              </div>
            </>
          ) : (() => {
            const partner = projectUsers.find(u => u.id?.toString() === activeChat?.toString());
            const partnerName = partner ? (partner.name || `${partner.prenom || ''} ${partner.nom || ''}`.trim()) : 'Utilisateur';
            return (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                    <User size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800 flex items-center gap-1.5">
                      {partnerName}
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-500 font-semibold uppercase">{partner?.role || 'Membre'}</span>
                    </h2>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Lock size={12} className="text-emerald-500 shrink-0" /> Conversation privée et sécurisée en temps réel
                    </p>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {projectMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <MessageSquare size={48} className="mb-4 opacity-20" />
              <p>{activeChat === 'general' ? 'Aucun message sur ce projet. Communiquez avec l\'équipe !' : 'Début de votre conversation privée sécurisée.'}</p>
            </div>
          ) : (
            projectMessages.map((msg, index) => {
              const isMine = msg.senderId === user.id;
              

              const contentWithMentions = activeChat === 'general' 
                ? msg.content.split(/(@\w+(?: \w+)?)/g).map((part, i) => {
                    if (part.startsWith('@')) {
                      return <span key={i} className="font-bold text-blue-600 bg-blue-50 px-1 rounded">{part}</span>;
                    }
                    return part;
                  })
                : msg.content;

              return (
                <div key={msg.id || index} className={`flex gap-4 ${isMine ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${isMine ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {msg.senderName.charAt(0).toUpperCase()}
                  </div>
                  <div className={`flex flex-col max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-bold text-slate-700">{isMine ? 'Vous' : msg.senderName}</span>
                      <span className="text-xs text-slate-400">{formatTime(msg.createdAt)}</span>
                    </div>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                      isMine 
                        ? 'bg-blue-600 text-white rounded-tr-sm' 
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'
                    }`}>
                      {contentWithMentions}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {}
        <div className="p-4 bg-white border-t border-slate-200 relative">
          {}
          {activeChat === 'general' && showMentions && filteredUsers.length > 0 && (
            <div className="absolute bottom-full left-4 mb-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 max-h-48 overflow-y-auto">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
                Membres du projet
              </div>
              {filteredUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleMentionSelect(u)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                    {(u.nom || u.name || '').charAt(0)}
                  </div>
                  <span className="font-medium">{u.name || `${u.prenom || ''} ${u.nom || ''}`}</span>
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-end gap-3">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl flex items-end p-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-sm">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder={activeChat === 'general' ? "Écrivez votre message... Tapez @ pour mentionner un membre de l'équipe" : "Écrivez votre message privé sécurisé..."}
                className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] px-3 py-2.5 text-sm outline-none"
                rows="1"
              />
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="h-[60px] w-[60px] rounded-2xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shrink-0"
            >
              <Send size={20} className={inputValue.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
            </button>
          </form>
        </div>
      </div>

      {}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Plus size={20} className="text-blue-600" /> Nouvelle conversation privée
              </h3>
              <button 
                onClick={() => setShowNewChatModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors text-sm font-semibold"
              >
                Fermer
              </button>
            </div>
            
            <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <input 
                type="text"
                placeholder="Rechercher un membre du projet..."
                value={searchPartnerQuery}
                onChange={(e) => setSearchPartnerQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[200px]">
              {potentialPartners.filter(u => {
                const fullName = (u.name || `${u.prenom || ''} ${u.nom || ''}`).toLowerCase();
                return fullName.includes(searchPartnerQuery.toLowerCase());
              }).length === 0 ? (
                <div className="text-center text-slate-400 py-8 text-sm">
                  Aucun membre trouvé
                </div>
              ) : (
                potentialPartners.filter(u => {
                  const fullName = (u.name || `${u.prenom || ''} ${u.nom || ''}`).toLowerCase();
                  return fullName.includes(searchPartnerQuery.toLowerCase());
                }).map(u => {
                  const fullName = u.name || `${u.prenom || ''} ${u.nom || ''}`.trim();
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        setActiveChat(u.id);
                        setTempActiveChat(u.id);
                        setShowNewChatModal(false);
                        setSearchPartnerQuery('');
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50/50 rounded-xl flex items-center gap-3 transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                        {fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800 text-sm group-hover:text-blue-700 truncate">{fullName}</p>
                        <p className="text-xs text-slate-400 font-medium truncate">{u.role || u.fonction}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectMessages;
