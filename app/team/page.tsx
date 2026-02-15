'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Input, Modal } from '@/components/ui';
import { useWorkspaceStore } from '@/stores';
import { fetchPeople } from '@/lib/peopleService';
import type { Person } from '@/types/people';
import { inviteMember } from '@/lib/workspaceService';
import { Plus, User, Mail, Shield, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function TeamPage() {
    const currentWorkspaceId = useWorkspaceStore(state => state.currentWorkspaceId);
    const [people, setPeople] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    // Invite form state
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);

    useEffect(() => {
        if (currentWorkspaceId) {
            loadPeople();
        }
    }, [currentWorkspaceId]);

    const loadPeople = async () => {
        setLoading(true);
        try {
            if (currentWorkspaceId) {
                const data = await fetchPeople(currentWorkspaceId);
                setPeople(data);
            }
        } catch (error) {
            console.error('Failed to load people:', error);
            toast.error('Nem sikerült betölteni a csapatot');
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentWorkspaceId || !inviteEmail) return;

        setIsInviting(true);
        try {
            const result = await inviteMember(currentWorkspaceId, inviteEmail);

            if (result.success) {
                toast.success(result.message);
                setInviteEmail('');
                setIsInviteModalOpen(false);
                loadPeople(); // Reload list
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('Invite error:', error);
            toast.error('Hiba történt a meghívás során');
        } finally {
            setIsInviting(false);
        }
    };

    return (
        <DashboardLayout
            title="Csapat kezelése"
            subtitle="Munkatársak és jogosultságok"
        >
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header Actions */}
                <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-100">Munkatársak ({people.length})</h2>
                        <p className="text-sm text-slate-400">A projektekhez és feladatokhoz rendelhető személyek</p>
                    </div>
                    <Button onClick={() => setIsInviteModalOpen(true)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Új munkatárs
                    </Button>
                </div>

                {/* Members List */}
                <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-slate-400">Betöltés...</div>
                    ) : people.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Még nincsenek munkatársak.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-800">
                            {people.map(person => (
                                <div key={person.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold border border-indigo-500/30">
                                            {person.avatar_url ? (
                                                <img src={person.avatar_url} alt={person.name} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                person.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-200">{person.name}</div>
                                            <div className="text-sm text-slate-400 flex items-center gap-1">
                                                <Mail className="w-3 h-3" /> {person.email}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="px-2.5 py-1 rounded-full bg-slate-800 text-xs font-medium text-slate-300 border border-slate-700 flex items-center gap-1">
                                            <Shield className="w-3 h-3" />
                                            {person.role === 'owner' ? 'Tulajdonos' :
                                                person.role === 'admin' ? 'Adminisztrátor' : 'Tag'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Invite Modal */}
            <Modal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                title="Munkatárs hozzáadása"
            >
                <form onSubmit={handleInvite} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Email cím</label>
                        <Input
                            type="email"
                            placeholder="pelda@email.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            required
                        />
                        <p className="text-xs text-slate-500">
                            Csak olyan felhasználót tudsz hozzáadni, aki már regisztrált a rendszerbe ezzel az email címmel.
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsInviteModalOpen(false)}
                            disabled={isInviting}
                        >
                            Mégse
                        </Button>
                        <Button
                            type="submit"
                            disabled={isInviting || !inviteEmail}
                        >
                            {isInviting ? 'Hozzáadás...' : 'Hozzáadás'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
