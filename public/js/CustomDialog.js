const STYLES = `
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
  
  .dialog-mask {
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    position: absolute;
    top: 0;
    left: 0;
  }
  
  .dialog {
    overflow: hidden;
    padding: 0;
    border: solid 1px;
    border-radius: 0.5em;
    margin: 0;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0.75em 2em 0.25em rgba(0, 0, 0, 0.75);
    background: #eee;
  }
  
  .dialog__nav {
    font-size: 1.25em;
    border-bottom: solid 1px;
    display: flex;
  }
  
  .dialog__title {
    width: 100%;
    color: #eee;
    padding: 0.5em;
    padding-right: 1em;
    background: #333;
  }
  
  .dialog__close-btn {
    color: #eee;
    padding: 0 1em;
    border: none;
    background: #333;
  }
`;

class CustomDialog extends HTMLElement {
  set content(content) {
    this.els.dialogBody.innerHTML = content;
  }
  
  set onClose(fn) {
    this._onClose = fn;
  }
  
  set title(title) {
    this.els.dialogTitle.innerHTML = title;
  }
  
  constructor() {
    super();
    
    this.attachShadow({ mode: 'open' });
    
    const { shadowRoot } = this;
    shadowRoot.innerHTML = `
      <style>${STYLES}</style>
      
      <div class="dialog-mask"></div>
      <dialog class="dialog" open>
        <nav class="dialog__nav">
          <div class="dialog__title">Title</div>
          <button type="button" class="dialog__close-btn">&#10005;</button>
        </nav>
        <div class="dialog__body"></div>
      </dialog>
    `;
    
    this.els = {
      closeBtn: shadowRoot.querySelector('.dialog__close-btn'),
      dialog: shadowRoot.querySelector('.dialog'),
      dialogBGMask: shadowRoot.querySelector('.dialog-mask'),
      dialogBody: shadowRoot.querySelector('.dialog__body'),
      dialogTitle: shadowRoot.querySelector('.dialog__title'),
    };
    
    this.handleCloseClick = this.handleCloseClick.bind(this);
    this.handleMaskClick = this.handleMaskClick.bind(this);
  }
  
  handleCloseClick() { this.close(); }
  handleMaskClick() { this.close(); }
  
  show() {
    document.body.appendChild(this);
    this.els.closeBtn.addEventListener('click', this.handleCloseClick);
    this.els.dialogBGMask.addEventListener('click', this.handleMaskClick);
    window.customDialog = this;
  }
  
  close() {
    this.els.closeBtn.removeEventListener('click', this.handleCloseClick);
    this.els.dialogBGMask.removeEventListener('click', this.handleMaskClick);
    this._onClose();
    delete window.customDialog;
    this.remove();
  }
}

window.customElements.define('custom-dialog', CustomDialog);
