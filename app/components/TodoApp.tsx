'use client';

import React, { useState, useMemo, useSyncExternalStore } from 'react';
import { Check, Trash2, GripVertical } from 'lucide-react';
import MascotCharacter from './MascotCharacter';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface TodoStorageEnvelope {
  todos: Todo[];
  updatedAt: number;
}

export const STORAGE_KEY = 'minimal_todo_tasks';
export const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours cache

export function createTodoItem(text: string): Todo {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  return {
    id,
    text,
    completed: false,
    createdAt: Date.now(),
  };
}

export function parseStoredTodos(raw: string | null, now: number = Date.now()): Todo[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);

    // Stored as envelope { todos, updatedAt }
    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      Array.isArray(parsed.todos)
    ) {
      const updatedAt = typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0;
      if (now - updatedAt > CACHE_TTL_MS) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {}
        }
        return [];
      }
      return parsed.todos;
    }

    // Backwards-compatible legacy raw array
    if (Array.isArray(parsed)) {
      const latestTaskTime = parsed.reduce((max: number, item: Todo) => {
        return Math.max(max, typeof item.createdAt === 'number' ? item.createdAt : 0);
      }, 0);

      if (latestTaskTime > 0 && now - latestTaskTime > CACHE_TTL_MS) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {}
        }
        return [];
      }
      return parsed;
    }

    return [];
  } catch {
    return [];
  }
}

let cachedRaw: string | null = null;
let cachedResult = '[]';
let lastCheckTime = 0;

export const todosStore = {
  getSnapshot: (): string => {
    if (typeof window === 'undefined') return '[]';
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cachedRaw = null;
      cachedResult = '[]';
      return '[]';
    }
    const now = Date.now();
    if (raw === cachedRaw && now - lastCheckTime < 60000) {
      return cachedResult;
    }
    cachedRaw = raw;
    lastCheckTime = now;
    const validTodos = parseStoredTodos(raw, now);
    cachedResult = JSON.stringify(validTodos);
    return cachedResult;
  },
  getServerSnapshot: (): string => {
    return '[]';
  },
  subscribe: (callback: () => void) => {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener('storage', callback);
    window.addEventListener('todos-updated', callback);
    return () => {
      window.removeEventListener('storage', callback);
      window.removeEventListener('todos-updated', callback);
    };
  },
  save: (todos: Todo[]) => {
    if (typeof window === 'undefined') return;
    const now = Date.now();
    const envelope: TodoStorageEnvelope = {
      todos,
      updatedAt: now,
    };
    const serialized = JSON.stringify(envelope);
    try {
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (e) {
      console.error('Failed to save todos to localStorage', e);
    }
    cachedRaw = serialized;
    lastCheckTime = now;
    cachedResult = JSON.stringify(todos);
    window.dispatchEvent(new Event('todos-updated'));
  },
};

export default function TodoApp() {
  const [inputText, setInputText] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const rawTodos = useSyncExternalStore(
    todosStore.subscribe,
    todosStore.getSnapshot,
    todosStore.getServerSnapshot
  );

  const todos = useMemo<Todo[]>(() => {
    try {
      const parsed = JSON.parse(rawTodos);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [rawTodos]);

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;

  // Viewing completed only if toggled on and completed tasks exist
  const isViewingCompleted = showCompleted && completedCount > 0;

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const newTodo = createTodoItem(trimmed);
    // Put new item at the top
    todosStore.save([newTodo, ...todos]);
    setInputText('');
  };

  const toggleTodo = (id: string) => {
    const updated = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    todosStore.save(updated);
  };

  const deleteTodo = (id: string) => {
    const updated = todos.filter((todo) => todo.id !== id);
    todosStore.save(updated);
  };

  const clearAllActive = () => {
    const updated = todos.filter((todo) => todo.completed);
    todosStore.save(updated);
  };

  const clearCompleted = () => {
    const updated = todos.filter((todo) => !todo.completed);
    todosStore.save(updated);
    setShowCompleted(false);
  };

  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      if (isViewingCompleted) return todo.completed;
      return !todo.completed;
    });
  }, [todos, isViewingCompleted]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const sourceIndex = todos.findIndex((t) => t.id === draggedId);
    const targetIndex = todos.findIndex((t) => t.id === targetId);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      const updated = [...todos];
      const [moved] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, moved);
      todosStore.save(updated);
    }

    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      {/* Main Container Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden transition-all">
        {/* Input Form with Mascot Companion (Enter to add; no separate Add button) */}
        <form
          onSubmit={handleAddTodo}
          className="p-3.5 sm:p-4.5 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-3"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Add a task and press Enter..."
            aria-label="New task"
            className="flex-1 bg-transparent px-3 py-2 text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
            autoFocus
          />

          {/* Ghost Companion beside Input (hands removed, attentively tracking cursor) */}
          <div className="shrink-0 flex items-center justify-center -my-2.5 pr-1">
            <MascotCharacter />
          </div>
        </form>

        {/* Filter / Actions Bar - only rendered if tasks exist */}
        {todos.length > 0 && (
          <div className="px-4 sm:px-5 py-2.5 bg-zinc-50/70 dark:bg-zinc-900/60 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 min-h-[44px]">
            {/* Left side: Completed toggle (only shown when completed tasks exist; no Active button) */}
            <div className="flex items-center">
              {completedCount > 0 && (
                <button
                  type="button"
                  aria-pressed={isViewingCompleted}
                  onClick={() => setShowCompleted((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isViewingCompleted
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs border border-zinc-200/80 dark:border-zinc-700'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70'
                  }`}
                >
                  <span>Completed</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-600 dark:text-zinc-300">
                    {completedCount}
                  </span>
                </button>
              )}
            </div>

            {/* Right side: Clear actions */}
            <div className="flex items-center">
              {/* When viewing active tasks: button to remove all active items once if any active item exists */}
              {!isViewingCompleted && activeCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllActive}
                  aria-label="Clear all active tasks"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/60 border border-red-200 dark:border-red-900/50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear all ({activeCount})</span>
                </button>
              )}

              {/* When viewing completed tasks: button to clear completed tasks */}
              {isViewingCompleted && completedCount > 0 && (
                <button
                  type="button"
                  onClick={clearCompleted}
                  aria-label="Clear completed tasks"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/60 border border-red-200 dark:border-red-900/50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear completed ({completedCount})</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Todo List with Drag & Drop Reordering and Compact Spacing */}
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 min-h-[380px] max-h-[600px] overflow-y-auto">
          {filteredTodos.length > 0 ? (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filteredTodos.map((todo) => {
                const isDragging = draggedId === todo.id;
                const isDragOver = dragOverId === todo.id && draggedId !== todo.id;

                return (
                  <li
                    key={todo.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, todo.id)}
                    onDragOver={(e) => handleDragOver(e, todo.id)}
                    onDrop={(e) => handleDrop(e, todo.id)}
                    onDragEnd={handleDragEnd}
                    className={`group flex items-center justify-between py-2.5 px-4 sm:py-3 sm:px-5 transition-all select-none ${
                      isDragging
                        ? 'opacity-35 bg-zinc-100 dark:bg-zinc-800/80 scale-[0.99]'
                        : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40'
                    } ${
                      isDragOver
                        ? 'border-t-2 border-blue-500 bg-blue-50/20 dark:bg-blue-950/20'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 pr-3">
                      {/* Drag Grip Handle */}
                      <div
                        className="text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 cursor-grab active:cursor-grabbing p-1 -ml-1 transition-colors"
                        title="Drag to reorder"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>

                      {/* Custom Checkbox */}
                      <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => toggleTodo(todo.id)}
                          className="sr-only"
                          aria-label={`mark "${todo.text}" as ${
                            todo.completed ? 'incomplete' : 'complete'
                          }`}
                        />
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                            todo.completed
                              ? 'bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500'
                              : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400'
                          }`}
                        >
                          {todo.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span
                          className={`text-sm sm:text-base truncate select-none transition-all ${
                            todo.completed
                              ? 'line-through text-zinc-400 dark:text-zinc-500'
                              : 'text-zinc-800 dark:text-zinc-200'
                          }`}
                        >
                          {todo.text}
                        </span>
                      </label>
                    </div>

                    {/* Delete button - only shown when hovering over item row */}
                    <button
                      type="button"
                      onClick={() => deleteTodo(todo.id)}
                      aria-label={`delete "${todo.text}"`}
                      className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 p-1.5 sm:p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : todos.length > 0 ? (
            <div className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
              {isViewingCompleted ? 'No completed tasks' : 'No active tasks'}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
