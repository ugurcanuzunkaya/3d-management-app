import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';
import privacySrc from './context/PrivacyContext.tsx?raw';
import modalSrc from './components/models/ModelFormModal.tsx?raw';
import cssSrc from './index.css?raw';

describe('App & Task 02 Quality Gates', () => {
  it('renders without crashing', async () => {
    render(<App />);
    expect(await screen.findByText(/3D Manager/i)).toBeInTheDocument();
  });

  it('has zero eslint-disable comments in PrivacyContext and ModelFormModal', () => {
    expect(privacySrc).not.toContain('eslint-disable');
    expect(modalSrc).not.toContain('eslint-disable');
  });

  it('uses Tailwind v3 compatible HSL CSS variables instead of Tailwind v4 imports/oklch', () => {
    expect(cssSrc).not.toContain('@import "tw-animate-css"');
    expect(cssSrc).not.toContain('@import "shadcn/tailwind.css"');
    expect(cssSrc).not.toContain('oklch(');
  });
});
