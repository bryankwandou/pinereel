/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--pr-font-display)', 'Georgia', 'serif'],
        sans: ['var(--pr-font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--pr-font-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

