const { create } = require('browser-sync');

const PORT = 3000;

// https://www.browsersync.io/docs/options
create().init({
  files: [
    'public/css/app.css',
    'public/js/*.js',
    'public/index.html',
  ],
  ghostMode: false, // don't mirror interactions in other browsers
  // logLevel: 'debug',
  open: false,
  port: PORT + 1,
  proxy: `localhost:${PORT}`,
  snippetOptions: {
    rule: {
      match: /<\/body>/i,
      fn: (snippet) => snippet,
    },
  },
  ui: {
    port: PORT + 2,
  },
});
