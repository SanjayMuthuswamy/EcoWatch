/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'bg-base': '#02040a',
                'bg-glass': 'rgba(10, 15, 28, 0.72)',
                'bg-glass-bright': 'rgba(16, 24, 45, 0.85)',
                'accent-cyan': '#00d4ff',
                'accent-emerald': '#00ff9d',
                'accent-orange': '#ff9d00',
                'accent-error': '#ff3e3e',
            },
            fontFamily: {
                ui: ['Inter', 'system-ui', 'sans-serif'],
                header: ['Orbitron', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            backdropBlur: {
                xs: '2px',
            }
        },
    },
    plugins: [],
}
