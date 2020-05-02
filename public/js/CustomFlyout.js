class CustomFlyout extends HTMLElement {
  set content(content) {
    this.els.flyoutBody.innerHTML = content;
  }
  
  set onClose(fn) {
    this._onClose = fn;
  }
  
  set title(title) {
    this.els.flyoutTitle.innerHTML = title;
  }
  
  constructor() {
    super();
    
    this.attachShadow({ mode: 'open' });
    
    const { shadowRoot } = this;
    this.ANIM_DURATION = 300;
    this.MODIFIER__OPEN = 'is--open';
    
    shadowRoot.innerHTML = `
      <style>
        *, *::after, *::before {
          box-sizing: border-box;
        }
        
        :host {
          font: 16px Helvetica, Arial, sans-serif;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          z-index: 10;
        }
        
        :host button,
        :host input,
        :host select,
        :host textarea {
          font-size: 1em;
        }
        
        :host button {
          cursor: pointer;
        }
        
        .flyout-mask {
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          position: absolute;
          top: 0;
          left: 0;
          opacity: 0;
          transition: opacity ${this.ANIM_DURATION}ms;
        }
        .flyout-mask.${this.MODIFIER__OPEN} {
          opacity: 1;
        }
        
        .flyout {
          overflow: hidden;
          padding: 0;
          border: solid 1px;
          margin: 0;
          background: #eee;
          display: flex;
          flex-direction: column;
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          transform: translateX(-100%);
          transition: transform ${this.ANIM_DURATION}ms;
        }
        .flyout.${this.MODIFIER__OPEN} {
          box-shadow: 0 0.75em 2em 0.25em rgba(0, 0, 0, 0.75);
          transform: translateX(0%);
        }
        
        .flyout__nav {
          font-size: 1.25em;
          border-bottom: solid 1px;
          display: flex;
        }
        
        .flyout__body {
          height: 100%;
          overflow-y: auto;
          margin-bottom: 1px;
        }
        
        .flyout__title {
          width: 100%;
          color: #eee;
          padding: 0.5em 0.8em 0.5em;
          padding-right: 1em;
          background: #333;
        }
        
        .flyout__close-btn {
          color: #eee;
          padding: 0 0.5em;
          border: none;
          background: #333;
        }
      </style>
      
      <div class="flyout-mask"></div>
      <div class="flyout">
        <nav class="flyout__nav">
          <div class="flyout__title">Title</div>
          <button type="button" class="flyout__close-btn">&#10005;</button>
        </nav>
        <div class="flyout__body"></div>
      </div>
    `;
    
    this.els = {
      closeBtn: shadowRoot.querySelector('.flyout__close-btn'),
      flyout: shadowRoot.querySelector('.flyout'),
      flyoutBGMask: shadowRoot.querySelector('.flyout-mask'),
      flyoutBody: shadowRoot.querySelector('.flyout__body'),
      flyoutTitle: shadowRoot.querySelector('.flyout__title'),
    };
    
    this.handleCloseClick = this.handleCloseClick.bind(this);
    this.handleMaskClick = this.handleMaskClick.bind(this);
  }
  
  handleCloseClick() { this.close(); }
  handleMaskClick() { this.close(); }
  
  show() {
    document.body.appendChild(this);
    this.els.closeBtn.addEventListener('click', this.handleCloseClick);
    this.els.flyoutBGMask.addEventListener('click', this.handleMaskClick);
    window.customFlyout = this;
    
    setTimeout(() => {
      this.els.flyoutBGMask.classList.add(this.MODIFIER__OPEN);
      this.els.flyout.classList.add(this.MODIFIER__OPEN);
    }, 0);
  }
  
  close() {
    this.els.closeBtn.removeEventListener('click', this.handleCloseClick);
    this.els.flyoutBGMask.removeEventListener('click', this.handleMaskClick);
    this.els.flyoutBGMask.classList.remove(this.MODIFIER__OPEN);
    this.els.flyout.classList.remove(this.MODIFIER__OPEN);
    
    setTimeout(() => {
      this._onClose();
      delete window.customFlyout;
      this.remove();
    }, this.ANIM_DURATION);
  }
}

window.customElements.define('custom-flyout', CustomFlyout);
