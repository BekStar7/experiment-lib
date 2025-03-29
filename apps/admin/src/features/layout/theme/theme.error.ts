export class ThemeContextNotProvidedError extends Error {
	constructor(message: string = "useTheme must be used within a ThemeProvider") {
		super(message)
		this.name = "ThemeContextNotProvidedError"
	}
}