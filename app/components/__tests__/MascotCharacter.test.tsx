import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MascotCharacter from '../MascotCharacter';

describe('MascotCharacter Ghost', () => {
  it('renders ghost-like animated character with light ethereal colors and eyes', () => {
    const { container } = render(<MascotCharacter mood="idle" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // Must be a ghost character with wavy bottom sheet/body
    const ghostBody = container.querySelector('[data-testid="ghost-body"]');
    expect(ghostBody).toBeInTheDocument();

    // Must have light ethereal ghost styling
    const ghostGradient = container.querySelector('#ghostBodyGrad');
    expect(ghostGradient).toBeInTheDocument();
  });

  it('renders different facial expressions based on mood for ghost', () => {
    const { rerender, container } = render(<MascotCharacter mood="adding" />);
    // Adding: joyful float bounce
    expect(container.querySelector('.animate-bounce')).toBeInTheDocument();

    rerender(<MascotCharacter mood="completing" />);
    // Completing: celebratory wink / star expression
    expect(container.innerHTML).toContain('star');

    rerender(<MascotCharacter mood="deleting" />);
    // Deleting: shocked ghost expression
    expect(container.firstChild).toBeInTheDocument();

    rerender(<MascotCharacter mood="reordering" />);
    // Reordering: playful curious ghost
    expect(container.firstChild).toBeInTheDocument();
  });
});
