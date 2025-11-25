import React, { useState, useRef } from 'react';
import { AppData, Participant } from '../types';

interface SettingsProps {
  data: AppData;
  onUpdateData: (newData: AppData) => void;
}

export const Settings: React.FC<SettingsProps> = ({ data, onUpdateData }) => {
  const [newParticipantName, setNewParticipantName] = useState('');
  const [importJson, setImportJson] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // TBHC Palette: Rust, Taupe, Gold, Orange, Wood, Purple(Legacy/Night)
  const colors = ['#b95c34', '#8c7b75', '#cba163', '#d97706', '#5d4037', '#5b21b6'];

  const addParticipant = () => {
    if (!newParticipantName.trim()) return;
    const newP: Participant = {
      id: Date.now().toString(),
      name: newParticipantName,
      avatarColor: colors[data.participants.length % colors.length]
    };
    onUpdateData({
      ...data,
      participants: [...data.participants, newP]
    });
    setNewParticipantName('');
  };

  const startEdit = (p: Participant) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditAvatar(p.avatarUrl);
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    onUpdateData({
      ...data,
      participants: data.participants.map(p => 
        p.id === editingId 
          ? { ...p, name: editName, avatarUrl: editAvatar } 
          : p
      )
    });
    setEditingId(null);
    setEditName('');
    setEditAvatar(undefined);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "star_treatment_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importJson);
      if (parsed.movies && parsed.participants) {
        onUpdateData(parsed);
        setImportJson('');
        alert('Database updated successfully.');
      } else {
        alert('Invalid format.');
      }
    } catch (e) {
      alert('Invalid JSON.');
    }
  };

  return (
    <div className="p-6 md:p-12 max-w-3xl mx-auto">
      <h2 className="font-serif text-4xl text-tbhc-cream mb-8">Management</h2>
      
      <div className="space-y-8">
        {/* Participants */}
        <div className="bg-tbhc-card p-6 rounded-xl border border-white/5">
          <h3 className="text-tbhc-gold font-serif text-xl mb-4">Participants</h3>
          <div className="flex flex-col gap-3 mb-6">
            {data.participants.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-white/5 p-3 rounded border border-white/5">
                 {editingId === p.id ? (
                   <div className="flex gap-3 flex-1 items-center">
                     <div 
                        onClick={triggerFileInput}
                        className="w-10 h-10 rounded-full overflow-hidden cursor-pointer border border-tbhc-gold relative group"
                        style={{backgroundColor: p.avatarColor}}
                     >
                        {(editAvatar || p.avatarUrl) ? (
                          <img src={editAvatar || p.avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                        ) : null}
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                     </div>
                     <input 
                       type="file" 
                       ref={fileInputRef} 
                       className="hidden" 
                       accept="image/*"
                       onChange={handleFileChange}
                     />
                     
                     <input 
                        type="text" 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-black/20 border border-white/10 rounded px-2 py-1 text-tbhc-cream text-sm flex-1"
                        autoFocus
                     />
                     <button onClick={saveEdit} className="text-xs bg-tbhc-gold text-tbhc-bg px-3 py-1 rounded">Save</button>
                     <button onClick={() => setEditingId(null)} className="text-xs bg-white/10 text-white px-3 py-1 rounded">Cancel</button>
                   </div>
                 ) : (
                   <>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 flex-shrink-0" style={{backgroundColor: p.avatarColor}}>
                          {p.avatarUrl && <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />}
                        </div>
                        <span className="text-tbhc-cream text-sm">{p.name}</span>
                    </div>
                    <button onClick={() => startEdit(p)} className="text-tbhc-cream/30 hover:text-tbhc-gold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                   </>
                 )}
              </div>
            ))}
          </div>
          
          <div className="border-t border-white/5 pt-4">
             <label className="block text-tbhc-cream/50 text-xs uppercase mb-2">Add New Member</label>
             <div className="flex gap-2">
                <input 
                type="text" 
                value={newParticipantName}
                onChange={(e) => setNewParticipantName(e.target.value)}
                placeholder="Name..."
                className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-2 text-tbhc-cream focus:border-tbhc-gold focus:outline-none"
                />
                <button onClick={addParticipant} className="bg-tbhc-gold text-tbhc-bg px-4 py-2 rounded font-medium hover:bg-white transition-colors">
                Add
                </button>
            </div>
          </div>
        </div>

        {/* Data Control */}
        <div className="bg-tbhc-card p-6 rounded-xl border border-white/5">
           <h3 className="text-tbhc-gold font-serif text-xl mb-4">Data Persistence</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
               <label className="block text-tbhc-cream/50 text-xs uppercase mb-2">Export</label>
               <button onClick={handleExport} className="w-full border border-tbhc-gold text-tbhc-gold py-2 rounded hover:bg-tbhc-gold hover:text-tbhc-bg transition-colors">
                 Download JSON
               </button>
             </div>
             <div>
               <label className="block text-tbhc-cream/50 text-xs uppercase mb-2">Import</label>
               <textarea 
                 value={importJson}
                 onChange={(e) => setImportJson(e.target.value)}
                 className="w-full h-24 bg-black/20 border border-white/10 rounded p-2 text-xs text-tbhc-cream mb-2 font-mono"
                 placeholder="Paste JSON here..."
               />
               <button onClick={handleImport} className="w-full bg-white/10 text-tbhc-cream py-2 rounded hover:bg-white/20 transition-colors">
                 Load Data
               </button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};