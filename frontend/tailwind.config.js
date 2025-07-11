/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stardew: {
          green: '#7CB518',
          darkgreen: '#5A8811',
          brown: '#8B4513',
          lightbrown: '#CD853F',
          blue: '#4A90E2',
          darkblue: '#2E5A87',
          yellow: '#FFD700',
          orange: '#FF8C00',
          red: '#DC143C',
          purple: '#9370DB',
          cream: '#F5F5DC',
          beige: '#F0E68C',
          wood: '#DEB887',
          soil: '#8B4513',
          grass: '#228B22',
          sky: '#87CEEB',
          night: '#191970'
        }
      },
      fontFamily: {
        pixel: ['monospace'],
        game: ['"Courier New"', 'monospace']
      },
      fontSize: {
        'pixel-xs': '10px',
        'pixel-sm': '12px',
        'pixel-base': '14px',
        'pixel-lg': '16px',
        'pixel-xl': '18px',
        'pixel-2xl': '20px'
      },
      spacing: {
        'pixel': '8px',
        'pixel-2': '16px',
        'pixel-3': '24px',
        'pixel-4': '32px'
      },
      borderRadius: {
        'pixel': '2px',
        'pixel-lg': '4px'
      },
      boxShadow: {
        'pixel': '2px 2px 0px 0px rgba(0,0,0,0.3)',
        'pixel-lg': '4px 4px 0px 0px rgba(0,0,0,0.3)',
        'pixel-inset': 'inset 2px 2px 0px 0px rgba(255,255,255,0.3), inset -2px -2px 0px 0px rgba(0,0,0,0.3)'
      },
      animation: {
        'bounce-pixel': 'bounce 1s infinite',
        'pulse-pixel': 'pulse 2s infinite',
        'float': 'float 3s ease-in-out infinite'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      }
    },
  },
  plugins: [],
}