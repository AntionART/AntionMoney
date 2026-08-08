export const colors = {
  light: {
    bg: '#FFFFFF',
    textPrimary: '#111111',
    textSecondary: '#6B6B6B',
    border: '#E5E5E5',
  },
  dark: {
    bg: '#0D0D0D',
    textPrimary: '#F5F5F5',
    textSecondary: '#6B6B6B',
    border: '#2A2A2A',
  },
  accentAlert: '#E23F3F',
  accentSuccess: '#3FA65C',
} as const;

export type ThemeMode = 'light' | 'dark';
