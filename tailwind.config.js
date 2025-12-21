/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF5136',      // Appwrite Red (for buttons, CTAs)
        secondary: '#3B82F6',    // Appwrite Blue (for highlights, links)
        accent: '#10B981',       // Success / positive actions
        neutral: {
          50: '#F9FAFB',        // Light background / surfaces
          100: '#F3F4F6',       // Card backgrounds
          200: '#E5E7EB',       // Subtle borders / dividers
          300: '#D1D5DB',       // Muted text
          400: '#9CA3AF',       // Secondary text
          500: '#6B7280',       // Tertiary text
          600: '#4B5563',       // Active text / icons
          700: '#374151',       // Strong text
          800: '#1F2937',       // Dark mode background / panels
          900: '#111827',       // Dark text
        },
        warning: '#F59E0B',      // Warning / alerts
        error: '#EF4444',        // Error / destructive actions
        info: '#3B82F6',         // Info messages
        success: '#10B981',      // Success messages
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        poppins: ['Poppins', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
        openSans: ['Open Sans', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',            // For cards, buttons
        '2xl': '1.5rem',         // Larger UI elements
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0,0,0,0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06)',
        md: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
        lg: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
      }
    },
  },
  plugins: [],
  darkMode: 'class',  // Optional dark mode
}
