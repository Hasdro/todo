import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MascotCharacter from '../MascotCharacter';

describe('MascotCharacter ghost', () => {
  it('renders the ghost body and gradient at the expected size', () => {
    const { container } = render(<MascotCharacter />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute('class')).toContain('w-16 h-16');
    expect(container.querySelector('[data-testid="ghost-body"]')).toBeInTheDocument();
    expect(container.querySelector('#ghostBodyGrad')).toBeInTheDocument();
  });

  it('has two big eyes and a calm, constant smile', () => {
    const { container } = render(<MascotCharacter />);
    const eyes = container.querySelectorAll('[data-testid="ghost-eye"]');
    expect(eyes).toHaveLength(2);
    eyes.forEach((eye) => {
      const ellipse = eye.querySelector('ellipse');
      expect(Number(ellipse?.getAttribute('rx'))).toBeGreaterThanOrEqual(6);
      expect(Number(ellipse?.getAttribute('ry'))).toBeGreaterThanOrEqual(7.5);
    });
    expect(container.querySelector('[data-testid="ghost-smile"]')).toBeInTheDocument();
  });
});
