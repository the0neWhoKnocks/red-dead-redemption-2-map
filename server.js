const { readFile } = require('fs');
const http = require('http');
const { resolve } = require('path');
const url = require('url');

const ROOT_PATH = resolve(__dirname, './');
const PUBLIC_PATH = `${ROOT_PATH}/public`;

const handleRequests = (req, res) => {
  const parsedURL = url.parse(req.url);
  
  if (/^\/(css|js|imgs)\/.*/.test(req.url)) {
    const filePath = `${PUBLIC_PATH}${parsedURL.pathname}`;
    readFile(filePath, (err, file) => {
      if (err) {
        console.error('[ERROR]', err);
        res.statusCode = 500;
        res.statusMessage = err;
        res.end();
      }
      else {
        const mime = require('mime-types');
        
        res.setHeader('Content-Type', mime.lookup(`${PUBLIC_PATH}${parsedURL.pathname}`));
        if (filePath.includes('/imgs')) {
          res.setHeader('Cache-Control', `max-age=${60 * 60 * 24 * 365}`);
        }
        
        res.end(file);
      }
    });
  }
  else {
    readFile(`${PUBLIC_PATH}/index.html`, (err, file) => {
      if (err) console.error('[ERROR]', err);
      else {
        res.end(file);
      }
    });
  }
}

const server = http.createServer(handleRequests);

server.listen(process.env.SERVER_PORT, (err) => {
  if (err) {
    console.error('[ERROR]', err);
  }
  else {
    console.log(`Server running at http://localhost:${process.env.SERVER_PORT}`);
  }
});