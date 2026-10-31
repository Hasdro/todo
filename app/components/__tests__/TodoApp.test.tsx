import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import TodoApp from '../TodoApp';

describe('TodoApp', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the title and input', () => {
    render(<TodoApp />);
    expect(screen.getByPlaceholderText(/what needs to be done/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('adds a new todo item and stores it', () => {
    render(<TodoApp />);
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    const addButton = screen.getByRole('button', { name: /add/i });

    fireEvent.change(input, { target: { value: 'Buy groceries' } });
    fireEvent.click(addButton);

    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
    expect(screen.getByText(/1 item left/i)).toBeInTheDocument();
  });

  it('does not add empty or whitespace-only todos', () => {
    render(<TodoApp />);
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    const addButton = screen.getByRole('button', { name: /add/i });

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(addButton);

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('toggles a todo between active and completed', () => {
    render(<TodoApp />);
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    const addButton = screen.getByRole('button', { name: /add/i });

    fireEvent.change(input, { target: { value: 'Read a book' } });
    fireEvent.click(addButton);

    const checkbox = screen.getByRole('checkbox', { name: /mark "Read a book" as complete/i });
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(screen.getByText(/0 items left/i)).toBeInTheDocument();
  });

  it('deletes a todo item', () => {
    render(<TodoApp />);
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    const addButton = screen.getByRole('button', { name: /add/i });

    fireEvent.change(input, { target: { value: 'Task to delete' } });
    fireEvent.click(addButton);

    expect(screen.getByText('Task to delete')).toBeInTheDocument();

    const deleteBtn = screen.getByRole('button', { name: /delete "Task to delete"/i });
    fireEvent.click(deleteBtn);

    expect(screen.queryByText('Task to delete')).not.toBeInTheDocument();
  });

  it('filters todos by active and completed status', () => {
    render(<TodoApp />);
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    const addButton = screen.getByRole('button', { name: /add/i });

    // Add first item
    fireEvent.change(input, { target: { value: 'Active task' } });
    fireEvent.click(addButton);

    // Add second item
    fireEvent.change(input, { target: { value: 'Done task' } });
    fireEvent.click(addButton);

    // Complete the second item
    const doneCheckbox = screen.getByRole('checkbox', { name: /mark "Done task" as complete/i });
    fireEvent.click(doneCheckbox);

    // Filter to Active
    fireEvent.click(screen.getByRole('button', { name: /^active$/i }));
    expect(screen.getByText('Active task')).toBeInTheDocument();
    expect(screen.queryByText('Done task')).not.toBeInTheDocument();

    // Filter to Completed
    fireEvent.click(screen.getByRole('button', { name: /^completed$/i }));
    expect(screen.queryByText('Active task')).not.toBeInTheDocument();
    expect(screen.getByText('Done task')).toBeInTheDocument();

    // Filter back to All
    fireEvent.click(screen.getByRole('button', { name: /^all$/i }));
    expect(screen.getByText('Active task')).toBeInTheDocument();
    expect(screen.getByText('Done task')).toBeInTheDocument();
  });

  it('clears completed todos', () => {
    render(<TodoApp />);
    const input = screen.getByPlaceholderText(/what needs to be done/i);
    const addButton = screen.getByRole('button', { name: /add/i });

    fireEvent.change(input, { target: { value: 'To finish' } });
    fireEvent.click(addButton);

    const checkbox = screen.getByRole('checkbox', { name: /mark "To finish" as complete/i });
    fireEvent.click(checkbox);

    const clearBtn = screen.getByRole('button', { name: /clear completed/i });
    fireEvent.click(clearBtn);

    expect(screen.queryByText('To finish')).not.toBeInTheDocument();
  });
});
