// TaskDetailsTab - Details tab for TaskModal
'use client';

import { Input } from '@/components/ui';
import { Calendar, User, Repeat, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskDetailsTabProps {
    title: string;
    setTitle: (v: string) => void;
    description: string;
    setDescription: (v: string) => void;
    status: 'todo' | 'in_progress' | 'done';
    setStatus: (v: 'todo' | 'in_progress' | 'done') => void;
    dueDate: string;
    setDueDate: (v: string) => void;
    followUpDate: string;
    setFollowUpDate: (v: string) => void;
    recurrenceType: 'none' | 'daily' | 'weekly' | 'monthly' | undefined;
    setRecurrenceType: (v: any) => void;
    recurrenceInterval: number;
    setRecurrenceInterval: (v: number) => void;
    projectId: string;
    setProjectId: (v: string) => void;
    workspaceProjects: Array<{ id: string; name: string; icon?: string | null }>;
    contactId: string;
    setContactId: (v: string) => void;
    workspaceContacts: Array<{ id: string; name: string; avatar_color: string | null }>;
}

const statusOptions = [
    { value: 'todo', label: 'Teendő', color: 'bg-amber-600' },
    { value: 'in_progress', label: 'Folyamatban', color: 'bg-sky-600' },
    { value: 'done', label: 'Kész', color: 'bg-emerald-600' },
];

const recurrenceOptions = [
    { value: 'none', label: 'Nincs ismétlődés' },
    { value: 'daily', label: 'Naponta' },
    { value: 'weekly', label: 'Hetente' },
    { value: 'monthly', label: 'Havonta' },
    { value: 'yearly', label: 'Évente' },
];

export function TaskDetailsTab({
    title, setTitle,
    description, setDescription,
    status, setStatus,
    dueDate, setDueDate,
    followUpDate, setFollowUpDate,
    recurrenceType, setRecurrenceType,
    recurrenceInterval, setRecurrenceInterval,
    projectId, setProjectId,
    workspaceProjects,
    contactId, setContactId,
    workspaceContacts,
}: TaskDetailsTabProps) {
    return (
        <div className="space-y-5">
            {/* Title */}
            <Input
                label="Cím"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Mi a feladat?"
            />

            {/* Description */}
            <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">Leírás</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Részletek, megjegyzések..."
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px] resize-none"
                />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">Státusz</label>
                <div className="flex gap-2">
                    {statusOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setStatus(opt.value as 'todo' | 'in_progress' | 'done')}
                            className={cn(
                                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                status === opt.value
                                    ? `${opt.color} text-white shadow-lg`
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Project Selector */}
            <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300 flex items-center gap-2">
                    <FolderKanban size={14} />
                    Projekt
                </label>
                <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">Nincs projekt</option>
                    {workspaceProjects.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.icon ? `${p.icon} ` : ''}{p.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Contact Selector (CRM) */}
            <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300 flex items-center gap-2">
                    <User size={14} />
                    Kapcsolat (Ügyfél/Partner)
                </label>
                <select
                    value={contactId}
                    onChange={(e) => setContactId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">Nincs kapcsolat kiválasztva</option>
                    {workspaceContacts.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Dates Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-300 flex items-center gap-2">
                        <Calendar size={14} />
                        Határidő
                    </label>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        style={{ colorScheme: 'dark' }}
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-300 flex items-center gap-2">
                        <User size={14} />
                        Follow-up
                    </label>
                    <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        style={{ colorScheme: 'dark' }}
                    />
                </div>
            </div>

            {/* Recurrence */}
            <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Repeat size={14} />
                    Ismétlődés
                </label>
                <div className="flex gap-2 items-center">
                    <select
                        value={recurrenceType}
                        onChange={(e) => setRecurrenceType(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {recurrenceOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>

                    {recurrenceType && recurrenceType !== 'none' && (
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <span>Minden</span>
                            <input
                                type="number"
                                min={1}
                                value={recurrenceInterval}
                                onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                                className="w-16 px-2 py-1 rounded border border-slate-700 bg-slate-900 text-slate-100 text-center"
                            />
                            <span>
                                {recurrenceType === 'daily' ? 'nap' :
                                    recurrenceType === 'weekly' ? 'hét' :
                                        recurrenceType === 'monthly' ? 'hónap' : 'év'}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
