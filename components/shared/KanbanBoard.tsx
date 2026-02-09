// KanbanBoard Component - Drag and Drop enabled
'use client';

import { useMemo, useState } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { TaskItemData } from './TaskItem';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';

export interface KanbanBoardProps {
    tasks: TaskItemData[];
    onTaskClick?: (taskId: string) => void;
    onTaskMove?: (taskId: string, newStatus: string) => void;
}

const columns = [
    { id: 'todo', label: 'Teendő', color: 'border-amber-500', bgColor: 'bg-amber-500' },
    { id: 'in_progress', label: 'Folyamatban', color: 'border-sky-500', bgColor: 'bg-sky-500' },
    { id: 'done', label: 'Kész', color: 'border-emerald-500', bgColor: 'bg-emerald-500' },
];

export function KanbanBoard({ tasks, onTaskClick, onTaskMove }: KanbanBoardProps) {
    const [activeTask, setActiveTask] = useState<TaskItemData | null>(null);

    // Sensors for mouse, touch, and keyboard
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement before drag starts
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200, // 200ms hold before drag starts on touch
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Group tasks by status
    const tasksByStatus = useMemo(() => {
        const grouped: Record<string, TaskItemData[]> = {
            todo: [],
            in_progress: [],
            done: [],
        };

        tasks.forEach((task) => {
            const status = task.status || 'todo';
            if (grouped[status]) {
                grouped[status].push(task);
            }
        });

        return grouped;
    }, [tasks]);

    // Get task IDs for each column
    const getTaskIds = (status: string) => {
        return tasksByStatus[status]?.map((t) => t.id) || [];
    };

    // Handle drag start
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const task = tasks.find((t) => t.id === active.id);
        if (task) {
            setActiveTask(task);
        }
    };

    // Handle drag over (for visual feedback)
    const handleDragOver = (event: DragOverEvent) => {
        // Optional: Add visual feedback when dragging over columns
    };

    // Handle drag end
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const taskId = active.id as string;
        const overId = over.id as string;

        // Check if dropped over a column
        const targetColumn = columns.find((col) => col.id === overId);
        if (targetColumn) {
            onTaskMove?.(taskId, targetColumn.id);
            return;
        }

        // Check if dropped over another task
        const overTask = tasks.find((t) => t.id === overId);
        if (overTask && overTask.status) {
            onTaskMove?.(taskId, overTask.status);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="grid gap-4 md:gap-6 md:grid-cols-3 min-h-[500px]">
                {columns.map((column) => (
                    <KanbanColumn
                        key={column.id}
                        id={column.id}
                        title={column.label}
                        count={tasksByStatus[column.id]?.length || 0}
                        borderColor={column.color}
                        headerColor={column.bgColor}
                    >
                        <SortableContext
                            items={getTaskIds(column.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-3 min-h-[100px]">
                                {tasksByStatus[column.id]?.map((task) => (
                                    <KanbanCard
                                        key={task.id}
                                        task={task}
                                        onClick={() => onTaskClick?.(task.id)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </KanbanColumn>
                ))}
            </div>

            {/* Drag Overlay - Shows the dragged item */}
            <DragOverlay>
                {activeTask ? (
                    <div className="opacity-90 rotate-3 scale-105">
                        <KanbanCard task={activeTask} isDragging />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
