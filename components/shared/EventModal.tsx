// EventModal Component
'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalFooter, Button, Input } from '@/components/ui';
import { toast } from 'sonner';
import { Calendar, Clock, MapPin, AlignLeft, Trash2 } from 'lucide-react';
import { CreateEventInput, CalendarEvent } from '@/lib/eventsService';
import { useWorkspaceStore } from '@/stores';

interface EventModalProps {
    event: CalendarEvent | null; // If null, creating new event
    isOpen: boolean;
    onClose: () => void;
    onSave: (eventData: any) => Promise<void>; // Type depends on create vs update
    onDelete?: (eventId: string) => Promise<void>;
    initialDate?: Date | null;
}

export function EventModal({ event, isOpen, onClose, onSave, onDelete, initialDate }: EventModalProps) {
    const currentWorkspaceId = useWorkspaceStore(state => state.currentWorkspaceId);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [isAllDay, setIsAllDay] = useState(false);

    // Dates
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('10:00');

    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Initialize state
    useEffect(() => {
        if (!isOpen) return;

        if (event) {
            // Editing existing event
            setTitle(event.title);
            setDescription(event.description || '');
            setLocation(event.location || '');
            setIsAllDay(event.is_all_day);

            const start = new Date(event.start_time);
            const end = new Date(event.end_time);

            setStartDate(start.toISOString().split('T')[0]);
            setStartTime(start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            setEndDate(end.toISOString().split('T')[0]);
            setEndTime(end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } else {
            // New event
            setTitle('');
            setDescription('');
            setLocation('');
            setIsAllDay(false);

            const now = initialDate || new Date();
            setStartDate(now.toISOString().split('T')[0]);
            setEndDate(now.toISOString().split('T')[0]);
            // Default time: next hour
            const nextHour = new Date(now);
            nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
            setStartTime(nextHour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

            const end = new Date(nextHour);
            end.setHours(end.getHours() + 1);
            setEndTime(end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
        setShowDeleteConfirm(false);
    }, [isOpen, event, initialDate]);

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error('Kérlek add meg az esemény címét!');
            return;
        }

        if (!currentWorkspaceId) return;

        setIsSaving(true);
        try {
            // Construct ISO strings
            const startDateTime = new Date(`${startDate}T${isAllDay ? '00:00:00' : startTime}`);
            const endDateTime = new Date(`${endDate}T${isAllDay ? '23:59:59' : endTime}`);

            if (endDateTime < startDateTime) {
                toast.error('A befejezés nem lehet korábban, mint a kezdés!');
                setIsSaving(false);
                return;
            }

            const payload = {
                id: event?.id,
                title,
                description: description || null,
                location: location || null,
                isAllDay,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                workspaceId: currentWorkspaceId
            };

            await onSave(payload);
            onClose();
        } catch (error) {
            console.error('Save failed', error);
            toast.error('Hiba a mentés során');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!event?.id || !onDelete) return;
        try {
            await onDelete(event.id);
            onClose();
        } catch (error) {
            // Toast handled by parent
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={event ? 'Esemény szerkesztése' : 'Új esemény'}
            size="md"
        >
            <div className="space-y-4 text-slate-100">
                {/* Title */}
                <Input
                    label="Esemény címe"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Pl. Ebéd az ügyféllel"
                    autoFocus
                />

                {/* All Day Toggle */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="isAllDay"
                        checked={isAllDay}
                        onChange={(e) => setIsAllDay(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="isAllDay" className="text-sm text-slate-300 select-none cursor-pointer">Egész napos</label>
                </div>

                {/* Date & Time */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400 uppercase">Kezdés</label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="flex-1 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                style={{ colorScheme: 'dark' }}
                            />
                            {!isAllDay && (
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-24 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    style={{ colorScheme: 'dark' }}
                                />
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400 uppercase">Befejezés</label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="flex-1 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                style={{ colorScheme: 'dark' }}
                            />
                            {!isAllDay && (
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-24 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    style={{ colorScheme: 'dark' }}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-300 flex items-center gap-2">
                        <MapPin size={14} />
                        Helyszín
                    </label>
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Pl. Iroda, Zoom"
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-300 flex items-center gap-2">
                        <AlignLeft size={14} />
                        Megjegyzés
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Részletek..."
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[80px] resize-none"
                    />
                </div>
            </div>

            <ModalFooter>
                {event && onDelete && (
                    <div className="mr-auto relative">
                        {showDeleteConfirm ? (
                            <div className="absolute bottom-full left-0 mb-2 w-max bg-red-950/90 border border-red-800 text-red-200 p-2 rounded-lg text-xs shadow-xl animate-in fade-in zoom-in-95">
                                <p className="mb-2 font-semibold">Biztosan törlöd?</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDelete}
                                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors"
                                    >
                                        Igen, törlés
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition-colors"
                                    >
                                        Mégse
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <Button
                                variant="ghost"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                            >
                                <Trash2 size={16} className="mr-2" />
                                Törlés
                            </Button>
                        )}
                    </div>
                )}

                <Button variant="secondary" onClick={onClose}>Mégse</Button>
                <Button variant="primary" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Mentés...' : 'Mentés'}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
