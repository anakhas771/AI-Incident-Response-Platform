import { useThemeContext, ThemeContextType } from '../providers/ThemeProvider';

export function useTheme(): ThemeContextType {
  return useThemeContext();
}

export default useTheme;
