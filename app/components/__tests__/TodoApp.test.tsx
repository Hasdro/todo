import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import TodoApp from '../TodoApp';

describe('TodoApp with Mascot, DnD, and Dynamic Tabs', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders input, modern Add button, and mascot without any tabs when no tasks exist', () => {
    render(<TodoApp />);
    const input = screen.getByRole('textbox', { name: /new task/i });
    expect(input).toBeInTheDocument();

    const addButton = screen.getByRole('button', { name: /add/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton.className).toContain('bg-white');

    // When there is no task, do not even show the active tasks tab or completed tab
    expect(screen.queryByRole('button', { name: /^all$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^active$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^completed$/i })).not.toBeInTheDocument();
  });

  it('shows Active tab when active task exists, and Completed tab when completed task exists', () => {
    render(<TodoApp />);
    const input = screen.getByRole('textbox', { name: /new task/i });
    const addButton = screen.getByRole('button', { name: /add/i });

    // Initially no tabs
    expect(screen.queryByRole('button', { name: /^active$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^completed$/i })).not.toBeInTheDocument();

    // Add an active task
    fireEvent.change(input, { target: { value: 'Task 1' } });
    fireEvent.click(addButton);

    // Active tab now appears! Completed tab is still hidden
    expect(screen.getByRole('button', { name: /^active$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^completed$/i })).not.toBeInTheDocument();

    // Mark as complete
    const checkbox = screen.getByRole('checkbox', { name: /mark "Task 1" as complete/i });
    fireEvent.click(checkbox);

    // Completed tab now appears! And since activeCount is 0, Active tab is hidden
    expect(screen.getByRole('button', { name: /^completed$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^active$/i })).not.toBeInTheDocument();
  });

  it('shows Clear Completed button only when Completed tab is selected and clears tasks', () => {
    render(<TodoApp />);
    const input = screen.getByRole('textbox', { name: /new task/i });
    const addButton = screen.getByRole('button', { name: /add/i });

    fireEvent.change(input, { target: { value: 'Task to finish' } });
    fireEvent.click(addButton);

    fireEvent.change(input, { target: { value: 'Task to keep active' } });
    fireEvent.click(addButton);

    const checkbox = screen.getByRole('checkbox', { name: /mark "Task to finish" as complete/i });
    fireEvent.click(checkbox);

    // On 'active' tab, Clear completed button is not shown
    expect(screen.queryByRole('button', { name: /clear completed/i })).not.toBeInTheDocument();

    // Click 'Completed' tab
    const completedTab = screen.getByRole('button', { name: /^completed$/i });
    fireEvent.click(completedTab);

    // Now Clear completed button is visible
    const clearBtn = screen.getByRole('button', { name: /clear completed \(1\)/i });
    expect(clearBtn).toBeInTheDocument();

    // Click Clear completed
    fireEvent.click(clearBtn);

    // Completed task removed from memory & state
    expect(screen.queryByText('Task to finish')).not.toBeInTheDocument();
    // Active task is still there
    expect(screen.getByText('Task to keep active')).toBeInTheDocument();
    // Completed tab disappears because 0 completed tasks remain
    expect(screen.queryByRole('button', { name: /^completed$/i })).not.toBeInTheDocument();
  });

  it('supports drag and drop reordering', () => {
    render(<TodoApp />);
    const input = screen.getByRole('textbox', { name: /new task/i });
    const addButton = screen.getByRole('button', { name: /add/i });

    fireEvent.change(input, { target: { value: 'First Task' } });
    fireEvent.click(addButton);

    fireEvent.change(input, { target: { value: 'Second Task' } });
    fireEvent.click(addButton);

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Second Task');
    expect(items[1]).toHaveTextContent('First Task');

    // Simulate drag and drop
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

    // Order reversed
    const updatedItems = screen.getAllByRole('listitem');
    expect(updatedItems[0]).toHaveTextContent('First Task');
    expect(updatedItems[1]).toHaveTextContent('Second Task');
  });

  it('deletes a task', () => {
    render(<TodoApp />);
    const input = screen.getByRole('textbox', { name: /new task/i });
    const addButton = screen.getByRole('button', { name: /add/i });

    fireEvent.change(input, { target: { value: 'Task to delete' } });
    fireEvent.click(addButton);

    expect(screen.getByText('Task to delete')).toBeInTheDocument();

    const deleteBtn = screen.getByRole('button', { name: /delete "Task to delete"/i });
    fireEvent.click(deleteBtn);

    expect(screen.queryByText('Task to delete')).not.toBeInTheDocument();
  });
});
