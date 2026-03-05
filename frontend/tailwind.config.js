/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#0f172a',
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    600: '#475569',
                    700: '#334155',
                },
                accent: {
                    indigo: '#6366f1',
                    sky: '#0ea5e9',
                    emerald: '#10b981',
                    rose: '#f43f5e',
                    amber: '#f59e0b',
                },
                background: '#ffffff',
                surface: '#f8fafc',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            boxShadow: {
                'premium': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 10px 15px -3px rgba(0, 0, 0, 0.03)',
            }
        },
    },
    plugins: [],
}

