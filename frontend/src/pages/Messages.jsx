import React, { useState, useRef, useEffect } from 'react';
import { useAuth, useMessages, useUser } from '../context/AppContext';
import { Send, Users, Search, MessageSquare, Hash } from 'lucide-react';
import Layout from '../components/Layout';

const Messages = () => {
  const { user } = useAuth();
  const { users } = useUser();
  const { messages, sendMessage } = useMessages();
  const globalMessages = messages.filter(m => !m.projectId);
  
  const [inputValue, setInputValue] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentions, setMentions] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [globalMessages]);

  
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    
    const lastWord = value.split(' ').pop();
    if (lastWord.startsWith('@')) {
      setMentionFilter(lastWord.slice(1).toLowerCase());
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (selectedUser) => {
    const words = inputValue.split(' ');
    words.pop(); 
    const newValue = [...words, `@${selectedUser.name || selectedUser.nom + ' ' + selectedUser.prenom} `].join(' ');
    setInputValue(newValue);
    setMentions([...mentions, selectedUser.id]);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    sendMessage(inputValue.trim(), mentions);
    setInputValue('');
    setMentions([]);
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredUsers = users.filter(u => 
    (u.name || `${u.nom} ${u.prenom}`).toLowerCase().includes(mentionFilter)
    && u.id !== user.id
  );

  return (
    <Layout title="Messagerie">
      <div className="flex h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden rounded-xl border border-slate-200 shadow-sm mt-4 mx-4">
        {}
        <div className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare size={20} className="text-blue-600" /> Messagerie
          </h2>
        </div>
        <div className="p-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Canaux</h3>
          <div className="space-y-1">
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium cursor-pointer">
              <Hash size={18} />
              Général
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-slate-200 mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
              {(user.nom || user.name)?.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{user.nom ? `${user.nom} ${user.prenom}` : user.name}</p>
              <p className="text-xs text-slate-500">{user.role}</p>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="flex-1 flex flex-col bg-slate-50/50">
        {}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Hash size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Général</h2>
              <p className="text-xs text-slate-500">Discussion d'équipe globale</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Users size={18} />
            <span className="text-sm font-medium">{users.length} membres</span>
          </div>
        </div>

        {}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {globalMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <MessageSquare size={48} className="mb-4 opacity-20" />
              <p>Aucun message. Soyez le premier à écrire !</p>
            </div>
          ) : (
            globalMessages.map((msg, index) => {
              const isMine = msg.senderId === user.id;
              

              const contentWithMentions = msg.content.split(/(@\w+(?: \w+)?)/g).map((part, i) => {
                if (part.startsWith('@')) {
                  return <span key={i} className="font-bold text-blue-600 bg-blue-50 px-1 rounded">{part}</span>;
                }
                return part;
              });

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
          {showMentions && filteredUsers.length > 0 && (
            <div className="absolute bottom-full left-4 mb-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 max-h-48 overflow-y-auto">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
                Membres de l'équipe
              </div>
              {filteredUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleMentionSelect(u)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                    {(u.nom || u.name).charAt(0)}
                  </div>
                  <span className="font-medium">{u.name || `${u.nom} ${u.prenom}`}</span>
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
                placeholder="Écrivez votre message... Tapez @ pour mentionner quelqu'un"
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
      </div>
    </Layout>
  );
};

export default Messages;
