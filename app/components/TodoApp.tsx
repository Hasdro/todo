'use client';

import React, { useState, useMemo, useSyncExternalStore } from 'react';
import { Check, Trash2, Plus, GripVertical } from 'lucide-react';
import MascotCharacter from './MascotCharacter';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

type FilterType = 'active' | 'completed';

const STORAGE_KEY = 'minimal_todo_tasks';

function createTodoItem(text: string): Todo {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  return {
    id,
    text,
    completed: false,
    createdAt: Date.now(),
  };
}

const todosStore = {
  getSnapshot: (): string => {
    if (typeof window === 'undefined') return '[]';
    return localStorage.getItem(STORAGE_KEY) || '[]';
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (e) {
      console.error('Failed to save todos to localStorage', e);
    }
    window.dispatchEvent(new Event('todos-updated'));
  },
};

export default function TodoApp() {
  const [inputText, setInputText] = useState('');
  const [filter, setFilter] = useState<FilterType>('active');

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

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const newTodo = createTodoItem(trimmed);
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

  const clearCompleted = () => {
    const updated = todos.filter((todo) => !todo.completed);
    todosStore.save(updated);
    setFilter('active');
  };

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;

  // Available tabs: only show 'active' if activeCount > 0, and 'completed' if completedCount > 0
  const availableTabs: FilterType[] = useMemo(() => {
    const tabs: FilterType[] = [];
    if (activeCount > 0) tabs.push('active');
    if (completedCount > 0) tabs.push('completed');
    return tabs;
  }, [activeCount, completedCount]);

  // Derived effective filter based on available counts
  const activeFilter: FilterType = useMemo(() => {
    if (filter === 'completed') {
      return completedCount > 0 ? 'completed' : 'active';
    }
    if (filter === 'active') {
      return activeCount > 0 ? 'active' : (completedCount > 0 ? 'completed' : 'active');
    }
    return 'active';
  }, [filter, activeCount, completedCount]);

  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      if (activeFilter === 'completed') return todo.completed;
      return !todo.completed;
    });
  }, [todos, activeFilter]);

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
        {/* Input Form with Mascot Companion */}
        <form
          onSubmit={handleAddTodo}
          className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800/80 flex gap-3 items-center"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            aria-label="New task"
            className="flex-1 bg-transparent px-3 py-2 text-base text-zinc-900 dark:text-zinc-100 focus:outline-none"
            autoFocus
          />

          {/* Ghost Companion beside Add Button */}
          <div className="shrink-0 flex items-center justify-center -my-3 mr-1.5">
            <MascotCharacter />
          </div>

          {/* White-ish Modern Add Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-100 border border-zinc-200/90 dark:border-zinc-700 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.2]" />
            <span>Add</span>
          </button>
        </form>

        {/* Filter Bar - only rendered if there is at least one active or completed tab */}
        {availableTabs.length > 0 && (
          <div className="px-5 py-3 bg-zinc-50/70 dark:bg-zinc-900/60 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              {availableTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                    activeFilter === tab
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Clear Completed Button - specifically displayed when Completed tab is selected */}
            {activeFilter === 'completed' && completedCount > 0 && (
              <button
                type="button"
                onClick={clearCompleted}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/60 border border-red-200 dark:border-red-900/50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear completed ({completedCount})</span>
              </button>
            )}
          </div>
        )}

        {/* Todo List with Drag & Drop Reordering */}
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 min-h-[380px] max-h-[600px] overflow-y-auto">
          {filteredTodos.length > 0 && (
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
                    className={`group flex items-center justify-between p-4 sm:p-5 transition-all select-none ${
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
                      <label className="flex items-center gap-3.5 cursor-pointer flex-1 min-w-0">
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
                          className={`text-base truncate select-none transition-all ${
                            todo.completed
                              ? 'line-through text-zinc-400 dark:text-zinc-500'
                              : 'text-zinc-800 dark:text-zinc-200'
                          }`}
                        >
                          {todo.text}
                        </span>
                      </label>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => deleteTodo(todo.id)}
                      aria-label={`delete "${todo.text}"`}
                      className="opacity-70 group-hover:opacity-100 p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
