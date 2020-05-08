const API_BASE = '/api/marker';
const DOM_ID = 'mapContainer';
const LS_KEY = 'rdr2';
const MODIFIER__COMPLETED = 'is--completed';
const TILES_ABS_PATH = '/imgs/tiles';
const hiddenOverlays = {};
let completedMarkers = [];
let filteredSubTypes = [];
let lsData, mapBoundary, mapInst, mapLayers, markers, markerCreatorToggle, 
  subTypeFilterInput, subTypeFilterWrapper, typesLayerGroups;

const svgMarker = ({ markerSubType, markerType, uid }) => `
  <svg
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    x="0px"
    y="0px"
    height="100%"
    viewBox="0 -16 435.963 455.963"
    xml:space="preserve"
    class="marker-icon ${(lsData.completedMarkers.includes(uid)) ? MODIFIER__COMPLETED : ''}"
    data-sub-type="${markerSubType}"
    data-type="${markerType}"
    data-uid="${uid}"
  >
    <path
      stroke-width="2em"
      d="M213.285,0h-0.608C139.114,0,79.268,59.826,79.268,133.361c0,48.202,21.952,111.817,65.246,189.081
      c32.098,57.281,64.646,101.152,64.972,101.588c0.906,1.217,2.334,1.934,3.847,1.934c0.043,0,0.087,0,0.13-0.002
      c1.561-0.043,3.002-0.842,3.868-2.143c0.321-0.486,32.637-49.287,64.517-108.976c43.03-80.563,64.848-141.624,64.848-181.482
      C346.693,59.825,286.846,0,213.285,0z M274.865,136.62c0,34.124-27.761,61.884-61.885,61.884
      c-34.123,0-61.884-27.761-61.884-61.884s27.761-61.884,61.884-61.884C247.104,74.736,274.865,102.497,274.865,136.62z"
    />
  </svg>
`;

const _fetch = (url, opts = {}) => {
  const defaultOpts = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  };
  return fetch(url, { ...defaultOpts, ...opts, })
    .then(resp => resp.json())
    .catch(err => alert(`fetch: ${err.stack}`));
}
const deleteMarker = (uid) => _fetch(
  `${API_BASE}/delete`,
  { method: 'DELETE', body: JSON.stringify({ uid }) }
);
const loadMarkers = () => _fetch(`${API_BASE}/load-all`);
const saveMarker = (marker) => _fetch(
  `${API_BASE}/save`,
  { method: 'POST', body: JSON.stringify(marker) }
);
const updateMarker = (uid, data) => _fetch(
  `${API_BASE}/update`,
  { method: 'POST', body: JSON.stringify({ data, uid }) }
);

function handlePopupOpen(ev) {
  const popup = ev.popup;
  const marker = popup._source;
  const completedToggle = popup._wrapper.querySelector('.marker-popup__completed input');
  let markerNdx;
  
  for (let i=0; i<markers.length; i++) {
    if (markers[i].data.uid === marker.customData.uid) {
      markerNdx = i;
      break;
    }
  }
  
  const completedHandler = ({ currentTarget: { checked, value: uid } }) => {
    const { markerType } = marker.customData;
    const { data, lat, lng } = markers[markerNdx];
    
    (checked)
      ? completedMarkers.push(uid)
      : completedMarkers.splice(completedMarkers.indexOf(uid), 1);
    
    saveMapState();
    
    typesLayerGroups[markerType].removeLayer(marker);
    marker.remove();
    createMarker({ ...data, lat, lng });
  };
  
  // ensure events don't get bound multiple times
  completedToggle.removeEventListener('change', completedHandler);
  // add fresh handlers
  completedToggle.addEventListener('change', completedHandler);
  
  if (popup._wrapper.querySelector('.marker-popup__nav')) {
    const deleteBtn = popup._wrapper.querySelector('.marker-popup__delete-btn');
    const editBtn = popup._wrapper.querySelector('.marker-popup__edit-btn');
    const moveToggle = popup._wrapper.querySelector('[name="moveMarker"]');
    
    const deleteHandler = () => {
      if (markerNdx !== undefined) {
        const { markerType, uid } = markers[markerNdx].data;
        typesLayerGroups[markerType].removeLayer(marker);
        marker.remove();
        
        deleteMarker(uid)
          .then((newMarkers) => {
            markers = newMarkers;
            setFilterItems();
          })
          .catch((err) => { alert(`deleteMarker: ${err.stack}`); });
      }
    };
    const editHandler = () => {
      if (markerNdx !== undefined) {
        const { markerType } = marker.customData;
        const { lat, lng } = marker._latlng;
        
        typesLayerGroups[markerType].removeLayer(marker);
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
            const { uid } = marker.customData;
            updateMarker(uid, { lat, lng })
              .then((newMarkers) => { markers = newMarkers; })
              .catch((err) => { alert(`updateMarker: ${err.stack}`); });
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
  editable,
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
  const iconRadius = 30;
  const icon = L.divIcon({
    className: 'marker-icon-wrapper',
    html: svgMarker({
      markerSubType,
      markerType,
      uid,
    }),
    iconAnchor: [iconRadius/2, iconRadius],
    iconSize: [iconRadius, iconRadius],
    popupAnchor: [0, -iconRadius],
  });
  const marker = L.marker([lat, lng], { icon });
  let navMarkup = '';
  let ratingMarkup = '';
  
  if (!previewing && editable) navMarkup = `
    <nav class="marker-popup__nav">
      <label><input type="checkbox" name="moveMarker" /> Move</label>
      <button type="button" class="marker-popup__edit-btn">Edit</button>
      <button type="button" class="marker-popup__delete-btn">Delete</button>
    </nav>
  `;
  
  if (rating) ratingMarkup = `
    <span class="marker-popup__rating">${Array(+rating).fill('&#9733;').join('')}</span>
  `;
  
  const popupContent = `
    <h4 class="marker-popup__title">
      <span
        class="marker-popup__icon"
        data-sub-type="${markerSubType}"
        data-type="${markerType}"
      ></span>
      ${ratingMarkup} ${markerCustomSubType || markerSubType}
    </h4>
    <label class="marker-popup__completed">
      <input type="checkbox" value="${uid}" ${lsData.completedMarkers.includes(uid) ? 'checked' : ''} /> Completed
    </label>
    <p>${markerDescription || ''}</p>
    ${navMarkup}
  `;
  
  marker.bindPopup(popupContent);
  
  if (previewing) {
    marker.addTo(mapInst);
    marker.openPopup();
  }
  else typesLayerGroups[markerType].addLayer(marker);
  
  marker.customData = {
    markerSubType,
    markerType,
    uid,
  };
  
  return marker;
};

const saveMapState = () => {
  const data = {
    completedMarkers,
    hiddenOverlays,
    latlng: mapInst.getCenter(),
    zoom: mapInst.getZoom(),
  };
  window.localStorage.setItem(LS_KEY, JSON.stringify(data));
  lsData = data;
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
  const visibleTypeLayerGroups = [...MARKER_TYPES.keys()]
    .filter(type => hiddenOverlays[type] === undefined)
    .map(type => typesLayerGroups[type]);
  const addBackLayerGroups = () => {
    visibleTypeLayerGroups.forEach(lg => mapInst.addLayer(lg));
  };
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
      addBackLayerGroups();
    }
  };
  markerFlyout.title = 'Marker Creator';
  markerFlyout.show();
  
  visibleTypeLayerGroups.forEach(lg => mapInst.removeLayer(lg));
  
  const markerTypeInput = markerFlyout.shadowRoot.querySelector('#markerCreatorType');
  
  markerFlyout.shadowRoot.querySelector('#createMarker').addEventListener('click', () => {
    const formData = formDataToObj(markerFlyout.shadowRoot.querySelector('#markerCreator'));
    const uid = (editData && editData.uid) || `${performance.now()}`.replace('.', '');
    const data = { ...formData, editable: true, uid };
    
    (data.markerCustomSubType)
      ? delete data.markerSubType
      : delete data.markerCustomSubType;
    if (!data.markerDescription) delete data.markerDescription;
    
    if (window.previewMarker) window.previewMarker.remove();
    
    saveMarker({ data, lat, lng })
      .then((newMarkers) => {
        createMarker({ ...data, lat, lng });
        markers = newMarkers;
        setFilterItems();
        
        if (onUpdate) onUpdate();
        
        addBackLayerGroups();
        
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

function handleOverlayToggle({ name, type }) {
  if (type === 'overlayadd') delete hiddenOverlays[name];
  else hiddenOverlays[name] = true;
  
  saveMapState();
}

function renderMarkers(filter) {
  const clearedGroups = [];
  
  if (filter) {
    markers.forEach(({ data, lat, lng }, i) => {
      const { markerSubType, markerType } = data;
      // clear out all layers based on marker types that have been added
      if (!clearedGroups.includes(markerType)) {
        typesLayerGroups[markerType].clearLayers();
        clearedGroups.push(markerType);
      }
      // add a reference to the filter
      if (
        markerSubType === filter
        && !filteredSubTypes.includes(markerSubType)
      ) filteredSubTypes.push(markerSubType);
      // only add Markers that are filtered
      if (filteredSubTypes.includes(markerSubType)) createMarker({ ...data, lat, lng });
    });
  }
  else {
    filteredSubTypes = [];
    markers.forEach(({ data, lat, lng }, i) => {
      createMarker({ ...data, lat, lng });
    });
  }
}

function handleFilterSelect(filter) {
  const { subType, type } = filter.dataset;
  
  if (!filteredSubTypes.includes(subType)) {
    renderMarkers(subType);
    
    const filterTag = document.createElement('button');
          filterTag.className = 'filter-tag';
          filterTag.innerHTML = `
            <span 
              class="filter-tag__icon"
              data-sub-type="${subType}"
              data-type="${type}"
            ></span>
            ${subType}
            <span class="filter-tag__close">&#10005;</span>
          `;
          filterTag.dataset.subType = subType;
          filterTag.dataset.type = type;
    
    subTypeFilterWrapper.appendChild(filterTag);
  }
}

function handleFilterRemoval(ev) {
  const el = ev.target;
  
  if (el.classList.contains('filter-tag')) {
    const { subType, type } = el.dataset;
    const filterNdx = filteredSubTypes.indexOf(subType);
    
    filteredSubTypes.splice(filterNdx, 1);
    el.remove();
    typesLayerGroups[type].eachLayer((marker) => {
      if (marker.customData.markerSubType === subType) {
        typesLayerGroups[type].removeLayer(marker);
        marker.remove();
      }
    });
    
    // if no more filters are applied, show all Markers
    if (!filteredSubTypes.length) renderMarkers();
  }
}

function setFilterItems() {
  const added = [];
  const itemGroups = {};
  
  markers.forEach(({ data: { markerSubType, markerType } }) => {
    if (!added.includes(`${markerType}_${markerSubType}`)) {
      if (!itemGroups[markerType]) itemGroups[markerType] = [];
      itemGroups[markerType].push(markerSubType);
      added.push(`${markerType}_${markerSubType}`);
    }
  });
  
  subTypeFilterInput.items = Object.keys(itemGroups)
    .sort()
    .reduce((arr, markerType) => itemGroups[markerType]
      .sort()
      .reduce((combined, markerSubType) => {
        combined.push({
          attributes: {
            'data-sub-type': markerSubType,
            'data-type': markerType,
          },
          label: `<span class="filter-icon"></span><span class="filter-label">${markerSubType}</span>`,
          value: markerSubType,
        });
        return combined;
      }, arr)
    , []);
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
    completedMarkers = lsData.completedMarkers;
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
    
    typesLayerGroups = [...MARKER_TYPES].reduce((obj, [type]) => {
      obj[type] = L.layerGroup([]).addTo(mapInst);
      return obj;
    }, {});
    
    L.control.zoom({ position: 'bottomright' }).addTo(mapInst);
    L.control.layers({}, typesLayerGroups).addTo(mapInst);

    markerCreatorToggle = L.control.markerCreatorToggle({
      onChange: ({ currentTarget: toggle }) => {
        markerCreatorToggle.enabled = toggle.checked;
        
        if (markerCreatorToggle.enabled) mapEl.classList.add('marker-creator-enabled');
        else mapEl.classList.remove('marker-creator-enabled');
      },
      position: 'bottomright',
    }).addTo(mapInst);
    
    renderMarkers();
    
    subTypeFilterWrapper = document.createElement('div');
    subTypeFilterWrapper.className = 'filter-input-wrapper';
    subTypeFilterInput = document.createElement('custom-auto-complete-input');
    subTypeFilterInput.placeholder = 'Filter Markers';
    setFilterItems();
    subTypeFilterInput.onSelect = handleFilterSelect;
    subTypeFilterInput.styles = `
      .custom-autocomplete__list-item button {
        margin: 0;
        display: flex;
        align-items: center;
      }
      .custom-autocomplete__list-item button * {
        pointer-events: none;
      }
      
      .filter-icon {
        width: 2em;
        height: 1em;
        border: solid 3px;
        border-radius: 0.25em;
        margin-right: 1em;
        display: inline-block;
        box-shadow: 0 0 0px 1px #776245;
      }
      
      button[data-sub-type*="Legendary"] .filter-icon { border-color: var(--color__legendary); }
      button[data-type="Animal"] .filter-icon { background: var(--color__animal); }
      button[data-type="Cigarette Card"] .filter-icon { background: var(--color__cig-card); }
      button[data-type="Dino Bones"] .filter-icon { background: var(--color__dino-bones); }
      button[data-type="Dreamcatcher"] .filter-icon { background: var(--color__dreamcatcher); }
      button[data-type="Fish"] .filter-icon { background: var(--color__fish); }
      button[data-type="Hat"] .filter-icon { background: var(--color__hat); }
      button[data-type="Plant"] .filter-icon { background: var(--color__plant); }
      button[data-type="Point of Interest"] .filter-icon { background: var(--color__poi); }
      button[data-type="Rare Item"] .filter-icon { background: var(--color__rare-item); }
      button[data-type="Rock Carving"] .filter-icon { background: var(--color__rock-carving); }
      button[data-type="Treasure"] .filter-icon { background: var(--color__treasure); }
      button[data-type="Treasure Map"] .filter-icon { background: var(--color__treasure-map); }
      button[data-type="Weapon"] .filter-icon { background: var(--color__weapon); }
    `,
    subTypeFilterWrapper.appendChild(subTypeFilterInput);
    subTypeFilterWrapper.addEventListener('click', handleFilterRemoval);
    document.body.appendChild(subTypeFilterWrapper);

    mapInst.on('click', handleMapClick);
    mapInst.on('move', saveMapState);
    mapInst.on('overlayadd', handleOverlayToggle);
    mapInst.on('overlayremove', handleOverlayToggle);
    mapInst.on('popupopen', handlePopupOpen);
    mapInst.on('zoomend', saveMapState);
    
    Object.keys(lsData.hiddenOverlays).forEach((hiddenOverlay) => {
      const layerGroup = typesLayerGroups[hiddenOverlay];
      if (layerGroup) mapInst.removeLayer(layerGroup);
    });
  });
}

init();
