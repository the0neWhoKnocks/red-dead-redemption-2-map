const API_BASE = '/api/marker';
const DOM_ID = 'mapContainer';
const LS_KEY = 'rdr2';
const TILES_ABS_PATH = '/imgs/tiles';
let lsData, mapBoundary, mapInst, mapLayers, markers, markerCreatorToggle;

const _fetch = (url, opts = {}) => {
  const defaultOpts = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  };
  return fetch(url, { ...defaultOpts, ...opts, })
    .then(resp => resp.json())
    .catch(err => alert(err));
}
const deleteMarker = (ndx) => _fetch(
  `${API_BASE}/delete`,
  { method: 'DELETE', body: JSON.stringify({ ndx }) }
);
const loadMarkers = () => _fetch(`${API_BASE}/load-all`);
const saveMarker = (marker) => _fetch(
  `${API_BASE}/save`,
  { method: 'POST', body: JSON.stringify(marker) }
);
const updateMarker = (ndx, data) => _fetch(
  `${API_BASE}/update`,
  { method: 'POST', body: JSON.stringify({ data, ndx }) }
);

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
        marker.remove();
        deleteMarker(markerNdx);
      }
    };
    const editHandler = () => {
      if (markerNdx !== undefined) {
        const { lat, lng } = marker._latlng;
        
        marker.remove();
        
        openMarkerCreator({
          ...markers[markerNdx],
          onCancel: () => {
            const { data, lat, lng } = markers[markerNdx];
            createMarker({ ...data, lat, lng });
          },
        });
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
            updateMarker(markerNdx, { lat, lng })
              .then((newMarkers) => { markers = newMarkers; })
              .catch(err => alert(err));
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
  rating,
  uid
}) => {
  const marker = L.marker([lat, lng], { uid }).addTo(mapInst);
  let navMarkup = '';
  let ratingMarkup = '';
  
  if (!previewing) navMarkup = `
    <nav class="marker-popup__nav">
      <label><input type="checkbox" name="moveMarker" /> Move</label>
      <button type="button" class="marker-popup__edit-btn">Edit</button>
      <button type="button" class="marker-popup__delete-btn">Delete</button>
    </nav>
  `;
  
  if (rating) ratingMarkup = `
    <span>${Array(+rating).fill('&#9733;').join('')}</span>
  `;
  
  const popupContent = `
    <h4>
      ${markerType}: ${ratingMarkup} ${markerCustomSubType || markerSubType}
    </h4>
    <p>${markerDescription || ''}</p>
    ${navMarkup}
  `;
  
  marker.bindPopup(popupContent);
  
  if (previewing) marker.openPopup();
  
  return marker;
};

const saveMapState = () => {
  window.localStorage.setItem(LS_KEY, JSON.stringify({
    latlng: mapInst.getCenter(),
    zoom: mapInst.getZoom(),
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
      
      .marker-creator__rating-section label {
        margin: 0;
        display: inline-block;
      }
      
      input[name="rating"] {
        width: 0px;
        margin: 0;
        padding: 0;
        opacity: 0;
      }
      [name="rating"] + label {
        cursor: pointer;
      }
      [name="rating"]:not(:checked) + label .full-star {
        display: none;
      }
      [name="rating"]:checked + label .empty-star {
        display: none;
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
        >${(editData && editData.markerDescription) ? editData.markerDescription : ''}</textarea>
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
  
  const markerTypeInput = markerFlyout.shadowRoot.querySelector('#markerCreatorType');
  
  markerFlyout.shadowRoot.querySelector('#createMarker').addEventListener('click', () => {
    const formData = formDataToObj(markerFlyout.shadowRoot.querySelector('#markerCreator'));
    const uid = (editData && editData.uid) || `${performance.now()}`.replace('.', '');
    const data = { ...formData, uid };
    
    (data.markerCustomSubType)
      ? delete data.markerSubType
      : delete data.markerCustomSubType;
    if (!data.markerDescription) delete data.markerDescription;
    
    if (window.previewMarker) window.previewMarker.remove();
    
    saveMarker({ data, lat, lng })
      .then((newMarkers) => {
        createMarker({ ...data, lat, lng });
        markers = newMarkers;
        
        if (onUpdate) onUpdate();
        
        markerCreated = true;
        markerFlyout.close();
      });
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
  markerTypeInput.addEventListener('change', (ev) => {
    const markerType = ev.currentTarget.value;
    
    markerFlyout.shadowRoot.querySelector('#markerCreatorSubType').outerHTML = genSelect({
      id: 'markerCreatorSubType',
      name: 'markerSubType',
      opts: MARKER_TYPES.get(markerType),
      selected: editData && editData.markerSubType,
    });
    
    let ratingSection;
    if (markerType === 'Animal') {
      ratingSection = document.createElement('div');
      ratingSection.className = 'marker-creator__rating-section';
      ratingSection.innerHTML = `
        <hr />
        <label class="marker-creator__label">
          Rating for animal:
        </label>
        ${[1, 2, 3].map((num) => {
          const checked = (editData && +editData.rating === num) ? 'checked' : ''
          return `
            <input id="starRating${num}" type="radio" name="rating" value="${num}" ${checked} />
            <label for="starRating${num}">
              <span class="empty-star">&#9734;</span>
              <span class="full-star">&#9733;</span>
            </label>
          `;
        }).join('')}
      `;
      
      markerFlyout.shadowRoot
        .querySelector('#markerCreatorCustomSubType')
        .after(ratingSection);
    }
    else {
      ratingSection = markerFlyout.shadowRoot.querySelector('.marker-creator__rating-section');
      if (ratingSection) ratingSection.remove();
    }
  });
  
  markerTypeInput.dispatchEvent(new Event('change'));
  
  // const marker = L.circle(
  //   [lat, lng],
  //   {
  //     color: 'red',
  //     fillColor: '#f03',
  //     fillOpacity: 0.5,
  //     radius: 0.25,
  //   }
  // ).addTo(mapInst);
}

function handleMapClick({ latlng: { lat, lng } }) {
  if (markerCreatorToggle.enabled) openMarkerCreator({ lat, lng });
}

function init() {
  loadMarkers().then((loadedMarkers) => {
    const mapWrapper = document.createElement('div');
          mapWrapper.className = 'map-wrapper';
    const mapEl = document.createElement('div');
          mapEl.className = 'map-container';
          mapEl.id = DOM_ID;
    mapWrapper.appendChild(mapEl);
    document.body.prepend(mapWrapper);
    
    lsData = JSON.parse(window.localStorage.getItem(LS_KEY) || '{}');
    markers = loadedMarkers;
    mapBoundary = L.latLngBounds(L.latLng(-144, 0), L.latLng(0, 176));
    mapLayers = {
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
    mapInst = L.map(DOM_ID, {
      attributionControl: false,
      crs: L.CRS.Simple,
      layers: [mapLayers['default']],
      maxZoom: 7,
      minZoom: 2,
      preferCanvas: true,
      zoomControl: false,
    }).setView(...viewArgs);

    L.control.zoom({ position: 'bottomright' }).addTo(mapInst);
    // L.control.layers(mapLayers).addTo(mapInst);

    markerCreatorToggle = L.control.markerCreatorToggle({
      onChange: ({ currentTarget: toggle }) => {
        markerCreatorToggle.enabled = toggle.checked;
        
        if (markerCreatorToggle.enabled) mapEl.classList.add('marker-creator-enabled');
        else mapEl.classList.remove('marker-creator-enabled');
      },
      position: 'bottomright',
    }).addTo(mapInst);
    
    markers.forEach(({ data, lat, lng }, i) => {
      createMarker({ ...data, lat, lng });
    });

    mapInst.on('click', handleMapClick);
    mapInst.on('move', saveMapState);
    mapInst.on('popupopen', handlePopupOpen);
    mapInst.on('zoomend', saveMapState);
  });
}

init();
