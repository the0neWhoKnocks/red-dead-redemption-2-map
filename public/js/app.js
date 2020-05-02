const LS_KEY = 'rdr2';
const DOM_ID = 'mapContainer';
const mapWrapper = document.createElement('div');
mapWrapper.className = 'map-wrapper';
const mapEl = document.createElement('div');
mapEl.className = 'map-container';
mapEl.id = DOM_ID;
mapWrapper.appendChild(mapEl);
document.body.prepend(mapWrapper);

const lsData = JSON.parse(window.localStorage.getItem(LS_KEY) || '{}');
const mapBoundary = L.latLngBounds(L.latLng(-144, 0), L.latLng(0, 176));
const TILES_ABS_PATH = 'file:./imgs/tiles';
const mapLayers = {
  'default': L.tileLayer(
    `${TILES_ABS_PATH}/{z}/{x}_{y}.jpg`,
    {
      noWrap: true,
      bounds: mapBoundary,
    }
  ),
};
const viewArgs = (lsData.latlng)
  ? [lsData.latlng, lsData.zoom]
  : [{ lat: -70, lng: 111.75 }, 3];
const MAP = L.map(DOM_ID, {
  attributionControl: false,
  crs: L.CRS.Simple,
  layers: [mapLayers['default']],
  maxZoom: 7,
  minZoom: 2,
  preferCanvas: true,
  zoomControl: false,
}).setView(...viewArgs);

L.control.zoom({
  position: 'bottomright'
}).addTo(MAP);

// L.control.layers(mapLayers).addTo(MAP);

window.addEventListener('resize', () => {
  if (window.customDialog) window.customDialog.close();
});

const saveMapState = () => {
  window.localStorage.setItem(LS_KEY, JSON.stringify({
    latlng: MAP.getCenter(),
    zoom: MAP.getZoom(),
  }));
};
const formDataToObj = (form) => [...(new FormData(form)).entries()].reduce((obj, arr) => {
  obj[arr[0]] = arr[1];
  return obj;
}, {});

MAP.on('move', saveMapState);
MAP.on('zoomend', saveMapState);

MAP.on('click', ({ latlng: { lat, lng } }) => {
  const genSelect = ({ id, name, opts } = {}) => `
    <select id="${id}" name="${name}">
      ${opts.map(label => `<option value="${label}">${label}</option>`).join('')}
    </select>
  `;
  const MODAL_WIDTH = 300;
  const MODIFIER__PREVIEWING_MARKER = 'is--previewing-marker';
  
  const dialog = document.createElement('custom-dialog');
  dialog.content = `
    <style>
      .marker-creator {
        width: calc(${MODAL_WIDTH}px + 2em);
        margin: 0;
      }
      
      .marker-creator input,
      .marker-creator select,
      .marker-creator textarea {
        width: ${MODAL_WIDTH}px;
        margin: 0 1em;
      }
      
      .marker-creator input,
      .marker-creator select,
      .marker-creator textarea {
        padding: 0.5em 1em;
      }
      
      .marker-creator select {
        -webkit-appearance: none;
      }
      
      .marker-creator__label {
        margin: 1em;
        display: block;
      }
      
      .marker-creator hr {
        margin: 1em;
      }
      
      .marker-creator__type-nav {
        padding: 0.5em;
        border-radius: 0.5em;
        border: inset 2px;
        border-color: #000 #8b8b8b #fff;
        margin: 1em;
        overflow-x: auto;
        background: #d8d8d8;
      }
      
      textarea.marker-creator__description {
        height: 100px;
        margin-bottom: 1em;
        resize: none;
      }
      
      .marker-creator__action-nav {
        display: flex;
      }
      
      .marker-creator__action-nav button {
        width: 50%;
        padding: 0.5em 1em;
      }
      
      .marker-creator__radio {
        display: none;
      }
      .marker-creator__radio:checked + .marker-creator__type {
        color: #eee;
        background: #333;
      }
      
      .marker-creator__type {
        padding: 0.5em 1em;
        border: solid 1px;
        border-radius: 1em;
        display: inline-block;
        cursor: pointer;
        background: #fff;
      }
      
      :host {
        opacity: 1;
        transition: opacity 300ms;
      }
      
      :host(.${MODIFIER__PREVIEWING_MARKER}) {
        opacity: 0;
      }
    </style>
    <form id="markerCreator" class="marker-creator">
      <label for="markerCreatorType" class="marker-creator__label">
        Select an appropriate type for the marker
      </label>
      ${genSelect({
        id: 'markerCreatorType',
        name: 'markerType',
        opts: ['Animal', 'Fish', 'Hat', 'Plant'],
      })}
      <hr />
      <div>
        <label for="markerCreatorSubType" class="marker-creator__label">
          Select an appropriate sub-type for the marker
        </label>
        ${genSelect({
          id: 'markerCreatorSubType',
          name: 'markerSubType',
          opts: ANIMALS,
        })}
        <label for="markerCreatorCustomSubType" class="marker-creator__label">
          Or define a custom sub-type
        </label>
        <input id="markerCreatorCustomSubType" type="text" name="markerCustomSubType" />
        <hr />
      </div>
      <label for="markerCreatorDescription" class="marker-creator__label">
        Enter a description for your marker
      </label>
      <textarea 
        id="markerCreatorDescription"
        class="marker-creator__description"
        name="markerDescription"
      ></textarea>
      <nav class="marker-creator__action-nav">
        <button type="button" id="previewMarker">Preview</button>
        <button type="button" id="createMarker">Create</button>
      </nav>
    </form>
  `;
  dialog.onClose = () => {
    if (window.previewMarker) window.previewMarker.remove();
  };
  dialog.title = 'Marker Creator';
  dialog.show();
  
  const createMarker = ({
    markerCustomSubType,
    markerDescription,
    markerSubType,
    markerType,
  }) => {
    const marker = L.marker([lat, lng]).addTo(MAP);
    
    if (markerDescription) marker.bindPopup(markerDescription).openPopup();
    
    // marker.on('click', (ev) => {
    //     console.log(e.latlng);
    // });
    
    return marker;
  };
  
  dialog.shadowRoot.querySelector('#createMarker').addEventListener('click', () => {
    const formData = formDataToObj(dialog.shadowRoot.querySelector('#markerCreator'));
    dialog.close();
  });
  dialog.shadowRoot.querySelector('#previewMarker').addEventListener('click', () => {
    const formData = formDataToObj(dialog.shadowRoot.querySelector('#markerCreator'));
    
    if (window.previewMarker) window.previewMarker.remove();
    window.previewMarker = createMarker(formData);
    dialog.classList.add(MODIFIER__PREVIEWING_MARKER);
    
    document.body.addEventListener('mousemove', () => {
      dialog.classList.remove(MODIFIER__PREVIEWING_MARKER);
    });
  });
  
  // const marker = L.circle(
  //   [lat, lng],
  //   {
  //     color: 'red',
  //     fillColor: '#f03',
  //     fillOpacity: 0.5,
  //     radius: 0.25,
  //   }
  // ).addTo(MAP);
});