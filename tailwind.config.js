module.exports = {
  content: ['./app/**/*.js', './components/**/*.js'],
  theme: {
    extend: {
      colors: { cream: '#F6F2EA', sand: '#D9CEB9', ash: '#B8B6B1', stone: '#6E6C68' },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
};
