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
const markers = lsData.markers || [];
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

L.control.zoom({ position: 'bottomright' }).addTo(MAP);
// L.control.layers(mapLayers).addTo(MAP);

const markerCreatorToggle = L.control.markerCreatorToggle({
  onChange: ({ currentTarget: toggle }) => {
    markerCreatorToggle.enabled = toggle.checked;
  },
  position: 'bottomright',
}).addTo(MAP);

function handlePopupOpen(ev) {
  const popup = ev.popup;
  const marker = popup._source;
  
  if (popup._wrapper.querySelector('.marker-popup__nav')) {
    const deleteBtn = popup._wrapper.querySelector('.marker-popup__delete-btn');
    const editBtn = popup._wrapper.querySelector('.marker-popup__edit-btn');
    const moveToggle = popup._wrapper.querySelector('[name="moveMarker"]');
    let markerNdx;
    
    for (let i=0; i<markers.length; i++) {
      if (markers[i].data.uid === marker.options.uid) {
        markerNdx = i;
        break;
      }
    }
    
    const deleteHandler = () => {
      if (markerNdx !== undefined) {
        markers.splice(markerNdx, 1);
        marker.remove();
        saveMapState();
      }
    };
    const editHandler = () => {
      if (markerNdx !== undefined) {
        const { lat, lng } = marker._latlng;
        
        // temporarily remove current marker so there's no conflicts
        // markers.splice(markerNdx, 1);
        marker.remove();
        
        openMarkerCreator({
          ...markers[markerNdx],
          onCancel: () => {
            createMarker({ ...markers[markerNdx] });
          },
          onUpdate: () => {
            markers.splice(markerNdx, 1);
            console.log('-- update marker', markers);
          },
        });
        // markers.splice(markerNdx, 1);
        // marker.remove();
        // saveMapState();
      }
    };
    const moveHandler = (ev) => {
      if (ev.currentTarget.checked) {
        marker.dragging.enable();
        
        const dragEndHandler = () => {
          marker.dragging.disable();
          marker.off('dragend', dragEndHandler);
          
          if (markerNdx !== undefined) {
            const { lat, lng } = marker._latlng;
            markers[markerNdx].lat = lat;
            markers[markerNdx].lng = lng;
            saveMapState();
          }
        };
        marker.on('dragend', dragEndHandler);
      }
      else {
        marker.dragging.disable();
      }
    };
    
    // ensure events don't get bound multiple times
    deleteBtn.removeEventListener('click', deleteHandler);
    editBtn.removeEventListener('click', editHandler);
    moveToggle.removeEventListener('change', moveHandler);
    // add fresh handlers
    deleteBtn.addEventListener('click', deleteHandler);
    editBtn.addEventListener('click', editHandler);
    moveToggle.addEventListener('change', moveHandler);
  }
}
const createMarker = ({
  lat,
  lng,
  markerCustomSubType,
  markerDescription,
  markerSubType,
  markerType,
  previewing,
  uid
}) => {
  const marker = L.marker([lat, lng], { uid }).addTo(MAP);
  let navMarkup = '';
  
  if (!previewing) navMarkup = `
    <nav class="marker-popup__nav">
      <label><input type="checkbox" name="moveMarker" /> Move</label>
      <button type="button" class="marker-popup__edit-btn">Edit</button>
      <button type="button" class="marker-popup__delete-btn">Delete</button>
    </nav>
  `;
  
  const popupContent = `
    <h4>${markerType}: ${markerCustomSubType || markerSubType}</h4>
    <p>${markerDescription || ''}</p>
    ${navMarkup}
  `;
  
  marker.bindPopup(popupContent);
  
  if (previewing) marker.openPopup();
  
  return marker;
};

const saveMapState = () => {
  window.localStorage.setItem(LS_KEY, JSON.stringify({
    latlng: MAP.getCenter(),
    markers,
    zoom: MAP.getZoom(),
  }));
};
const formDataToObj = (form) => [...(new FormData(form)).entries()].reduce((obj, arr) => {
  obj[arr[0]] = arr[1];
  return obj;
}, {});

function openMarkerCreator({
  data: editData,
  lat,
  lng,
  onCancel,
  onUpdate,
}) {
  const genSelect = ({ id, name, opts, selected } = {}) => `
    <select id="${id}" name="${name}">
      ${opts.map(label => `
        <option value="${label}" ${(selected && selected === label) ? 'selected' : ''}>${label}</option>
      `).join('')}
    </select>
  `;
  const FLYOUT_WIDTH = 300;
  const MODIFIER__PREVIEWING_MARKER = 'is--previewing-marker';
  let markerCreated = false;
  
  const markerFlyout = document.createElement('custom-flyout');
  markerFlyout.content = `
    <style>
      :host {
        opacity: 1;
        transition: opacity 300ms;
      }
      
      :host(.${MODIFIER__PREVIEWING_MARKER}) {
        opacity: 0;
      }
      
      .marker-creator {
        width: calc(${FLYOUT_WIDTH}px + 2em);
        height: 100%;
        margin: 0;
        display: flex;
        flex-direction: column;
      }
      
      .marker-creator__body {
        height: 100%;
        overflow-x: hidden;
        overflow-y: auto;
        padding: 1em;
      }
      .marker-creator__body :last-child {
        margin-bottom: 0;
      }
      
      .marker-creator input,
      .marker-creator select,
      .marker-creator textarea {
        width: 100%;
        margin-bottom: 1em;
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
        margin-bottom: 1em;
        display: block;
      }
      
      .marker-creator hr {
        margin-bottom: 1em;
      }
      
      .marker-creator__sub-type-section {
        margin-bottom: 1em;
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
      
      .marker-creator__type {
        padding: 0.5em 1em;
        border: solid 1px;
        border-radius: 1em;
        display: inline-block;
        cursor: pointer;
        background: #fff;
      }
    </style>
    <form id="markerCreator" class="marker-creator">
      <div class="marker-creator__body">
        <label for="markerCreatorType" class="marker-creator__label">
          Select an appropriate type for the marker
        </label>
        ${genSelect({
          id: 'markerCreatorType',
          name: 'markerType',
          opts: [...MARKER_TYPES].map(([type]) => type),
          selected: editData && editData.markerType,
        })}
        <hr />
        <div class="marker-creator__sub-type-section">
          <label for="markerCreatorSubType" class="marker-creator__label">
            Select an appropriate sub-type for the marker
          </label>
          ${genSelect({
            id: 'markerCreatorSubType',
            name: 'markerSubType',
            opts: (editData && editData.markerType) ? MARKER_TYPES.get(editData.markerType) : MARKER_TYPES.values().next().value,
            selected: editData && editData.markerSubType,
          })}
          <label for="markerCreatorCustomSubType" class="marker-creator__label">
            Or define a custom sub-type
          </label>
          <input 
            id="markerCreatorCustomSubType"
            type="text"
            name="markerCustomSubType"
            value="${(editData && editData.markerCustomSubType) ? editData.markerCustomSubType : ''}"
          />
        </div>
        <hr />
        <label for="markerCreatorDescription" class="marker-creator__label">
          Enter a description for your marker
        </label>
        <textarea 
          id="markerCreatorDescription"
          class="marker-creator__description"
          name="markerDescription"
          value="${(editData && editData.markerDescription) ? editData.markerDescription : ''}"
        ></textarea>
      </div>
      <nav class="marker-creator__action-nav">
        <button type="button" id="previewMarker">Preview</button>
        <button type="button" id="createMarker">${(editData) ? 'Update' : 'Create'}</button>
      </nav>
    </form>
  `;
  markerFlyout.onClose = () => {
    if (!markerCreated) {
      if (window.previewMarker) window.previewMarker.remove();
      if (onCancel) onCancel();
    }
  };
  markerFlyout.title = 'Marker Creator';
  markerFlyout.show();
  
  markerFlyout.shadowRoot.querySelector('#createMarker').addEventListener('click', () => {
    const formData = formDataToObj(markerFlyout.shadowRoot.querySelector('#markerCreator'));
    const uid = (editData && editData.uid) || `${performance.now()}`.replace('.', '');
    const data = { ...formData, uid };
    
    (data.markerCustomSubType)
      ? delete data.markerSubType
      : delete data.markerCustomSubType;
    if (!data.markerDescription) delete data.markerDescription;
    
    if (window.previewMarker) window.previewMarker.remove();
    
    createMarker({ ...data, lat, lng });
    markers.push({ data, lat, lng });
    
    if (onUpdate) onUpdate();
    
    saveMapState();
    
    markerCreated = true;
    markerFlyout.close();
  });
  markerFlyout.shadowRoot.querySelector('#previewMarker').addEventListener('click', () => {
    const formData = formDataToObj(markerFlyout.shadowRoot.querySelector('#markerCreator'));
    
    if (window.previewMarker) window.previewMarker.remove();
    window.previewMarker = createMarker({ ...formData, lat, lng, previewing: true });
    markerFlyout.classList.add(MODIFIER__PREVIEWING_MARKER);
    
    document.body.addEventListener('mousemove', () => {
      markerFlyout.classList.remove(MODIFIER__PREVIEWING_MARKER);
    });
  });
  markerFlyout.shadowRoot.querySelector('#markerCreatorType').addEventListener('change', (ev) => {
      markerFlyout.shadowRoot.querySelector('#markerCreatorSubType').outerHTML = genSelect({
      id: 'markerCreatorSubType',
      name: 'markerSubType',
      opts: MARKER_TYPES.get(ev.currentTarget.value),
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
}

function handleMapClick({ latlng: { lat, lng } }) {
  if (markerCreatorToggle.enabled) openMarkerCreator({ lat, lng });
}

markers.forEach(({ data, lat, lng }, i) => {
  createMarker({ ...data, lat, lng });
});

MAP.on('click', handleMapClick);
MAP.on('move', saveMapState);
MAP.on('popupopen', handlePopupOpen);
MAP.on('zoomend', saveMapState);
