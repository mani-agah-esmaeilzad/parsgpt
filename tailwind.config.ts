import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";

const config: Config = {
	darkMode: "class",
	content: [
		"./src/app/**/*.{ts,tsx}",
		"./src/components/**/*.{ts,tsx}",
		"./src/lib/**/*.{ts,tsx}",
		"./src/features/**/*.{ts,tsx}",
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
	},
	plugins: [animatePlugin],
};

export default config;
