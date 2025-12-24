/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyber-black': '#0a0a0f',
        'cyber-dark': '#12121a',
        'cyber-card': '#1a1a24',
        'cyber-border': '#2a2a3a',
        'neon-blue': '#00d4ff',
        'neon-green': '#00ff88',
        'neon-red': '#ff3366',
        'neon-yellow': '#ffcc00',
        'neon-purple': '#b829dd',
      }
    },
  },
  plugins: [],
}
