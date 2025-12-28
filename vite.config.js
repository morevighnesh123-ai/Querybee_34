const { defineConfig } = require('vite');
const reactPlugin = require('@vitejs/plugin-react');

module.exports = defineConfig({
  plugins: [typeof reactPlugin === 'function' ? reactPlugin() : reactPlugin.default()],
  server: {
    port: 5173,
  },
});
