// TaskCommentsTab - Comments tab for TaskModal (with database integration)
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Trash2 } from 'lucide-react';
import { createComment, deleteComment } from '@/lib/commentsService';
import { toast } from 'sonner';

export interface Comment {
    id: string;
    content: string;
    author_email: string | null;
    created_at: string;
}

interface TaskCommentsTabProps {
    taskId?: string;
    comments: Comment[];
    setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
}

export function TaskCommentsTab({ taskId, comments, setComments }: TaskCommentsTabProps) {
    const [newContent, setNewContent] = useState('');

    const handleAdd = async () => {
        if (!newContent.trim()) return;
        if (!taskId) {
            toast.error('Mentsd el előbb a feladatot!');
            return;
        }

        try {
            const newComment = await createComment({
                task_id: taskId,
                content: newContent.trim(),
            });
            setComments(prev => [...prev, newComment]);
            setNewContent('');
            toast.success('Komment hozzáadva');
        } catch (error) {
            console.error('Failed to create comment:', error);
            toast.error('Hiba a komment létrehozásakor');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteComment(id);
            setComments(prev => prev.filter(c => c.id !== id));
            toast.success('Komment törölve');
        } catch (error) {
            console.error('Failed to delete comment:', error);
            toast.error('Hiba a komment törlésekor');
        }
    };

    return (
        <div className="space-y-4">
            {/* Comment list */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {comments.length === 0 ? (
                    <p className="text-sm text-slate-500 italic text-center py-8">
                        Még nincs komment.
                    </p>
                ) : (
                    comments.map((c) => (
                        <div key={c.id} className="p-3 rounded-lg bg-slate-800/50 group">
                            <div className="flex justify-between items-baseline mb-2">
                                <span className="font-medium text-indigo-400 text-sm">
                                    {c.author_email || 'Felhasználó'}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">
                                        {new Date(c.created_at).toLocaleString('hu-HU')}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(c.id)}
                                        className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-slate-300 whitespace-pre-wrap">{c.content}</p>
                        </div>
                    ))
                )}
            </div>

            {/* Add comment */}
            <div className="flex gap-2 items-start">
                <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAdd();
                        }
                    }}
                    placeholder="Írj egy kommentet..."
                    className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px] resize-none"
                />
                <Button onClick={handleAdd} variant="primary">
                    Küldés
                </Button>
            </div>
        </div>
    );
}
