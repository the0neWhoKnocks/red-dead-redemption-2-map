(() => {
  const DEFAULT_IMG_RADIUS = 40;
  const DEFAULT_OPTS = {
    offsetX: 0,
    offsetY: 0,
    opacity: 1,
    rotate: 0,
    size: [DEFAULT_IMG_RADIUS, DEFAULT_IMG_RADIUS],
  };

  class CanvasMarker extends L.CircleMarker {
    _updatePath() {
      const marker = this;
      const { img, prevLatlng } = marker.options;
      
      if (!img || !img.url) return;
      
      if (!img.el) {
        const imgEl = document.createElement('img');
        imgEl.src = marker.options.img.url;
        
        marker.options.img = { 
          ...DEFAULT_OPTS,
          ...marker.options.img,
          el: imgEl,
        };
        marker.options.img.rotate += marker.angleCrds(marker._map, prevLatlng, marker._latlng);
        
        imgEl.onload = () => { marker.redraw(); };
        imgEl.onerror = () => { marker.options.img = null; };
      }
    }
    
    angleCrds(map, prevLatlng, latlng) {
      if (!latlng || !prevLatlng) return 0;
      
      const pxStart = map.project(prevLatlng);
      const pxEnd = map.project(latlng);
      
      return Math.atan2(pxStart.y - pxEnd.y, pxStart.x - pxEnd.x) / Math.PI * 180 - 90;
    }
  }
  
  L.Canvas.include({
    getEvents() {
      var events = L.Renderer.prototype.getEvents.call(this);
      // console.log(events);
      
      const update = (evType, origFunc) => function() {
        const renderer = this;
        // console.log(evType);
        renderer._map.closePopup();
        renderer._update();
        renderer._draw();
        origFunc.call(renderer);
      };
      
      events.zoom = update('zoom', events.zoom);
      // events.zoomanim = update('zoomanim', events.zoomanim);
      // events.zoomend = update('zoomend', events.zoomend);
      // events.moveend = update('moveend', events.moveend);
      
      return events;
    },

    _draw(clear) {
      this._ctx.clearRect(0, 0, this._ctx.canvas.width, this._ctx.canvas.height);
      
      const sortedMarkers = Object.keys(this._layers)
        .map(id => this._layers[id])
        .sort((a, b) => {
          const { lng: lngA } = a._latlng;
          const { lng: lngB } = b._latlng;
          if (lngA < lngB) return 1;
          else if(lngA > lngB) return -1;
          else return 0;
        })
        .sort((a, b) => {
          const { lat: latA } = a._latlng;
          const { lat: latB } = b._latlng;
          if (latA < latB) return 1;
          else if(latA > latB) return -1;
          else return 0;
        });
      
      for (let i=0; i<sortedMarkers.length; i++) {
        const marker = sortedMarkers[i];
        
        if (marker._pxBounds.intersects(this._bounds)) {
          marker._project();
          
          const { img } = marker.options;
          const p = marker._point;
        
          p.x += img.offsetX;
          p.y += img.offsetY;
        
          this._ctx.save();
          if (img.opacity < 1) this._ctx.globalAlpha = img.opacity;
        
          if (img.rotate) {
            this._ctx.translate(p.x, p.y);
            this._ctx.rotate(img.rotate * Math.PI / 180);
            this._ctx.drawImage(img.el, -img.size[0] / 2, -img.size[1] / 2, img.size[0], img.size[1]);
          }
          else {
            this._ctx.drawImage(img.el, p.x - img.size[0] / 2, p.y - img.size[1] / 2, img.size[0], img.size[1]);
          }
        
          this._ctx.restore();
        }
      }
    },
  });
  L.canvasMarker = (...options) => new CanvasMarker(...options);
})();
