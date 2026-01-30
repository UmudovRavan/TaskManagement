/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: "class",
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                "primary": "#2563EB", // User: Primary Blue
                "primary-hover": "#1D4ED8", // User: Primary Blue Hover
                "background-light": "#f6f6f8",
                "background-dark": "#0F172A", // User: Primary Background (Navy)
                "surface-dark": "#020617", // User: Tertiary Background (Sidebar)
                "primary-register": "#2563EB",
                "background-light-register": "#f6f6f8",
                "background-dark-register": "#0F172A",
                "card-light": "#ffffff",
                "card-dark": "#020617", // User: Card/Modal Background
                "input-border-light": "#cfd7e7",
                "input-border-dark": "#1E293B", // User: Input Border
                "text-main-light": "#0d121b",
                "text-main-dark": "#E5E7EB", // User: Primary Text
                "text-muted-light": "#6B7280",
                "text-muted-dark": "#9CA3AF", // User: Secondary Text
                "background-light-reset": "#f6f7f7",
                "background-dark-reset": "#16191c",
                "primary-success": "#22C55E", // User: Success
                "status-warning": "#FACC15", // User: Warning
                "status-danger": "#EF4444", // User: Danger
                "status-info": "#38BDF8", // User: Info
            },
            fontFamily: {
                "sans": ["Inter", "sans-serif"],
                "display": ["Inter", "sans-serif"],
            },
            boxShadow: {
                'soft': '0 25px 50px -12px rgba(0, 0, 0, 0.06)',
                'input': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                'premium': '0 8px 24px rgba(0,0,0,0.35)', // User: Premium Shadow
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
    ],
}
