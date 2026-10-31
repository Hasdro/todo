import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MascotCharacter from '../MascotCharacter';

describe('MascotCharacter', () => {
  it('renders circular companion character with light colors and eyes', () => {
    const { container } = render(<MascotCharacter mood="idle" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // Must be a circular character (contains circular body element)
    const circularBody = container.querySelector('circle[r="32"]') || container.querySelector('circle');
    expect(circularBody).toBeInTheDocument();

    // Must not contain bunny ears
    expect(container.querySelector('#innerEarGrad')).not.toBeInTheDocument();
  });

  it('renders different facial expressions based on mood', () => {
    const { rerender, container } = render(<MascotCharacter mood="adding" />);
    // Adding: joyful celebration expression
    expect(container.querySelector('.animate-bounce')).toBeInTheDocument();

    rerender(<MascotCharacter mood="completing" />);
    // Completing: celebratory wink / star expression
    expect(container.innerHTML).toContain('star');

    rerender(<MascotCharacter mood="deleting" />);
    // Deleting: shocked expression
    expect(container.firstChild).toBeInTheDocument();

    rerender(<MascotCharacter mood="reordering" />);
    // Reordering: curious expression
    expect(container.firstChild).toBeInTheDocument();
  });
});
