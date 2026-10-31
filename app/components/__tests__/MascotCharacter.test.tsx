import '@testing-library/jest-dom/vitest';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MascotCharacter, { type MascotEvent } from '../MascotCharacter';

const moodOf = (container: HTMLElement) =>
  container.querySelector('[data-mood]')?.getAttribute('data-mood');
const mouthOf = (container: HTMLElement) =>
  container.querySelector('[data-testid="ghost-mouth"]')?.getAttribute('data-mouth');

describe('MascotCharacter ghost', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('renders the ghost body, face and gradient', () => {
    const { container } = render(<MascotCharacter />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute('class')).toContain('w-16 h-16');
    expect(container.querySelector('[data-testid="ghost-body"]')).toBeInTheDocument();
    expect(container.querySelector('#ghostBodyGrad')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="ghost-brow-left"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="ghost-brow-right"]')).toBeInTheDocument();
  });

  it('is calm and smiling when idle', () => {
    const { container } = render(<MascotCharacter />);
    expect(moodOf(container)).toBe('idle');
    expect(mouthOf(container)).toBe('smile');
  });

  it('becomes attentive while the user types and focused while dragging', () => {
    const { container, rerender } = render(<MascotCharacter attentive />);
    expect(moodOf(container)).toBe('attentive');

    rerender(<MascotCharacter attentive dragging />);
    expect(moodOf(container)).toBe('focused');
  });

  it('beams when a task is added, then settles back', () => {
    const { container, rerender } = render(<MascotCharacter />);
    rerender(<MascotCharacter event={{ type: 'add', id: 1 }} />);
    act(() => vi.advanceTimersByTime(0));
    expect(moodOf(container)).toBe('happy');
    expect(mouthOf(container)).toBe('grin');

    act(() => vi.advanceTimersByTime(1400));
    expect(moodOf(container)).toBe('idle');
  });

  it('is proud when a task is completed and curious when it is reopened', () => {
    const { container, rerender } = render(<MascotCharacter />);
    rerender(<MascotCharacter event={{ type: 'complete', id: 1 }} />);
    act(() => vi.advanceTimersByTime(0));
    expect(moodOf(container)).toBe('proud');

    rerender(<MascotCharacter event={{ type: 'uncomplete', id: 2 }} />);
    act(() => vi.advanceTimersByTime(0));
    expect(moodOf(container)).toBe('curious');
  });

  it('flinches then looks sad when a task is deleted', () => {
    const { container, rerender } = render(<MascotCharacter />);
    rerender(<MascotCharacter event={{ type: 'delete', id: 1 }} />);
    act(() => vi.advanceTimersByTime(0));
    expect(moodOf(container)).toBe('surprised');

    act(() => vi.advanceTimersByTime(450));
    expect(moodOf(container)).toBe('sad');

    act(() => vi.advanceTimersByTime(1000));
    expect(moodOf(container)).toBe('idle');
  });

  it('replays the reaction for repeated events of the same type', () => {
    const { container, rerender } = render(<MascotCharacter />);
    const fire = (e: MascotEvent) => {
      rerender(<MascotCharacter event={e} />);
      act(() => vi.advanceTimersByTime(0));
    };
    fire({ type: 'clear', id: 1 });
    act(() => vi.advanceTimersByTime(2000));
    expect(moodOf(container)).toBe('idle');

    fire({ type: 'clear', id: 2 });
    expect(moodOf(container)).toBe('surprised');
    act(() => vi.advanceTimersByTime(350));
    expect(moodOf(container)).toBe('relieved');
  });
});
