// Task Item Component - For lists
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { CheckCircle2, Circle, Clock, User, Paperclip, MessageSquare, AlertTriangle } from 'lucide-react';
import { format, isPast, startOfDay } from 'date-fns';
import { hu } from 'date-fns/locale/hu';

export interface TaskItemData {
    id: string;
    title: string;
    status: 'todo' | 'in_progress' | 'done';
    dueDate?: string | null;
    assigneeName?: string;
    priority?: 'low' | 'medium' | 'high';
    subtaskCount?: number;
    subtaskDone?: number;
    commentCount?: number;
    attachmentCount?: number;
    projectName?: string;
    projectColor?: string;
    workspaceName?: string; // ÚJ
    workspaceIcon?: string | null; // ÚJ
    workspaceColor?: string; // ÚJ
}

interface TaskItemProps {
    task: TaskItemData;
    onClick?: () => void;
    compact?: boolean;
}

const priorityColors = {
    low: 'bg-slate-700',
    medium: 'bg-amber-500',
    high: 'bg-red-500',
};

const statusIcons = {
    todo: Circle,
    in_progress: Clock,
    done: CheckCircle2,
};

export function TaskItem({ task, onClick, compact = false }: TaskItemProps) {
    const StatusIcon = statusIcons[task.status];
    const isDone = task.status === 'done';
    const isOverdue = !isDone && task.dueDate && isPast(startOfDay(new Date(task.dueDate))) && new Date(task.dueDate) < startOfDay(new Date());

    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full text-left rounded-xl border border-slate-800 bg-slate-900/60 p-4',
                'hover:border-indigo-500/50 hover:bg-slate-800/60 hover:shadow-lg hover:shadow-indigo-500/5',
                'transition-all duration-200 group',
                compact && 'p-3',
                isOverdue && 'border-red-500/40 bg-red-950/20'
            )}
        >
            <div className="flex items-start gap-3">
                {/* Status Icon */}
                <div className={cn(
                    'mt-0.5 transition-colors',
                    isDone ? 'text-emerald-500' : 'text-slate-500 group-hover:text-indigo-400'
                )}>
                    <StatusIcon size={18} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Title */}
                    <h4 className={cn(
                        'font-medium text-slate-200 truncate group-hover:text-slate-100',
                        isDone && 'line-through text-slate-500'
                    )}>
                        {task.title}
                    </h4>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {/* Workspace badge (ÚJ) */}
                        {task.workspaceName && (
                            <Badge
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1 border-slate-700 text-slate-300 hover:bg-slate-700"
                                style={{
                                    backgroundColor: task.workspaceColor ? `${task.workspaceColor}15` : 'rgb(30 41 59)',
                                    borderColor: task.workspaceColor || 'rgb(51 65 85)'
                                }}
                            >
                                {task.workspaceIcon ? (
                                    <span>{task.workspaceIcon}</span>
                                ) : (
                                    <span
                                        className="font-bold text-[10px] w-3 h-3 flex items-center justify-center rounded-sm text-white"
                                        style={{ backgroundColor: task.workspaceColor || '#6366F1' }}
                                    >
                                        {task.workspaceName[0].toUpperCase()}
                                    </span>
                                )}
                                {task.workspaceName}
                            </Badge>
                        )}

                        {/* Project badge */}
                        {task.projectName && (
                            <Badge variant="outline" size="sm" className="flex items-center gap-1">
                                <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: task.projectColor || '#6366F1' }}
                                />
                                {task.projectName}
                            </Badge>
                        )}

                        {/* Due date */}
                        {task.dueDate && (
                            <span className={cn(
                                'text-xs flex items-center gap-1',
                                isOverdue ? 'text-red-400 font-medium' : 'text-slate-500'
                            )}>
                                {isOverdue ? <AlertTriangle size={12} /> : <Clock size={12} />}
                                {format(new Date(task.dueDate), 'MMM d.', { locale: hu })}
                                {isOverdue && <span className="text-[10px]">(lejárt)</span>}
                            </span>
                        )}

                        {/* Assignee */}
                        {task.assigneeName && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                <User size={12} />
                                {task.assigneeName}
                            </span>
                        )}

                        {/* Subtasks */}
                        {task.subtaskCount && task.subtaskCount > 0 && (
                            <span className="text-xs text-slate-500">
                                ✓ {task.subtaskDone || 0}/{task.subtaskCount}
                            </span>
                        )}

                        {/* Comments */}
                        {task.commentCount && task.commentCount > 0 && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                <MessageSquare size={12} />
                                {task.commentCount}
                            </span>
                        )}

                        {/* Attachments */}
                        {task.attachmentCount && task.attachmentCount > 0 && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Paperclip size={12} />
                                {task.attachmentCount}
                            </span>
                        )}
                    </div>
                </div>

                {/* Priority indicator */}
                {task.priority && task.priority !== 'low' && (
                    <div className={cn(
                        'w-2 h-2 rounded-full',
                        priorityColors[task.priority]
                    )} />
                )}
            </div>
        </button>
    );
}
