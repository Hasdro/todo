import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MascotCharacter from '../MascotCharacter';

describe('MascotCharacter Ghost', () => {
  it('renders ghost character with light ethereal colors, big eyes, and larger size', () => {
    const { container } = render(<MascotCharacter />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // Verify it is larger in size (w-16 h-16 or bigger)
    expect(svg?.getAttribute('class')).toContain('w-16 h-16');

    // Must be a ghost character with wavy bottom sheet/body
    const ghostBody = container.querySelector('[data-testid="ghost-body"]');
    expect(ghostBody).toBeInTheDocument();

    // Must have light ethereal ghost styling
    const ghostGradient = container.querySelector('#ghostBodyGrad');
    expect(ghostGradient).toBeInTheDocument();
  });

  it('keeps calm, friendly ghost expression consistently without mood disruptions', () => {
    const { container } = render(<MascotCharacter />);
    // Does not have violent mood bounce animations
    expect(container.querySelector('.animate-bounce')).not.toBeInTheDocument();

    // Renders calm smiling ghost mouth
    const smile = container.querySelector('[data-testid="ghost-smile"]');
    expect(smile).toBeInTheDocument();

    // Has left and right eye tracking structures
    expect(container.querySelector('#ghostLeftEyeClip')).toBeInTheDocument();
    expect(container.querySelector('#ghostRightEyeClip')).toBeInTheDocument();
  });
});
