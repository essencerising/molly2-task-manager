// Contacts Page - Address book / CRM
'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { useWorkspaceStore } from '@/stores';
import {
    fetchContacts, createContact, updateContact, deleteContact,
    Contact, randomAvatarColor
} from '@/lib/contactsService';
import { toast } from 'sonner';
import {
    Plus, Search, Star, StarOff, Trash2, Mail, Phone, Building2,
    Briefcase, User, X, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ContactsPage() {
    const { currentWorkspaceId, initialize, isInitialized } = useWorkspaceStore();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', company: '', role: '', notes: ''
    });

    // Initialize workspace
    useEffect(() => {
        if (!isInitialized) initialize();
    }, [isInitialized, initialize]);

    // Load contacts
    useEffect(() => {
        async function load() {
            if (!currentWorkspaceId) { setLoading(false); return; }
            try {
                setLoading(true);
                const data = await fetchContacts(currentWorkspaceId);
                setContacts(data);
            } catch (error) {
                console.error('Failed to load contacts:', error);
                toast.error('Hiba a kapcsolatok betöltésekor');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [currentWorkspaceId]);

    const handleCreate = async () => {
        if (!currentWorkspaceId || !formData.name.trim()) {
            toast.error('A név megadása kötelező');
            return;
        }
        try {
            const newContact = await createContact({
                workspace_id: currentWorkspaceId,
                name: formData.name.trim(),
                email: formData.email || undefined,
                phone: formData.phone || undefined,
                company: formData.company || undefined,
                role: formData.role || undefined,
                notes: formData.notes || undefined,
            });
            setContacts(prev => [newContact, ...prev].sort((a, b) => {
                if (a.is_favorite && !b.is_favorite) return -1;
                if (!a.is_favorite && b.is_favorite) return 1;
                return a.name.localeCompare(b.name);
            }));
            setSelectedContact(newContact);
            setShowCreateModal(false);
            resetForm();
            toast.success('Kapcsolat létrehozva');
        } catch (error) {
            console.error('Failed to create contact:', error);
            toast.error('Hiba a kapcsolat létrehozásakor');
        }
    };

    const handleUpdate = async () => {
        if (!selectedContact || !formData.name.trim()) return;
        try {
            const updated = await updateContact({
                id: selectedContact.id,
                name: formData.name.trim(),
                email: formData.email || null,
                phone: formData.phone || null,
                company: formData.company || null,
                role: formData.role || null,
                notes: formData.notes,
            });
            setContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
            setSelectedContact(updated);
            setIsEditing(false);
            toast.success('Kapcsolat frissítve');
        } catch (error) {
            console.error('Failed to update contact:', error);
            toast.error('Hiba a frissítés során');
        }
    };

    const handleToggleFavorite = async (contact: Contact) => {
        try {
            const updated = await updateContact({ id: contact.id, is_favorite: !contact.is_favorite });
            setContacts(prev => prev.map(c => c.id === updated.id ? updated : c).sort((a, b) => {
                if (a.is_favorite && !b.is_favorite) return -1;
                if (!a.is_favorite && b.is_favorite) return 1;
                return a.name.localeCompare(b.name);
            }));
            if (selectedContact?.id === contact.id) setSelectedContact(updated);
            toast.success(updated.is_favorite ? 'Kedvencnek jelölve' : 'Kedvenc levéve');
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
        }
    };

    const handleDelete = async (contactId: string) => {
        try {
            await deleteContact(contactId);
            setContacts(prev => prev.filter(c => c.id !== contactId));
            if (selectedContact?.id === contactId) setSelectedContact(null);
            setShowDeleteConfirm(null);
            toast.success('Kapcsolat törölve');
        } catch (error) {
            console.error('Failed to delete contact:', error);
            toast.error('Hiba a törlés során');
        }
    };

    const handleSelectContact = (contact: Contact) => {
        setSelectedContact(contact);
        setIsEditing(false);
    };

    const startEditing = () => {
        if (!selectedContact) return;
        setFormData({
            name: selectedContact.name,
            email: selectedContact.email || '',
            phone: selectedContact.phone || '',
            company: selectedContact.company || '',
            role: selectedContact.role || '',
            notes: selectedContact.notes || '',
        });
        setIsEditing(true);
    };

    const resetForm = () => {
        setFormData({ name: '', email: '', phone: '', company: '', role: '', notes: '' });
    };

    const openCreateModal = () => {
        resetForm();
        setShowCreateModal(true);
    };

    // Filter contacts
    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Group by first letter
    const grouped = filteredContacts.reduce<Record<string, Contact[]>>((acc, c) => {
        // Favorites first as a special group
        if (c.is_favorite) {
            if (!acc['★']) acc['★'] = [];
            acc['★'].push(c);
        } else {
            const letter = c.name[0]?.toUpperCase() || '#';
            if (!acc[letter]) acc[letter] = [];
            acc[letter].push(c);
        }
        return acc;
    }, {});

    const sortedGroups = Object.entries(grouped).sort(([a], [b]) => {
        if (a === '★') return -1;
        if (b === '★') return 1;
        return a.localeCompare(b);
    });

    const getInitials = (name: string) => {
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

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
                {/* Contact List (left panel) */}
                <div className={cn(
                    'flex flex-col w-full md:w-80 lg:w-96 flex-shrink-0 bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden',
                    selectedContact && 'hidden md:flex'
                )}>
                    {/* Header */}
                    <div className="p-4 border-b border-slate-800">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-bold text-slate-100">👥 Kapcsolatok</h2>
                            <Button variant="primary" size="sm" onClick={openCreateModal}>
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
                                placeholder="Keresés név, email, cég..."
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <p className="text-[11px] text-slate-600 mt-2">{contacts.length} kapcsolat</p>
                    </div>

                    {/* Contact list */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {filteredContacts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full p-6">
                                <span className="text-4xl mb-3">👥</span>
                                <p className="text-sm font-medium text-slate-300 mb-1">
                                    {searchQuery ? 'Nincs találat' : 'Üres címjegyzék'}
                                </p>
                                <p className="text-xs text-slate-500 mb-3">
                                    {searchQuery ? `"${searchQuery}"` : 'Add hozzá az első kapcsolatot!'}
                                </p>
                                {!searchQuery && (
                                    <Button variant="primary" size="sm" onClick={openCreateModal}>
                                        <Plus size={14} className="mr-1" /> Első kapcsolat
                                    </Button>
                                )}
                            </div>
                        ) : (
                            sortedGroups.map(([letter, group]) => (
                                <div key={letter}>
                                    <div className="px-4 py-1.5 bg-slate-800/30 sticky top-0">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase">{letter === '★' ? '⭐ Kedvencek' : letter}</span>
                                    </div>
                                    {group.map((contact) => (
                                        <button
                                            key={contact.id}
                                            onClick={() => handleSelectContact(contact)}
                                            className={cn(
                                                'w-full text-left px-4 py-3 transition-colors flex items-center gap-3 group',
                                                selectedContact?.id === contact.id
                                                    ? 'bg-indigo-600/10 border-l-2 border-l-indigo-500'
                                                    : 'hover:bg-slate-800/50'
                                            )}
                                        >
                                            {/* Avatar */}
                                            <div
                                                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                                style={{ backgroundColor: contact.avatar_color || '#6366F1' }}
                                            >
                                                {getInitials(contact.name)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-200 truncate">{contact.name}</p>
                                                {contact.company && (
                                                    <p className="text-[11px] text-slate-500 truncate">{contact.company}{contact.role && ` · ${contact.role}`}</p>
                                                )}
                                            </div>
                                            <ChevronRight size={14} className="text-slate-700 group-hover:text-slate-500 flex-shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Contact Detail (right panel) */}
                {selectedContact ? (
                    <div className="flex-1 flex flex-col bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                        {/* Detail header */}
                        <div className="p-4 md:p-6 border-b border-slate-800">
                            <div className="flex items-start gap-4">
                                <Button variant="ghost" size="sm" onClick={() => setSelectedContact(null)} className="md:hidden text-slate-400 -ml-2">
                                    ← Vissza
                                </Button>
                                <div
                                    className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 hidden md:flex"
                                    style={{ backgroundColor: selectedContact.avatar_color || '#6366F1' }}
                                >
                                    {getInitials(selectedContact.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-xl font-bold text-slate-100">{selectedContact.name}</h2>
                                    {selectedContact.company && (
                                        <p className="text-sm text-slate-400 mt-0.5">
                                            {selectedContact.role && <span>{selectedContact.role} @ </span>}
                                            {selectedContact.company}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost" size="sm"
                                        onClick={() => handleToggleFavorite(selectedContact)}
                                        className={cn('text-slate-400', selectedContact.is_favorite && 'text-amber-400')}
                                    >
                                        {selectedContact.is_favorite ? <StarOff size={16} /> : <Star size={16} />}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(selectedContact.id)} className="text-red-400 hover:text-red-300">
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Detail content */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                            {isEditing ? (
                                /* Edit form */
                                <div className="space-y-3">
                                    <FormField icon={User} label="Név" value={formData.name} onChange={v => setFormData(f => ({ ...f, name: v }))} />
                                    <FormField icon={Mail} label="Email" value={formData.email} onChange={v => setFormData(f => ({ ...f, email: v }))} type="email" />
                                    <FormField icon={Phone} label="Telefon" value={formData.phone} onChange={v => setFormData(f => ({ ...f, phone: v }))} type="tel" />
                                    <FormField icon={Building2} label="Cég" value={formData.company} onChange={v => setFormData(f => ({ ...f, company: v }))} />
                                    <FormField icon={Briefcase} label="Pozíció" value={formData.role} onChange={v => setFormData(f => ({ ...f, role: v }))} />
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">Megjegyzés</label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
                                            rows={3}
                                            className="w-full rounded-lg border border-slate-700 bg-slate-800 text-slate-100 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <Button variant="primary" onClick={handleUpdate}>Mentés</Button>
                                        <Button variant="ghost" onClick={() => setIsEditing(false)} className="text-slate-400">Mégse</Button>
                                    </div>
                                </div>
                            ) : (
                                /* View mode */
                                <>
                                    {/* Quick actions */}
                                    <div className="flex gap-2 flex-wrap">
                                        {selectedContact.email && (
                                            <a href={`mailto:${selectedContact.email}`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-200 transition-colors">
                                                <Mail size={14} className="text-indigo-400" />
                                                {selectedContact.email}
                                            </a>
                                        )}
                                        {selectedContact.phone && (
                                            <a href={`tel:${selectedContact.phone}`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-200 transition-colors">
                                                <Phone size={14} className="text-emerald-400" />
                                                {selectedContact.phone}
                                            </a>
                                        )}
                                    </div>

                                    {/* Info cards */}
                                    <div className="space-y-2">
                                        {selectedContact.company && (
                                            <InfoRow icon={Building2} label="Cég" value={selectedContact.company} />
                                        )}
                                        {selectedContact.role && (
                                            <InfoRow icon={Briefcase} label="Pozíció" value={selectedContact.role} />
                                        )}
                                    </div>

                                    {/* Notes */}
                                    {selectedContact.notes && (
                                        <div className="mt-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                            <p className="text-xs text-slate-500 mb-1">Megjegyzés</p>
                                            <p className="text-sm text-slate-300 whitespace-pre-wrap">{selectedContact.notes}</p>
                                        </div>
                                    )}

                                    <Button variant="secondary" onClick={startEditing} className="mt-4">
                                        Szerkesztés
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 border-t border-slate-800 text-xs text-slate-600 flex justify-between">
                            <span>Hozzáadva: {new Date(selectedContact.created_at).toLocaleDateString('hu-HU')}</span>
                            <span>Frissítve: {new Date(selectedContact.updated_at).toLocaleDateString('hu-HU')}</span>
                        </div>
                    </div>
                ) : (
                    <div className="hidden md:flex flex-1 items-center justify-center bg-slate-900/30 rounded-xl border border-slate-800/50">
                        <div className="text-center text-slate-600">
                            <span className="text-5xl block mb-4">👤</span>
                            <p className="text-lg font-medium">Válassz ki egy kapcsolatot</p>
                            <p className="text-sm mt-1">vagy hozz létre egy újat</p>
                        </div>
                    </div>
                )}

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                        <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-slate-700">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">Új kapcsolat</h3>
                                <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)} className="text-slate-400">
                                    <X size={18} />
                                </Button>
                            </div>
                            <div className="space-y-3">
                                <FormField icon={User} label="Név *" value={formData.name} onChange={v => setFormData(f => ({ ...f, name: v }))} autoFocus />
                                <FormField icon={Mail} label="Email" value={formData.email} onChange={v => setFormData(f => ({ ...f, email: v }))} type="email" />
                                <FormField icon={Phone} label="Telefon" value={formData.phone} onChange={v => setFormData(f => ({ ...f, phone: v }))} type="tel" />
                                <FormField icon={Building2} label="Cég" value={formData.company} onChange={v => setFormData(f => ({ ...f, company: v }))} />
                                <FormField icon={Briefcase} label="Pozíció" value={formData.role} onChange={v => setFormData(f => ({ ...f, role: v }))} />
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <Button variant="ghost" onClick={() => setShowCreateModal(false)} className="text-slate-400">
                                    Mégse
                                </Button>
                                <Button variant="primary" onClick={handleCreate} disabled={!formData.name.trim()}>
                                    Létrehozás
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                        <div className="bg-slate-800 rounded-lg p-6 max-w-md mx-4 shadow-2xl border border-slate-700">
                            <h3 className="text-lg font-semibold text-white mb-2">Kapcsolat törlése?</h3>
                            <p className="text-slate-300 text-sm mb-6">Ez a művelet nem visszavonható.</p>
                            <div className="flex gap-3 justify-end">
                                <Button variant="ghost" onClick={() => setShowDeleteConfirm(null)} className="text-slate-400 hover:text-white">Mégse</Button>
                                <Button onClick={() => handleDelete(showDeleteConfirm)} className="bg-red-600 hover:bg-red-700 text-white">Törlés</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

// Helper components
function FormField({ icon: Icon, label, value, onChange, type = 'text', autoFocus }: {
    icon: any; label: string; value: string; onChange: (v: string) => void; type?: string; autoFocus?: boolean;
}) {
    return (
        <div>
            <label className="text-xs text-slate-500 mb-1 block">{label}</label>
            <div className="relative">
                <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    autoFocus={autoFocus}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/30">
            <Icon size={14} className="text-slate-500 flex-shrink-0" />
            <div>
                <p className="text-[11px] text-slate-500">{label}</p>
                <p className="text-sm text-slate-200">{value}</p>
            </div>
        </div>
    );
}
