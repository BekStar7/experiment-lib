import { z } from "zod";

export const themeScheme = z.enum(['light', 'dark', 'system'])
export const resolvedThemeScheme = themeScheme.exclude(['system'])

export const themeContextScheme = z.object({
	resolvedTheme: resolvedThemeScheme,
	theme: themeScheme,
	setTheme: z.function(z.tuple([themeScheme])).returns(z.void()),
})

export type ThemeContextType = z.infer<typeof themeContextScheme>
export type ThemeType = z.infer<typeof themeScheme>
export type ResolvedThemeType = z.infer<typeof resolvedThemeScheme>