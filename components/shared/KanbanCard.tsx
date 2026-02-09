// KanbanCard Component - Draggable task card
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { Clock, User, MessageSquare, CheckSquare, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale/hu';
import { TaskItemData } from './TaskItem';

interface KanbanCardProps {
    task: TaskItemData;
    onClick?: () => void;
    isDragging?: boolean;
}

export function KanbanCard({ task, onClick, isDragging }: KanbanCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const isBeingDragged = isDragging || isSortableDragging;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'group rounded-xl border border-slate-800 bg-slate-900/80 p-3 cursor-pointer',
                'hover:border-indigo-500/50 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-indigo-500/5',
                'transition-all duration-200 touch-manipulation',
                isBeingDragged && 'opacity-50 shadow-2xl border-indigo-500 bg-slate-800'
            )}
            onClick={onClick}
        >
            <div className="flex items-start gap-2">
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="mt-0.5 p-1 -ml-1 rounded text-slate-600 hover:text-slate-400 hover:bg-slate-800 cursor-grab active:cursor-grabbing touch-none"
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical size={14} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Title */}
                    <h4 className="font-medium text-slate-200 text-sm mb-2 line-clamp-2 group-hover:text-slate-100">
                        {task.title}
                    </h4>

                    {/* Meta */}
                    <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                        {/* Workspace (ÚJ) */}
                        {task.workspaceName && (
                            <Badge
                                variant="outline"
                                size="sm"
                                className="text-[10px] flex items-center gap-1"
                                style={{
                                    backgroundColor: task.workspaceColor ? `${task.workspaceColor}15` : 'rgb(30 41 59)',
                                    borderColor: task.workspaceColor || 'rgb(51 65 85)'
                                }}
                            >
                                {task.workspaceIcon ? (
                                    <span className="text-[10px]">{task.workspaceIcon}</span>
                                ) : (
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: task.workspaceColor || '#6366F1' }}
                                    />
                                )}
                                {task.workspaceName}
                            </Badge>
                        )}

                        {/* Project */}
                        {task.projectName && (
                            <Badge variant="outline" size="sm" className="text-[10px]">
                                <span
                                    className="w-1.5 h-1.5 rounded-full mr-1"
                                    style={{ backgroundColor: task.projectColor || '#6366F1' }}
                                />
                                {task.projectName}
                            </Badge>
                        )}

                        {/* Due date */}
                        {task.dueDate && (
                            <span className="flex items-center gap-1">
                                <Clock size={10} />
                                {format(new Date(task.dueDate), 'd. MMM', { locale: hu })}
                            </span>
                        )}

                        {/* Assignee */}
                        {task.assigneeName && (
                            <span className="flex items-center gap-1">
                                <User size={10} />
                                {task.assigneeName}
                            </span>
                        )}

                        {/* Subtasks */}
                        {task.subtaskCount && task.subtaskCount > 0 && (
                            <span className="flex items-center gap-1">
                                <CheckSquare size={10} />
                                {task.subtaskDone || 0}/{task.subtaskCount}
                            </span>
                        )}

                        {/* Comments */}
                        {task.commentCount && task.commentCount > 0 && (
                            <span className="flex items-center gap-1">
                                <MessageSquare size={10} />
                                {task.commentCount}
                            </span>
                        )}
                    </div>
                </div>

                {/* Priority indicator */}
                {task.priority && task.priority !== 'low' && (
                    <div
                        className={cn(
                            'w-2 h-2 rounded-full flex-shrink-0',
                            task.priority === 'high' ? 'bg-red-500' : 'bg-amber-500'
                        )}
                    />
                )}
            </div>
        </div>
    );
}
