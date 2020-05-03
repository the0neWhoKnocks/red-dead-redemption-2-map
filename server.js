const { existsSync, readFile, writeFile } = require('fs');
const http = require('http');
const { resolve } = require('path');
const url = require('url');

const ROOT_PATH = resolve(__dirname, './');
const PUBLIC_PATH = `${ROOT_PATH}/public`;
const MARKERS_PATH = `${PUBLIC_PATH}/markers.json`;

const loadMarkers = () => new Promise((resolve, reject) => {
  if (existsSync(MARKERS_PATH)) {
    readFile(MARKERS_PATH, (err, markers) => {
      if (err) reject(err);
      else resolve(JSON.parse(markers));
    });
  }
  else resolve([]);
});
const saveMarkers = (markers) => new Promise((resolve, reject) => {
  const jsonData = JSON.stringify(markers, null, 2);
  
  writeFile(MARKERS_PATH, jsonData, (err) => {
    if (err) reject(err);
    else resolve(jsonData);
  });
});

const parseReq = (req) => new Promise((resolve, reject) => {
  if (/^(DELETE|POST)$/i.test(req.method)) {
    let body = '';

    req.on('data', (data) => {
      body += data;
    });

    req.on('end', () => {
      resolve(JSON.parse(body));
    });
  }
});

const handleRequests = (req, res) => {
  const {
    pathname: urlPath,
  } = url.parse(req.url);
  
  // Static files
  if (/^\/(css|js|imgs)\/.*/.test(urlPath)) {
    const filePath = `${PUBLIC_PATH}${urlPath}`;
    readFile(filePath, (err, file) => {
      if (err) {
        console.error('[ERROR]', err);
        res.statusCode = 500;
        res.statusMessage = err;
        res.end();
      }
      else {
        const mime = require('mime-types');
        
        res.setHeader('Content-Type', mime.lookup(`${PUBLIC_PATH}${urlPath}`));
        if (filePath.includes('/imgs')) {
          res.setHeader('Cache-Control', `max-age=${60 * 60 * 24 * 365}`);
        }
        
        res.end(file);
      }
    });
  }
  // API calls
  else if (urlPath.startsWith('/api/marker')) {
    const handleLoadError = (err) => {
      console.log('[ERROR] Loading Markers', err);
      res.statusCode = 500;
      res.statusMessage = err;
      res.end();
    };
    const handleSaveError = (err) => {
      console.log('[ERROR] Saving Markers', err);
      res.statusCode = 500;
      res.statusMessage = err;
      res.end();
    };
    const contentTypeJSON = ['Content-Type', 'application/json'];
    
    if (urlPath.endsWith('/delete')) {
      parseReq(req).then(({ ndx }) => {
        loadMarkers()
          .then((loadedMarkers) => {
            const marker = loadedMarkers[ndx];
            loadedMarkers.splice(ndx, 1);
            
            saveMarkers(loadedMarkers)
              .then((savedMarkers) => {
                console.log('[DELETED] Marker', marker);
                res.setHeader(...contentTypeJSON);
                res.end(savedMarkers);
              })
              .catch(handleSaveError);
          })
          .catch(handleLoadError);
      });
    }
    else if (urlPath.endsWith('/load-all')) {
      loadMarkers()
        .then((loadedMarkers) => {
          res.setHeader(...contentTypeJSON);
          res.end(JSON.stringify(loadedMarkers));
        })
        .catch(handleLoadError);
    }
    else if (urlPath.endsWith('/save')) {
      parseReq(req).then((marker) => {
        loadMarkers()
          .then((loadedMarkers) => {
            const markers = loadedMarkers.reduce((arr, m) => {
              if (m.data.uid !== marker.data.uid) arr.push(m);
              return arr;
            }, []);
            markers.push(marker);
            
            saveMarkers(markers)
              .then((savedMarkers) => {
                console.log('[SAVED] Marker', marker);
                res.setHeader(...contentTypeJSON);
                res.end(savedMarkers);
              })
              .catch(handleSaveError);
          })
          .catch(handleLoadError);
      });
    }
    else if (urlPath.endsWith('/update')) {
      parseReq(req).then(({ data, ndx }) => {
        loadMarkers()
          .then((loadedMarkers) => {
            const updatedMarker = {
              ...loadedMarkers[ndx],
              ...data,
            };
            loadedMarkers[ndx] = updatedMarker;
            
            saveMarkers(loadedMarkers)
              .then((savedMarkers) => {
                console.log('[UPDATED] Marker', updatedMarker);
                res.setHeader(...contentTypeJSON);
                res.end(savedMarkers);
              })
              .catch(handleSaveError);
          })
          .catch(handleLoadError);
      });
    }
  }
  // Root document
  else {
    readFile(`${PUBLIC_PATH}/index.html`, (err, file) => {
      if (err) console.error('[ERROR]', err);
      else res.end(file);
    });
  }
}

const server = http.createServer(handleRequests);

server.listen(process.env.SERVER_PORT, (err) => {
  if (err) console.error('[ERROR]', err);
  else console.log(`Server running at http://localhost:${process.env.SERVER_PORT}`);
});