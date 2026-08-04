import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ThemeToggle } from '../../components/navigation/ThemeToggle';
import { ThemeProvider } from '../../providers/ThemeProvider';

describe('ThemeToggle Component', () => {
  it('should render toggle button with aria label', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
  });

  it('should open dropdown menu when clicked', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button', { name: /toggle theme/i });
    fireEvent.click(button);

    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    expect(screen.getByText('Light Mode')).toBeInTheDocument();
    expect(screen.getByText('System Theme')).toBeInTheDocument();
  });
});
