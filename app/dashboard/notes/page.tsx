// Notes Page - Quick notes for later processing
'use client';

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Input } from '@/components/ui';
import { useWorkspaceStore } from '@/stores';
import { fetchNotes, createNote, updateNote, deleteNote, Note } from '@/lib/notesService';
import { toast } from 'sonner';
import { Plus, Pin, PinOff, Trash2, Search, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';

const NOTE_COLORS = [
    { value: null, label: 'Alapértelmezett' },
    { value: '#6366F1', label: 'Indigo' },
    { value: '#F59E0B', label: 'Sárga' },
    { value: '#10B981', label: 'Zöld' },
    { value: '#EF4444', label: 'Piros' },
    { value: '#8B5CF6', label: 'Lila' },
    { value: '#06B6D4', label: 'Cián' },
];

export default function NotesPage() {
    const { currentWorkspaceId, initialize, isInitialized } = useWorkspaceStore();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const contentRef = useRef<HTMLTextAreaElement>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize workspace store if needed
    useEffect(() => {
        if (!isInitialized) {
            initialize();
        }
    }, [isInitialized, initialize]);

    // Load notes
    useEffect(() => {
        async function load() {
            if (!currentWorkspaceId) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const data = await fetchNotes(currentWorkspaceId);
                setNotes(data);
            } catch (error) {
                console.error('Failed to load notes:', error);
                toast.error('Hiba a jegyzetek betöltésekor');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [currentWorkspaceId]);

    // Auto-save when editing
    const autoSave = (noteId: string, title: string, content: string) => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                const updated = await updateNote({ id: noteId, title, content });
                setNotes(prev => prev.map(n => n.id === noteId ? updated : n));
            } catch (error) {
                console.error('Auto-save failed:', error);
            }
        }, 800);
    };

    const handleCreate = async () => {
        if (!currentWorkspaceId) return;
        try {
            const newNote = await createNote({
                workspace_id: currentWorkspaceId,
                title: 'Új jegyzet',
                content: '',
            });
            setNotes(prev => [newNote, ...prev]);
            setSelectedNote(newNote);
            setEditTitle(newNote.title);
            setEditContent('');
            toast.success('Jegyzet létrehozva');
            // Focus on title after render
            setTimeout(() => contentRef.current?.focus(), 100);
        } catch (error) {
            console.error('Failed to create note:', error);
            toast.error('Hiba a jegyzet létrehozásakor');
        }
    };

    const handleTogglePin = async (note: Note) => {
        try {
            const updated = await updateNote({ id: note.id, is_pinned: !note.is_pinned });
            setNotes(prev => {
                const rest = prev.filter(n => n.id !== note.id);
                // Re-sort: pinned first
                const allNotes = [...rest, updated];
                return allNotes.sort((a, b) => {
                    if (a.is_pinned && !b.is_pinned) return -1;
                    if (!a.is_pinned && b.is_pinned) return 1;
                    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
                });
            });
            if (selectedNote?.id === note.id) {
                setSelectedNote(updated);
            }
            toast.success(updated.is_pinned ? 'Rögzítve' : 'Rögzítés levéve');
        } catch (error) {
            console.error('Failed to toggle pin:', error);
        }
    };

    const handleDelete = async (noteId: string) => {
        try {
            await deleteNote(noteId);
            setNotes(prev => prev.filter(n => n.id !== noteId));
            if (selectedNote?.id === noteId) {
                setSelectedNote(null);
            }
            setShowDeleteConfirm(null);
            toast.success('Jegyzet törölve');
        } catch (error) {
            console.error('Failed to delete note:', error);
            toast.error('Hiba a törlés során');
        }
    };

    const handleSelectNote = (note: Note) => {
        // Save current note before switching
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        setSelectedNote(note);
        setEditTitle(note.title);
        setEditContent(note.content);
    };

    const handleTitleChange = (value: string) => {
        setEditTitle(value);
        if (selectedNote) autoSave(selectedNote.id, value, editContent);
    };

    const handleContentChange = (value: string) => {
        setEditContent(value);
        if (selectedNote) autoSave(selectedNote.id, editTitle, value);
    };

    const handleColorChange = async (note: Note, color: string | null) => {
        try {
            const updated = await updateNote({ id: note.id, color });
            setNotes(prev => prev.map(n => n.id === note.id ? updated : n));
            if (selectedNote?.id === note.id) setSelectedNote(updated);
        } catch (error) {
            console.error('Failed to update color:', error);
        }
    };

    // Filter notes by search
    const filteredNotes = notes.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-full">
                    <div className="text-slate-400">Betöltés...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] gap-4">
                {/* Notes List (left panel) */}
                <div className={cn(
                    'flex flex-col w-full md:w-80 lg:w-96 flex-shrink-0 bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden',
                    selectedNote && 'hidden md:flex'
                )}>
                    {/* Header */}
                    <div className="p-4 border-b border-slate-800">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-bold text-slate-100">📝 Jegyzetek</h2>
                            <Button variant="primary" size="sm" onClick={handleCreate}>
                                <Plus size={16} className="mr-1" />
                                Új
                            </Button>
                        </div>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Keresés..."
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Notes list */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {filteredNotes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 p-6">
                                <StickyNote className="h-12 w-12 mb-3 text-slate-700" />
                                <p className="text-sm">{searchQuery ? 'Nincs találat' : 'Még nincs jegyzeted'}</p>
                                {!searchQuery && (
                                    <Button variant="secondary" size="sm" onClick={handleCreate} className="mt-3">
                                        <Plus size={14} className="mr-1" /> Első jegyzet
                                    </Button>
                                )}
                            </div>
                        ) : (
                            filteredNotes.map((note) => (
                                <button
                                    key={note.id}
                                    onClick={() => handleSelectNote(note)}
                                    className={cn(
                                        'w-full text-left p-4 border-b border-slate-800/50 transition-colors group',
                                        selectedNote?.id === note.id
                                            ? 'bg-indigo-600/10 border-l-2 border-l-indigo-500'
                                            : 'hover:bg-slate-800/50'
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                {note.is_pinned && <Pin size={12} className="text-indigo-400 flex-shrink-0" />}
                                                {note.color && (
                                                    <span
                                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: note.color }}
                                                    />
                                                )}
                                                <span className="font-medium text-sm text-slate-200 truncate">
                                                    {note.title || 'Névtelen jegyzet'}
                                                </span>
                                            </div>
                                            {note.content && (
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                    {note.content}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-slate-600 flex-shrink-0 mt-0.5">
                                            {new Date(note.updated_at).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Note Editor (right panel) */}
                {selectedNote ? (
                    <div className="flex-1 flex flex-col bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                        {/* Editor toolbar */}
                        <div className="flex items-center justify-between p-3 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                {/* Back button (mobile) */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedNote(null)}
                                    className="md:hidden text-slate-400"
                                >
                                    ← Vissza
                                </Button>
                                {/* Color picker */}
                                <div className="flex gap-1">
                                    {NOTE_COLORS.map(({ value }) => (
                                        <button
                                            key={value || 'none'}
                                            onClick={() => handleColorChange(selectedNote, value)}
                                            className={cn(
                                                'w-5 h-5 rounded-full border-2 transition-all hover:scale-110',
                                                selectedNote.color === value ? 'border-white scale-110' : 'border-transparent'
                                            )}
                                            style={{ backgroundColor: value || '#334155' }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleTogglePin(selectedNote)}
                                    className={cn(
                                        'text-slate-400 hover:text-white',
                                        selectedNote.is_pinned && 'text-indigo-400'
                                    )}
                                >
                                    {selectedNote.is_pinned ? <PinOff size={16} /> : <Pin size={16} />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowDeleteConfirm(selectedNote.id)}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>

                        {/* Editor */}
                        <div className="flex-1 flex flex-col p-4 overflow-hidden">
                            <input
                                value={editTitle}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                placeholder="Jegyzet címe..."
                                className="text-xl font-bold bg-transparent border-none text-slate-100 placeholder-slate-600 focus:outline-none mb-3 w-full"
                            />
                            <textarea
                                ref={contentRef}
                                value={editContent}
                                onChange={(e) => handleContentChange(e.target.value)}
                                placeholder="Írj ide bármit... gondolatok, ötletek, emlékeztetők..."
                                className="flex-1 bg-transparent border-none text-slate-300 text-sm placeholder-slate-600 focus:outline-none resize-none leading-relaxed"
                            />
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 border-t border-slate-800 text-xs text-slate-600 flex justify-between">
                            <span>Automatikus mentés</span>
                            <span>
                                {new Date(selectedNote.updated_at).toLocaleString('hu-HU')}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="hidden md:flex flex-1 items-center justify-center bg-slate-900/30 rounded-xl border border-slate-800/50">
                        <div className="text-center text-slate-600">
                            <StickyNote className="h-16 w-16 mx-auto mb-4 text-slate-800" />
                            <p className="text-lg font-medium">Válassz ki egy jegyzetet</p>
                            <p className="text-sm mt-1">vagy hozz létre egy újat</p>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                        <div className="bg-slate-800 rounded-lg p-6 max-w-md mx-4 shadow-2xl border border-slate-700">
                            <h3 className="text-lg font-semibold text-white mb-2">Jegyzet törlése?</h3>
                            <p className="text-slate-300 text-sm mb-6">
                                Ez a művelet nem visszavonható.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <Button variant="ghost" onClick={() => setShowDeleteConfirm(null)} className="text-slate-400 hover:text-white">
                                    Mégse
                                </Button>
                                <Button onClick={() => handleDelete(showDeleteConfirm)} className="bg-red-600 hover:bg-red-700 text-white">
                                    Törlés
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
