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
      const { img, prevLatlng } = this.options;
      
      if (!img || !img.url) return;
      
      if (!img.el) {
        const imgEl = document.createElement('img');
        imgEl.src = this.options.img.url;
        
        this.options.img = { 
          ...DEFAULT_OPTS,
          ...this.options.img,
          el: imgEl,
        };
        this.options.img.rotate += this.angleCrds(this._map, prevLatlng, this._latlng);
        
        imgEl.onload = () => { this.redraw(); };
        imgEl.onerror = () => { this.options.img = null; };
      }
      else this._renderer._updateImg(this);
    }
    
    angleCrds(map, prevLatlng, latlng) {
      if (!latlng || !prevLatlng) return 0;
      
      const pxStart = map.project(prevLatlng);
      const pxEnd = map.project(latlng);
      
      return Math.atan2(pxStart.y - pxEnd.y, pxStart.x - pxEnd.x) / Math.PI * 180 - 90;
    }
  }

  L.Canvas.include({
    _updateImg(layer) {
      const { img } = layer.options;
      const p = layer._point.round();
      
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
    },
  });
  L.canvasMarker = (...options) => new CanvasMarker(...options);
})();
