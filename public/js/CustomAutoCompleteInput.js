class CustomAutoCompleteInput extends HTMLElement {
  set items(items) {
    this.data.items = items;
  }
  
  set onSelect(fn) {
    this._onSelect = fn;
  }
  
  set placeholder(text) {
    this.els.input.placeholder = text;
  }
  
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    const { shadowRoot } = this;
    this.ROOT_CLASS = 'custom-autocomplete';
    this.data = {};
    
    this.classes = {
      LIST: `${this.ROOT_CLASS}__list`,
      LIST_ITEM: `${this.ROOT_CLASS}__list-item`,
    };
    
    shadowRoot.innerHTML = `
      <style>
        *, *::after, *::before {
          box-sizing: border-box;
        }
        
        :host {
          font: 16px Helvetica, Arial, sans-serif;
        }
        
        .${this.ROOT_CLASS} {
          width: 100%;
          display: inline-block;
          position: relative;
        }
        
        .${this.ROOT_CLASS}__input {
          font-size: 1em;
          width: 100%;
          padding: 0.5em 1em;
        }
        
        .${this.classes.LIST} {
          min-width: 100%;
          max-height: var(--custom-autocomplete-max-list-height, 75vh);
          overflow-y: auto;
          list-style: none;
          padding: 0;
          border: solid 1px #ddd;
          margin: 0;
          background-color: #fff;
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
        }
        .${this.classes.LIST} [data-autocomplete-item] {
          display: none;
        }
        .${this.classes.LIST_ITEM} {
          color: #000;
          font-size: inherit;
          width: 100%;
          text-decoration: none;
          text-align: left;
          border: none;
          padding: 0;
          background: transparent;
          cursor: pointer;
        }
        .${this.classes.LIST_ITEM} button {
          width: 100%;
          font-size: 1rem;
          text-align: left;
          padding: 1em;
          border: none;
          background: #fff;
          display: block;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
        }
        .${this.classes.LIST_ITEM} button:focus,
        .${this.classes.LIST_ITEM} button:hover {
          background: #eee;
        }
      </style>
      <style id="autocompleteStyle"></style>
      
      <div class="${this.ROOT_CLASS}">
        <input class="${this.ROOT_CLASS}__input" type="text">
        <ul class="${this.classes.LIST}"></ul>
      </div>
    `;
    
    this.els = {
      input: shadowRoot.querySelector(`.${this.ROOT_CLASS}__input`),
      list: shadowRoot.querySelector(`.${this.classes.LIST}`),
      listStyle: shadowRoot.querySelector('#autocompleteStyle'),
      wrapper: shadowRoot.querySelector(`.${this.ROOT_CLASS}`),
    };
    
    this.KEY_CODE__DOWN = 40;
    this.KEY_CODE__UP = 38;
    
    this.handleArrowKeysInList = this.handleArrowKeysInList.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleItemSelection = this.handleItemSelection.bind(this);
    this.handleMenuSelectionFromInput = this.handleMenuSelectionFromInput.bind(this);
  }
  
  connectedCallback() {
    if (this.data.items && Array.isArray(this.data.items)) {
      this.setupListItems();
      this.addListeners();
    }
    else {
      console.error('No `items` provided for autocomplete-input');
    }
  }
  
  setupListItems() {
    this.els.list.innerHTML = this.data.items.map(({ attributes, label }) => {
      const atts = Object.keys(attributes).map(att => `${att}="${attributes[att]}"`).join(' ');
      return `
        <li
          class="${this.classes.LIST_ITEM}"
          data-autocomplete-item="${label.toLowerCase()}"
        >
          <button type="button" value="${label}" ${atts}>${label}</button>
        </li>
      `;
    }).join('');
  }
  
  handleInputChange(ev) {
    let rules = '';
    
    if (ev.type !== 'closeList') {
      const query = ev.currentTarget.value;
      const rule = (query !== '')
        ? `
          .${this.classes.LIST} [data-autocomplete-item*="${query.toLowerCase()}"] {
            display: block;
          }
        `
        : `
          .${this.classes.LIST} [data-autocomplete-item] {
            display: block;
          }
        `;
      rules = `
        .${this.classes.LIST} {
          display:block;
        }
        
        ${rule}
      `;
    }
      
    this.els.listStyle.textContent = rules;
  }
  
  handleMenuSelectionFromInput(ev) {
    if (ev.keyCode !== this.KEY_CODE__DOWN) return;
  
    ev.preventDefault();
  
    if (this.els.list.offsetHeight !== 0) {
      // find the first visible item in the drop down to select
      const items = this.els.list.querySelectorAll(`.${this.classes.LIST_ITEM} button`);
      let firstVisibleItem;
      
      this.visibleListItems = [];
      this.itemIndex = 0;
      
      [...items].forEach((item) => {
        if (item.offsetHeight !== 0) {
          if (!firstVisibleItem) firstVisibleItem = item;
          this.visibleListItems.push(item);
        }
      });
  
      firstVisibleItem.focus();
    }
  }
  
  handleBlur(ev) {
    window.requestAnimationFrame(() => {
      if (!this.shadowRoot.activeElement) {
        this.els.input.value = '';
        this.els.input.dispatchEvent(new CustomEvent('closeList'));
      }
    });
  }
  
  handleArrowKeysInList(ev){
    if (
      ev.keyCode !== this.KEY_CODE__DOWN
      && ev.keyCode !== this.KEY_CODE__UP
    ) return;
  
    ev.preventDefault();
  
    switch(ev.keyCode){
      case this.KEY_CODE__DOWN:
        this.itemIndex += 1;
        if (this.itemIndex === this.visibleListItems.length) this.itemIndex = 0;
        break;
  
      case this.KEY_CODE__UP:
        this.itemIndex--;
        if (this.itemIndex < 0) {
          this.els.input.focus();
          return;
        }
        break;
    }
  
    this.visibleListItems[this.itemIndex].focus();
  }
  
  handleItemSelection(ev) {
    const item = ev.target;
    this.els.input.value = '';
    this.els.input.dispatchEvent(new CustomEvent('closeList'));
    if (this._onSelect) this._onSelect(item);
    item.blur();
  }
  
  addListeners() {
    this.els.input.addEventListener('change', this.handleInputChange);
    this.els.input.addEventListener('closeList', this.handleInputChange);
    this.els.input.addEventListener('focus', this.handleInputChange);
    this.els.input.addEventListener('input', this.handleInputChange);
    this.els.input.addEventListener('keydown', this.handleMenuSelectionFromInput);
    this.els.list.addEventListener('keydown', this.handleArrowKeysInList);
    this.els.list.addEventListener('click', this.handleItemSelection);
    window.addEventListener('click', this.handleBlur);
  }
}

window.customElements.define('custom-auto-complete-input', CustomAutoCompleteInput);
