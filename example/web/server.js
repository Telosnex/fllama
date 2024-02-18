const express = require('express');
const app = express();
const port = 8080; // Feel free to use any available port

// Serve static files and set custom headers
app.use(express.static('../build/web', { // Adjust the path to where your Flutter web build output is located
  setHeaders: (res, path) => {
    if (path.endsWith('.wasm')) {
      res.setHeader('Content-Type', 'application/wasm');
    } else if (path.endsWith('.js') || path.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});