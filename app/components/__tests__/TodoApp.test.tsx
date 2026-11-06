import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import TodoApp, {
  CACHE_TTL_MS,
  parseStoredTodos,
  createTodoItem,
} from '../TodoApp';

describe('TodoApp', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders input and mascot without Add button or any tabs when no tasks exist', () => {
    render(<TodoApp />);
    const input = screen.getByRole('textbox', { name: /new task/i });
    expect(input).toBeInTheDocument();

    // No Add button (user hits Enter to add)
    expect(screen.queryByRole('button', { name: /^add$/i })).not.toBeInTheDocument();

    // No tabs or filter bar when no tasks exist
    expect(screen.queryByRole('button', { name: /^all$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^active$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /completed/i })).not.toBeInTheDocument();
  });

  it('adds a new task at the top on Enter key press', () => {
    render(<TodoApp />);
    const input = screen.getByRole('textbox', { name: /new task/i });

    // Add first task
    fireEvent.change(input, { target: { value: 'Task 1' } });
    fireEvent.submit(input.closest('form')!);

    expect(screen.getByText('Task 1')).toBeInTheDocument();

    // Add second task
    fireEvent.change(input, { target: { value: 'Task 2' } });
    fireEvent.submit(input.closest('form')!);

    // New item must be on top!
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Task 2');
    expect(items[1]).toHaveTextContent('Task 1');
  });

  it('renders items with compact vertical spacing and delete button hidden by default', () => {
    render(<TodoApp />);
    const input = screen.getByRole('textbox', { name: /new task/i });

    fireEvent.change(input, { target: { value: 'Compact Task' } });
    fireEvent.submit(input.closest('form')!);

    const item = screen.getByRole('listitem');
    expect(item.className).toContain('py-2.5');

    // Delete button should have opacity-0 so it only shows on hover
    const deleteBtn = screen.getByRole('button', { name: /delete "Compact Task"/i });
    expect(deleteBtn.className).toContain('opacity-0');
    expect(deleteBtn.className).toContain('group-hover:opacity-100');
  });

  it('shows active tasks by default without an Active button, and shows Completed toggle when completed tasks exist', () => {
    render(<TodoApp />);
    const input = screen.getByRole('textbox', { name: /new task/i });

    // Add active task
    fireEvent.change(input, { target: { value: 'Active Task' } });
    fireEvent.submit(input.closest('form')!);

    // No Active button shown
    expect(screen.queryByRole('button', { name: /^active$/i })).not.toBeInTheDocument();
    // No Completed toggle yet since 0 completed tasks
    expect(screen.queryByRole('button', { name: /completed/i })).not.toBeInTheDocument();

    // Mark task as complete
    const checkbox = screen.getByRole('checkbox', { name: /mark "Active Task" as complete/i });
    fireEvent.click(checkbox);

    // Completed toggle button now appears!
    const completedToggle = screen.getByRole('button', { name: /completed/i });
    expect(completedToggle).toBeInTheDocument();
    // Still no Active button
    expect(screen.queryByRole('button', { name: /^active$/i })).not.toBeInTheDocument();
  });

  it('switches between active and completed views using the Completed toggle button', () => {
    render(<TodoApp />);
    const input = screen.getByRole('textbox', { name: /new task/i });

    fireEvent.change(input, { target: { value: 'Task to complete' } });
    fireEvent.submit(input.closest('form')!);

    fireEvent.change(input, { target: { value: 'Task to keep active' } });
    fireEvent.submit(input.closest('form')!);

    // Complete the first task
    const checkbox = screen.getByRole('checkbox', {
      name: /mark "Task to complete" as complete/i,
    });
    fireEvent.click(checkbox);

    // Default view shows active tasks
    expect(screen.getByText('Task to keep active')).toBeInTheDocument();
    expect(screen.queryByText('Task to complete')).not.toBeInTheDocument();

    // Click Completed toggle
    const completedToggle = screen.getByRole('button', { name: /completed/i });
    fireEvent.click(completedToggle);

    // Now viewing completed tasks
    expect(screen.getByText('Task to complete')).toBeInTheDocument();
    expect(screen.queryByText('Task to keep active')).not.toBeInTheDocument();

    // Click Completed toggle again (unselect it) -> returns to active tasks
    fireEvent.click(completedToggle);
    expect(screen.getByText('Task to keep active')).toBeInTheDocument();
    expect(screen.queryByText('Task to complete')).not.toBeInTheDocument();
  });

  it('shows Clear all button when active tasks exist and clears all active items at once', () => {
    render(<TodoApp />);
    const input = screen.getByRole('textbox', { name: /new task/i });

    fireEvent.change(input, { target: { value: 'Task 1' } });
    fireEvent.submit(input.closest('form')!);

    fireEvent.change(input, { target: { value: 'Task 2' } });
    fireEvent.submit(input.closest('form')!);

    // "Clear all" button appears
    const clearAllBtn = screen.getByRole('button', { name: /clear all/i });
    expect(clearAllBtn).toBeInTheDocument();

    // Click Clear all
    fireEvent.click(clearAllBtn);

    // Active tasks removed
    expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
    // With 0 tasks, filter bar is gone
    expect(screen.queryByRole('button', { name: /clear all/i })).not.toBeInTheDocument();
  });

  it('shows Clear completed button when viewing completed tasks and removes completed tasks', () => {
    render(<TodoApp />);
    const input = screen.getByRole('textbox', { name: /new task/i });

    fireEvent.change(input, { target: { value: 'Finish me' } });
    fireEvent.submit(input.closest('form')!);

    fireEvent.change(input, { target: { value: 'Stay active' } });
    fireEvent.submit(input.closest('form')!);

    const checkbox = screen.getByRole('checkbox', { name: /mark "Finish me" as complete/i });
    fireEvent.click(checkbox);

    // Switch to Completed view
    const completedToggle = screen.getByRole('button', { name: /completed/i });
    fireEvent.click(completedToggle);

    // Clear completed button is visible
    const clearCompletedBtn = screen.getByRole('button', { name: /clear completed/i });
    expect(clearCompletedBtn).toBeInTheDocument();

    // Click Clear completed
    fireEvent.click(clearCompletedBtn);

    // Finished task removed
    expect(screen.queryByText('Finish me')).not.toBeInTheDocument();
    // Returned to active view where "Stay active" exists
    expect(screen.getByText('Stay active')).toBeInTheDocument();
    // Completed toggle is hidden since 0 completed tasks remain
    expect(screen.queryByRole('button', { name: /completed/i })).not.toBeInTheDocument();
  });

  it('supports drag and drop reordering', () => {
    render(<TodoApp />);
    const input = screen.getByRole('textbox', { name: /new task/i });

    fireEvent.change(input, { target: { value: 'First Task' } });
    fireEvent.submit(input.closest('form')!);

    fireEvent.change(input, { target: { value: 'Second Task' } });
    fireEvent.submit(input.closest('form')!);

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Second Task');
    expect(items[1]).toHaveTextContent('First Task');

    const dataTransfer = {
      setData: () => {},
      getData: () => '',
      effectAllowed: 'move',
      dropEffect: 'move',
    };

    fireEvent.dragStart(items[0], { dataTransfer });
    fireEvent.dragOver(items[1], { dataTransfer });
    fireEvent.drop(items[1], { dataTransfer });
    fireEvent.dragEnd(items[0]);

    const updatedItems = screen.getAllByRole('listitem');
    expect(updatedItems[0]).toHaveTextContent('First Task');
    expect(updatedItems[1]).toHaveTextContent('Second Task');
  });

  it('expires cache after 12 hours so task list is not saved there the next day', () => {
    const now = 1700000000000;
    const task = createTodoItem('Test Task');
    task.createdAt = now;

    // Within 12 hours (e.g. 11 hours later): should still be valid
    const validRaw = JSON.stringify({
      todos: [task],
      updatedAt: now,
    });
    const within12Hours = parseStoredTodos(validRaw, now + 11 * 3600 * 1000);
    expect(within12Hours).toHaveLength(1);
    expect(within12Hours[0].text).toBe('Test Task');

    // After 12 hours (e.g. 12 hours and 1 minute later): should expire and return empty
    const expiredRaw = JSON.stringify({
      todos: [task],
      updatedAt: now,
    });
    const after12Hours = parseStoredTodos(expiredRaw, now + CACHE_TTL_MS + 60000);
    expect(after12Hours).toHaveLength(0);
  });
});
