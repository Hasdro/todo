'use client';

import React, { useState, useMemo, useSyncExternalStore } from 'react';
import { Check, Trash2, Plus } from 'lucide-react';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

type FilterType = 'all' | 'active' | 'completed';

const STORAGE_KEY = 'minimal_todo_tasks';

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
  const [filter, setFilter] = useState<FilterType>('all');

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

    const newTodo: Todo = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
    };

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
  };

  const completedCount = todos.filter((t) => t.completed).length;

  const filteredTodos = todos.filter((todo) => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      {/* Main Container Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden transition-all">
        {/* Input Form */}
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
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </form>

        {/* Filter Bar */}
        <div className="px-5 py-3 bg-zinc-50/70 dark:bg-zinc-900/60 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            {(['all', 'active', 'completed'] as FilterType[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                  filter === tab
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {completedCount > 0 && (
            <button
              type="button"
              onClick={clearCompleted}
              className="text-xs text-zinc-500 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors cursor-pointer"
            >
              Clear completed
            </button>
          )}
        </div>

        {/* Todo List */}
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 min-h-[380px] max-h-[600px] overflow-y-auto">
          {filteredTodos.length > 0 && (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filteredTodos.map((todo) => (
                <li
                  key={todo.id}
                  className="group flex items-center justify-between p-4 sm:p-5 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <label className="flex items-center gap-3.5 cursor-pointer flex-1 min-w-0 pr-3">
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

                  <button
                    type="button"
                    onClick={() => deleteTodo(todo.id)}
                    aria-label={`delete "${todo.text}"`}
                    className="opacity-70 group-hover:opacity-100 p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
