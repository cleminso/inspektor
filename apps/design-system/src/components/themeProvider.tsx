import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { type ComponentProps, type ReactElement, useEffect } from "react";

const themeColorByValue = {
  dark: "#19181a",
  light: "#fafafa",
} as const;

function ThemeHeadEffects(): null {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const theme = resolvedTheme === "dark" ? "dark" : "light";
    const themeColorMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"][data-inspector-theme-color="true"]',
    );

    if (themeColorMeta !== null) {
      themeColorMeta.content = themeColorByValue[theme];
    }
  }, [resolvedTheme]);

  return null;
}

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>): ReactElement {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      enableColorScheme
      disableTransitionOnChange
      {...props}
    >
      <ThemeHeadEffects />
      {children}
    </NextThemesProvider>
  );
}
