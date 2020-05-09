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

const svgMarker = ({ markerSubType, markerType, uid }) => {
  const icons = {
    Animal: `
      <path stroke-width="2px"
        d="M 46 29.45 Q 46.93515625 28.2564453125 48.55 26.55 50.2146484375 24.843359375 49.15 20.35 48.094921875 15.9021484375 46.45 12.4 L 50.7 1 40.45 5.4 Q 35.85 2.25 29.95 2.25 29.7 2.25 29.55 2.25 23.75 2.4 19.5 5.4 L 9.3 1 13.55 12.4 Q 11.898046875 15.89453125 10.75 20.35 9.65546875 24.8158203125 11.5 26.45 13.3943359375 28.083984375 14.15 29.35 14.9517578125 30.6552734375 15.65 32.1 22.5 46.4 29.15 59.1 29.9 60.2 30.85 59.05 37.5 46.25 44.4 31.95 45.0548828125 30.64765625 46 29.45 Z"
      />
      <path fill="#000000" fill-opacity="0.4980392156862745" stroke="none"
        d="M 45.75 29.25 Q 44.6 31.2 42.85 32.9 37.4 38.15 29.95 38.15 29.7 38.15 29.55 38.15 22.2 37.9 17.15 32.9 15.4 31.15 14.25 29.15 14.95 30.65 15.65 32.1 22.15 39.65 28.5 46.75 29.85 47.85 31.4 46.65 37.85 39.55 44.4 31.95 45.05 30.65 45.75 29.25 Z"
      />
    `,
    'Cigarette Card': `
      <path stroke-width="2px"
        d="M 36.85 47 L 23.05 47 Q 26.216796875 53.176171875 29.25 59 29.9 59.95 30.7 58.95 33.7318359375 53.1564453125 36.85 47 Z"
      />
      <path stroke-width="2px"
        d=" M 41.95 46.15 Q 40.35 28.85 44 0.9 L 20.65 8.65 Q 16.95 32.35 18.6 54 L 41.95 46.15 M 19.9 28.65 Q 20 27.45 20.1 26.25 20.65 18.35 21.85 10.35 L 41.6 3.7 Q 40.3 13.35 39.8 23.05 39.75 24.45 39.65 26 39.6 27 39.55 28.15 39.5 30.15 39.5 32.3 39.45 36 39.5 39.65 L 19.7 46.2 Q 19.65 42.35 19.6 38.9 19.65 36.6 19.75 34.4 19.7 33.2 19.8 32.1 19.85 30.25 19.9 28.65 M 28.95 26.25 Q 28.5 26.25 28.05 26.25 L 27.45 34.35 28.8 39.95 29.95 34.2 28.95 26.25 M 28.05 26.25 Q 28.5 26.25 28.95 26.25 30.45 26 31.8 24.8 L 31.8 22.35 27.3 25 26.05 23.7 25.9 25.7 Q 27.05 26.15 28.05 26.25 M 25.8 27.85 L 27.45 34.35 28.05 26.25 Q 27.05 26.15 25.9 25.7 L 25.85 26.35 25.8 27.85 M 31.5 25.8 L 31.8 24.8 Q 30.45 26 28.95 26.25 L 29.95 34.2 31.5 25.8 M 19.8 32.1 Q 19.7 33.2 19.75 34.4 19.65 36.6 19.6 38.9 19.65 42.35 19.7 46.2 L 39.5 39.65 Q 39.45 36 39.5 32.3 39.5 30.15 39.55 28.15 39.6 27 39.65 26 L 31.8 24.8 31.5 25.8 29.95 34.2 28.8 39.95 27.45 34.35 25.8 27.85 25.85 26.35 19.8 32.1 M 26.65 14.8 L 27.85 15.6 31.35 14.25 32.45 15.6 32.4 17.9 33.05 18.3 Q 34.15 16.4 33.7 14.35 34 13.75 33.9 13.55 32.75 10.75 28.85 11.6 24.9 12.5 25.85 15.45 L 26.65 14.8 M 25.3 22.95 L 25.85 15.45 Q 24.9 12.5 28.85 11.6 32.75 10.75 33.9 13.55 34 13.75 33.7 14.35 34.15 16.4 33.05 18.3 L 32.75 21.8 31.8 22.35 31.8 24.8 39.65 26 Q 39.75 24.45 39.8 23.05 40.3 13.35 41.6 3.7 L 21.85 10.35 Q 20.65 18.35 20.1 26.25 20 27.45 19.9 28.65 19.85 30.25 19.8 32.1 L 25.85 26.35 25.9 25.7 26.05 23.7 25.3 22.95 M 25.85 15.45 L 25.3 22.95 26.05 23.7 27.3 25 31.8 22.35 32.75 21.8 33.05 18.3 32.4 17.9 32.45 15.6 31.35 14.25 27.85 15.6 26.65 14.8 25.85 15.45 M 27.8 20.6 L 26.1 21.15 27.9 19.8 30.5 20.75 27.8 20.6 M 26.1 21.15 L 27.8 20.6 30.5 20.75 27.9 19.8 26.1 21.15 Z"
      />
      <path fill="#FFFFFF" fill-opacity="0.50" stroke="none"
        d="M 41.95 46.15 Q 40.35 28.85 44 0.9 L 20.65 8.65 Q 16.95 32.35 18.6 54 L 41.95 46.15 M 19.9 28.65 Q 20 27.45 20.1 26.25 20.65 18.35 21.85 10.35 L 41.6 3.7 Q 40.3 13.35 39.8 23.05 39.75 24.45 39.65 26 39.6 27 39.55 28.15 39.5 30.15 39.5 32.3 39.45 36 39.5 39.65 L 19.7 46.2 Q 19.65 42.35 19.6 38.9 19.65 36.6 19.75 34.4 19.7 33.2 19.8 32.1 19.85 30.25 19.9 28.65 M 27.25 46.3 L 39.4 42.3 27.25 46.3 M 20.1 48.65 L 24.9 47 20.1 48.65 M 22.25 50.3 L 36.8 45.45 22.25 50.3 M 25.8 27.85 L 27.45 34.35 28.05 26.25 Q 27.05 26.15 25.9 25.7 L 25.85 26.35 25.8 27.85 M 31.5 25.8 L 31.8 24.8 Q 30.45 26 28.95 26.25 L 29.95 34.2 31.5 25.8 Z"
      />
      <path fill="#000000" fill-opacity="0.25" stroke="none"
        d="M 28.05 26.25 Q 28.5 26.25 28.95 26.25 30.45 26 31.8 24.8 L 31.8 22.35 27.3 25 26.05 23.7 25.9 25.7 Q 27.05 26.15 28.05 26.25 Z"
      />
      <path fill="#000000" fill-opacity="0.50" stroke="none"
        d="M 19.6 38.9 Q 19.65 42.35 19.7 46.2 L 39.5 39.65 Q 39.45 36 39.5 32.3 39.5 30.15 39.55 28.15 39.6 27 39.65 26 L 31.8 24.8 31.5 25.8 29.95 34.2 28.95 26.25 Q 28.5 26.25 28.05 26.25 L 27.45 34.35 25.8 27.85 25.85 26.35 19.8 32.1 Q 19.7 33.2 19.75 34.4 19.65 36.6 19.6 38.9 M 26.65 14.8 L 27.85 15.6 31.35 14.25 32.45 15.6 32.4 17.9 33.05 18.3 33.1 18.3 Q 34.15 16.4 33.7 14.35 34 13.75 33.9 13.55 32.75 10.75 28.85 11.6 24.9 12.5 25.85 15.45 L 26.65 14.8 M 27.9 19.8 L 26.1 21.15 27.8 20.6 30.5 20.75 27.9 19.8 Z"
      />
      <path fill="#FFFFFF" fill-opacity="0.25" stroke="none"
        d="M 25.85 15.45 L 25.3 22.95 26.05 23.7 27.3 25 31.8 22.35 32.75 21.8 33.1 18.3 33.05 18.3 32.4 17.9 32.45 15.6 31.35 14.25 27.85 15.6 26.65 14.8 25.85 15.45 M 26.1 21.15 L 27.9 19.8 30.5 20.75 27.8 20.6 26.1 21.15 Z"
      />
    `,
    'Dino Bones': `
      <path stroke-width="2px"
        d="M 56.55 8.85 Q 54.25 3.85 48.4 3.35 37.65 2.5 28.95 5.5 20.7 8.3 14.7 14.35 11.05 15.9 7.7 18.45 4.15 21.1 3.25 23.25 1.8 26.7 2.6 30.35 3.1 32.6 5.05 36.25 5.3060546875 36.2607421875 5.55 36.25 6.674609375 36.259375 7.55 36 7.8892578125 35.9275390625 8.2 35.8 9.16953125 35.3611328125 9.75 34.55 10.76015625 34.706640625 11.75 34.75 12.155859375 34.7994140625 12.55 34.8 14.1921875 34.844140625 15.75 34.6 16.4208984375 34.533984375 17.05 34.4 18.3556640625 34.1275390625 19.6 33.65 19.7603515625 33.6271484375 19.9 33.55 L 21.3 33.7 24.05 33.95 28.2 34.3 Q 32.34453125 33.5546875 34.75 30.2 37.35 27.45 38.95 27.25 40.75 26.95 42 29.8 L 41.3 33.3 Q 38.6130859375 27.5599609375 35.9 32.55 L 32.05 34.65 31.05 37.6 Q 28.7970703125 38.9517578125 26.95 40.05 25.85625 40.7068359375 24.9 41.25 24.088671875 41.746484375 23.4 42.15 22.276171875 42.78515625 21.45 43.25 21.397265625 43.2736328125 21.35 43.3 20.5060546875 43.77265625 19.7 44.2 18.5568359375 44.7927734375 17.45 45.3 16.62578125 45.7021484375 15.8 46.05 15.0013671875 46.4009765625 14.2 46.7 13.18984375 47.0900390625 12.2 47.4 L 19.9 50.1 Q 21.57421875 48.9369140625 23.55 47.9 26.4392578125 53.6033203125 29.25 59 29.9 59.95 30.7 58.95 34.712109375 51.2830078125 38.85 42.95 40.43203125 42.7955078125 41.6 42.9 43.65 43.1 45.8 41.95 48.35 40.6 48.5 38.3 48.45 35.65 48.5 34.75 48.6 33.25 49.55 32.35 50.2 31.8 52.9 31.75 55.55 31.1 56.35 27.4 59.3 14.95 56.55 8.85 M 43.9 12.5 Q 44.55 15.7 42.95 18.2 41.1 21.05 36.7 22.15 31.45 23.45 27.85 22.1 24.5 20.85 25 18.3 25.65 15.8 28.1 13.35 30.55 10.85 33.85 9.45 37.95 7.75 40.2 8.35 42.55 9.05 43.9 12.5 M 6.7 23.9 Q 7.45 22.95 9.75 21.4 11.85 19.95 13.85 19.75 16 19.55 16.7 21 17.4 22.35 17 23.95 16.55 25.7 14.8 26.4 13 27.1 9.95 27.3 6.35 27.45 6.1 26.2 5.85 24.95 6.7 23.9 M 20.45 16.9 Q 21.4 16.05 22.2 16.05 20.95 18.65 21.4 21.3 19.45 20.45 19.45 18.55 19.45 17.75 20.45 16.9 M 31.8 44.6 Q 33.0353515625 44.2169921875 34.15 43.9 30.830859375 48.8875 30.05 53.85 29.479296875 49.6607421875 26.5 46.5 28.9572265625 45.474609375 31.8 44.6 M 17.45 45.3 Q 18.5568359375 44.7927734375 19.7 44.2 L 15.4 41.65 17.45 45.3 M 20.3 40.85 L 21.45 43.25 Q 22.276171875 42.78515625 23.4 42.15 L 20.3 40.85 M 23.8 38.8 L 24.9 41.25 Q 25.85625 40.7068359375 26.95 40.05 L 23.8 38.8 M 12.1 44.75 L 14.2 46.7 Q 15.0013671875 46.4009765625 15.8 46.05 L 12.1 44.75 M 21.3 33.7 L 22.85 35.5 24.05 33.95 21.3 33.7 M 7.55 36 Q 6.674609375 36.259375 5.55 36.25 L 7.2 39.1 7.55 36 M 9.75 34.55 Q 9.16953125 35.3611328125 8.2 35.8 L 12.5 40.5 11.75 34.75 Q 10.76015625 34.706640625 9.75 34.55 M 15.75 34.6 Q 14.1921875 34.844140625 12.55 34.8 L 15.3 37.4 15.75 34.6 M 17.05 34.4 L 19.1 37.1 19.6 33.65 Q 18.3556640625 34.1275390625 17.05 34.4 Z"
      />
    `,
    Dreamcatcher: `
      <path stroke-width="2px"
        d="M 48.3 19.65 Q 48.3 12.05 43 6.6 37.65 1.4 30 1.4 22.4 1.4 16.95 6.6 11.75 12.05 11.75 19.65 11.75 24.3 13.7 28.05 14.4078125 29.5052734375 15.1 30.95 7.66015625 37.695703125 4.45 45.7 1.05 55.2 10.25 50.3 13.95 47.85 16.75 44.95 16.55 46.75 16.65 48.5 17.2 55.25 21.2 50 24.852734375 43.941796875 24.55 37.35 L 27.05 37.9 Q 29.25 42 28.1 46.95 27.15 50.9 25.6 51.95 27.446484375 55.5373046875 29.25 59 29.9 59.95 30.7 58.95 32.4634765625 55.5802734375 34.25 52.1 31.5 49 31.85 43.35 32.181640625 38.0423828125 34.8 35.95 35.0078125 38.9541015625 36.7 41.75 38.95 44.7 39.25 40.9 39.3 39.95 39.2 38.95 40.75 40.55 42.85 41.95 48 44.7 46.1 39.35 44.6228515625 35.7244140625 41.6 32.55 42.8017578125 31.5677734375 44.15 29.95 45.85 27.95 47.1 24.75 48.3 21.65 48.3 19.65 M 20.6 5.9 L 24 11.1 Q 21.301953125 12.9017578125 20.2 16.3 L 14.3 15.2 Q 15.3939453125 9.9892578125 20.6 5.9 M 29.8 11.4 Q 29.9 11.4 30 11.4 33.4 11.4 35.9 13.7 38.3 16.15 38.3 19.55 38.3 23.05 35.9 25.4 33.4 27.8 30 27.8 29.9 27.8 29.8 27.8 26.45 27.7 24.15 25.4 21.75 23.05 21.75 19.55 21.75 16.15 24.15 13.7 26.45 11.45 29.8 11.4 M 37.2 12.3 Q 37.00546875 11.7146484375 34.1 10.45 31.24453125 9.1853515625 29.8 9.5 L 31.2 3.2 Q 37.39375 3.5671875 40.7 6.7 L 37.2 12.3 M 28.1 9.1 Q 26.8 9.4505859375 25.7 10.3 L 22.8 4.6 Q 23.55 4.1 25.9 3.5 28.25 2.9 29.1 2.9 L 28.1 9.1 M 41.9 7.9 L 44 11.4 39 13.5 41.9 7.9 M 45.6 14.5 Q 47.124609375 17.445703125 46.6 20.8 44.9671875 30.29609375 36.9 27.5 42.8458984375 21.2943359375 39.6 15.7 42.25 14.223046875 45.6 14.5 M 14.4 19.6 L 20 20.2 Q 20.0185546875 23.1345703125 22.2 26.05 20.6904296875 26.4552734375 18.25 28.3 17.4634765625 28.9166015625 16.7 29.55 14.8599609375 27.7072265625 13.95 23.85 13 19.6 14.4 19.6 M 24.55 30 L 24.8 29.45 32.05 30.9 30.2 36.2 24.25 34.75 Q 24.0880859375 33.995703125 23.9 33.4 23.95 33.15 24.05 32.9 24.4353515625 31.27734375 24.55 30 Z"
      />
    `,
    Fish: `
      <path stroke-width="2px"
        d="M 41 36.25 Q 46.6208984375 26.812890625 47.45 24.75 L 16.1 32.95 Q 25.4443359375 46.751953125 29.25 59 29.9 59.95 30.7 58.95 35.439453125 45.732421875 41 36.25 Z"
      />
      <path fill="#000000" fill-opacity="0.5098039215686274" stroke="none"
        d="M 41 36.25 Q 46.6208984375 26.812890625 47.45 24.75 L 16.1 32.95 Q 20.3560546875 39.236328125 23.45 45.2 29.155078125 53.256640625 36.3 45.2 38.5990234375 40.3828125 41 36.25 Z"
      />
      <path stroke-width="2px"
        d="M 43.9 15.3 Q 42.95 14.65 40.6 12.85 38.6 11.4 37.4 10.7 36.85 10.3 36.2 10.05 35.1 6.45 36.85 2.15 27.65 3.45 23.8 7.05 23.5 7 23.3 7 15.95 6.8 9.95 12.05 5.7 15.75 1.25 23.15 4.65 30.55 10 34.8 15.1 38.8 21.3 39.4 21.35 39.4 21.45 39.45 21.4875 39.45 21.5 39.45 21.560546875 39.4529296875 21.6 39.45 L 21.6 39.45 33.6 36.75 33.35 36.85 30 38.8 Q 32.85 37.85 33.65 36.7 35.05 36 35.7 35.55 38.95 35 41 34.85 42.75 34.7 43.55 34.85 42.45 32.6 43.1 29.7 43.75 29.1 44.5 28.4 45.85 27.2 47.4 27.15 48.95 27.1 51.25 28.25 52.45 28.8 54.15 31 56 33.5 57.15 36.4 58.3 31 56.95 26.6 55.95 23.3 57 21.5 57.4 21.8 58.35 16.9 59.25 12.5 58.3 9 55.45 16.25 52.7 17.45 51.5 18 49.4 17.6 46.7 17.2 43.9 15.3 Z"
      />
      <path fill="#000000" fill-opacity="0.7490196078431373" stroke="none"
        d="M 17.75 23.55 Q 18.85 22.5 18.85 20.95 18.85 19.4 17.75 18.25 16.65 17.2 15.1 17.2 13.55 17.2 12.4 18.25 11.35 19.4 11.35 20.95 11.35 22.5 12.4 23.55 13.55 24.7 15.1 24.7 16.65 24.7 17.75 23.55 Z"
      />
      <path fill="#000000" fill-opacity="0.3176470588235294" stroke="none"
        d="M 43.1 29.7 Q 43.6900390625 29.15546875 44.35 28.5 14.4607421875 35.5490234375 2.25 25.2 5.414453125 31.1572265625 10 34.8 15.1 38.8 21.3 39.4 28.8435546875 39.857421875 35.7 35.55 38.95 35 41 34.85 42.75 34.7 43.55 34.85 42.45 32.6 43.1 29.7 M 51.25 28.25 Q 52.45 28.8 54.15 31 56 33.5 57.15 36.4 58.3 31 56.95 26.6 56.7154296875 25.82578125 56.45 25.2 52.6203125 26.3982421875 49 27.35 50.0162109375 27.633203125 51.25 28.25 Z"
      />
    `,
    Hat: `
      <path stroke-width="2px"
        d="M 44.75 30 L 43.5 19.6 Q 38.55 17.15 31.9 18.6 L 30 20.9 27.85 18.6 Q 22.45 17.15 17.3 19.6 L 15.45 30 Q 30.4849609375 33.8498046875 44.75 30 M 42.55 43.4 Q 48 40.8 57.6 34.4 L 55.2 33.2 45.3 38 Q 30.8 44.9 14.7 37.2 L 5.8 33.2 3.2 34.6 Q 19.8 47.3 30.35 46.9 35.8 46.65 42.55 43.4 M 45.3 38 L 44.75 30 Q 30.4849609375 33.8498046875 15.45 30 L 14.7 37.2 Q 30.8 44.9 45.3 38 Z"
      />
      <path stroke-width="2px"
        d="M 36.05 47.8 Q 29.6 49.6 23.9 47.8 24.75 49.45 26.6 53.5 28.35 57.25 29.25 59 29.9 59.95 30.7 58.95 31.6 57.2 33.35 53.45 35.2 49.45 36.05 47.8 Z"
      />
      <path fill="#000000" fill-opacity="0.4980392156862745" stroke="none"
        d="M 45.3 38 L 44.75 30 Q 30.4849609375 33.8498046875 15.45 30 L 14.7 37.2 Q 30.8 44.9 45.3 38 Z"
      />
    `,
    Plant: `
      <path stroke-width="2px"
        d="M 49.3 36 Q 47.40703125 35.376953125 44.05 36.85 40.481640625 38.46875 39.45 41.5 40.30546875 36.412890625 39.25 32.65 38.05 28.3 36.6 25.3 36.343359375 24.769140625 36.1 24.3 35.8404296875 26.0861328125 35 28.15 L 34.35 29.35 35.2 30.5 Q 36.1 32 36.4 33.95 36.95 37.7 36.5 41.3 36.3201171875 42.6234375 36 43.8 34.1916015625 40.9095703125 31.25 40.95 28.291796875 40.6953125 24.5 44.7 L 22.45 47.8 Q 25.9201171875 44.3833984375 28.8 44.75 32.4056640625 45.4318359375 34.25 47.85 32.05 49.05 30.15 51.65 28.75 53.55 28.45 54.95 28.05 56.9 29.25 59 29.55 59.5 29.9 59.45 30.15 59.4 30.7 58.95 31.45 58.35 31.2 56.55 30.85 54.55 32.4 52.5 33.8 50.65 37.75 47.45 41.75 44.2 43.4 42.05 44.75 40.4 46.65 39.8 48.35 39.3 50.25 39.65 L 55.15 41.95 Q 53.519921875 37.877734375 49.3 36 M 45 9.2 Q 44.590625 6.9744140625 42.05 6.8 L 39.7 6.85 Q 38.653125 5.0212890625 36.15 5.8 32.6828125 6.7392578125 33.3 9.95 34.1958984375 11.4626953125 34.8 13.4 34.1958984375 11.4626953125 33.3 9.95 31.445703125 6.901953125 28.35 5.65 27.0775390625 4.7875 23.7 5.5 20.36015625 6.2572265625 16.15 9.5 15.967578125 9.6396484375 15.8 9.75 23.6955078125 4.7935546875 31 14.4 23.6955078125 4.7935546875 15.8 9.75 13.0896484375 12.0517578125 14.2 14.55 L 16 14.4 Q 21.221484375 11.416796875 26.8 13.4 21.221484375 11.416796875 16 14.4 11.916796875 18.4875 10.25 22.55 7.6623046875 28.4314453125 10.8 34.55 L 13.6 30 Q 14.929296875 24.2484375 20.15 19.25 24.82109375 15.8263671875 28 17.6 24.82109375 15.8263671875 20.15 19.25 14.929296875 24.2484375 13.6 30 10.9791015625 38.7841796875 14.8 43.4 19.044140625 35.158203125 24.1 30.2 22.89921875 21.010546875 29 18.8 22.89921875 21.010546875 24.1 30.2 24.859765625 35.9203125 29.15 38.85 L 34.35 29.35 35 28.15 Q 35.8404296875 26.0861328125 36.1 24.3 36.380078125 22.75703125 36.2 21.4 35.944140625 19.1927734375 33.4 17.6 35.944140625 19.1927734375 36.2 21.4 38.012890625 21.126171875 39.5 21.35 41.5271484375 21.646875 41.75 21.7 41.973046875 21.758984375 45.2 22.7 48.4822265625 23.6287109375 52.6 28.7 52.1580078125 21.391796875 44.15 15.95 40.2 14.65 39.55 14.5 36.16953125 14.3447265625 34.2 15.6 36.16953125 14.3447265625 39.55 14.5 L 39.85 12.75 Q 40.4646484375 10.471875 42.7 11.9 40.4646484375 10.471875 39.85 12.75 L 43.05 14.65 44.6 15.65 Q 45.563671875 12.9888671875 45 9.2 Z"
      />
    `,
    'Point of Interest': `
      <path stroke-width="2px"
        d="M 28.3 2.3 Q 24.45 2.3 20.55 4.25 13.95 7.6 13.95 15 13.95 20.25 17.5 24.5 19.3 26.65 21.65 28.45 22.9 29.95 23 31.15 L 23 37 24.3 38.95 Q 23.15 39.5 22.45 40.9 21.8 42.25 21.75 44.05 21.8 45.15 22.65 46.95 23.55 48.8 23.6 49.9 23.7 52.65 25.3 55.75 27.3 59.6 30 59.7 31.45 59.75 34 53.85 36.75 47.5 34.2 44.55 34.1 43.1 34.35 40.85 34.65 37.95 34.7 37.2 34.8 34.65 36.15 32.95 36.75 32.2 39.2 30.15 43.75 26.35 44.55 19.85 45.8 9.95 38.05 5.25 33.25 2.3 28.3 2.3 Z"
      />
      <path fill="#000000" fill-opacity="0.4980392156862745" stroke="none"
        d="M 28.3 2.3 Q 24.45 2.3 20.55 4.25 13.95 7.6 13.95 15 13.95 20.25 17.5 24.5 19.3 26.65 21.65 28.45 22.9 29.95 23 31.15 L 23 37 24.3 38.95 Q 23.15 39.5 22.45 40.9 21.8 42.25 21.75 44.05 21.8 45.15 22.65 46.95 23.55 48.8 23.6 49.9 23.7 52.65 25.3 55.75 27.3 59.6 30 59.7 31.45 59.75 34 53.85 36.75 47.5 34.2 44.55 34.1 43.1 34.35 40.85 34.65 37.95 34.7 37.2 34.8 34.65 36.15 32.95 36.75 32.2 39.2 30.15 43.75 26.35 44.55 19.85 45.8 9.95 38.05 5.25 33.25 2.3 28.3 2.3 M 34.5 4.8 Q 37.3 6 38.95 8.35 40.65 10.7 40.7 14 40.65 17.9 39.05 20.5 37.55 23.1 35.6 24.7 34.15 25.85 32.9 27.05 31.6 28.2 30.8 30.2 30 32.2 29.95 35.8 L 24.3 35.8 24.3 32.3 Q 24.35 29.4 25.55 27.15 26.7 24.9 28.3 22.95 29.85 21 31.05 19.1 32.25 17.15 32.3 14.85 32.3 12.05 30.9 10.1 29.55 8.15 26.4 8.05 24.5 8.1 23.3 9 22.1 9.85 21.6 11 21.1 12.15 21.1 13 21.1 13.75 21.5 14.2 21.9 14.65 22.8 14.8 24.2 15 25.15 16.1 26.1 17.15 26.15 18.9 26.1 20.8 24.65 22.25 23.25 23.7 21.15 23.8 18.4 23.75 16.8 21.3 15.25 18.9 15.2 14.85 15.3 11.15 17.15 8.65 19 6.1 21.95 4.85 24.9 3.55 28.25 3.55 31.65 3.55 34.5 4.8 M 24.3 40.65 Q 25.45 39.3 27.15 39.3 28.85 39.3 30.05 40.65 31.3 42.05 31.35 44.05 31.35 46.15 30.1 47.45 28.9 48.8 27.2 48.85 25.5 48.8 24.3 47.45 23.1 46.15 23.05 44.05 23.1 42.05 24.3 40.65 Z"
      />
    `,
    'Rare Item': `
      <path stroke-width="2px"
        d="M 30 11.05 L 40 25.6 44.65 11.05 30 11.05 M 40 25.6 L 20 25.6 30 59.2 40 25.6 M 30 11.05 L 20 25.6 40 25.6 30 11.05 M 2.25 25.6 L 2.15 25.8 29.9 59.35 30 59.2 20 25.6 2.25 25.6 M 57.85 25.8 L 57.7 25.6 40 25.6 30 59.2 57.85 25.8 M 57.7 25.6 L 44.65 11.05 40 25.6 57.7 25.6 M 15.05 11.05 L 20 25.6 30 11.05 15.05 11.05 M 2.25 25.6 L 20 25.6 15.05 11.05 2.25 25.6 Z"
      />
      <path fill="#FFFFFF" fill-opacity="0.3176470588235294" stroke="none"
        d="M 2.25 25.6 L 20 25.6 15.05 11.05 2.25 25.6 M 40 25.6 L 30 11.05 20 25.6 40 25.6 M 57.7 25.6 L 44.65 11.05 40 25.6 57.7 25.6 Z"
      />
      <path fill="#FFFFFF" fill-opacity="0.7176470588235294" stroke="none"
        d="M 30 11.05 L 40 25.6 44.65 11.05 30 11.05 M 30 11.05 L 15.05 11.05 20 25.6 30 11.05 Z"
      />
      <path fill="#000000" fill-opacity="0.2980392156862745" stroke="none"
        d="M 2.25 25.6 L 2.15 25.8 29.9 59.35 30 59.2 20 25.6 2.25 25.6 M 57.85 25.8 L 57.7 25.6 40 25.6 30 59.2 57.85 25.8 Z"
      />
      <path fill="#FFFFFF" fill-opacity="0.8274509803921568" stroke="none"
        d="M 47.45 17.85 L 40.75 13.6 44.9 20.15 38.25 28.8 47.1 22.4 53.7 26.7 49.4 20.25 54.7 13.1 47.45 17.85 M 16.3 9.55 L 12.1 4.4 13.95 10.65 7.75 15 14.85 13.1 19.1 18.2 17.5 11.9 25.05 6.65 16.3 9.55 Z"
      />
    `,
    'Rock Carving': `
      <path stroke-width="2px"
        d="M 47.75 44.5 L 47.8 44.7 6.45 50.5 23.95 54.2 30 59.45 34.95 52.95 57.4 47.4 57.4 47.35 47.75 44.5 M 6.1 50.55 L 6.45 50.5 6.1 50.35 6.1 50.55 M 44.55 26.9 L 43.9 26.15 33.9 14.9 30.45 12.5 21.8 10.8 9.95 24.75 6.1 50.35 6.45 50.5 47.8 44.7 47.75 44.5 44.55 26.9 M 28.25 18.9 L 36.35 24.2 38.9 32.55 36.4 38.65 27.45 38.3 22.45 42.15 13.6 43.1 11.8 43.3 15.25 25.8 26.8 18 28.25 18.9 M 28.25 18.9 L 26.8 18 15.25 25.8 11.8 43.3 13.6 43.1 16.9 26.6 28.25 18.9 M 36.35 24.2 L 28.25 18.9 16.9 26.6 13.6 43.1 22.45 42.15 27.45 38.3 36.4 38.65 38.9 32.55 36.35 24.2 M 19 38 L 19.9 30.8 18.2 32 19.9 30.8 20.2 28 19.9 30.8 24.2 27.6 23 26.8 24.2 27.6 27.4 25.2 24.2 27.6 29.05 30.7 33.6 25.8 29.05 30.7 30.2 31.4 29.05 30.7 28.2 31.6 29.05 30.7 24.2 27.6 19.9 30.8 19 38 M 36 30.2 L 32.2 35 36 30.2 M 22.8 34 L 25 35.2 22.8 34 M 56.2 30.4 L 56.1 30.3 43.9 26.15 44.55 26.9 47.75 44.5 57.4 47.35 56.2 30.4 M 43.9 26.15 L 56.1 30.3 46.95 20.5 33.9 14.9 43.9 26.15 Z"
      />
      <path fill="#000000" fill-opacity="0.48627450980392156" stroke="none"
        d="M 57.4 47.35 L 47.75 44.5 47.8 44.7 6.45 50.5 23.95 54.2 30 59.45 34.95 52.95 57.4 47.4 57.4 47.35 Z"
      />
      <path fill="#000000" fill-opacity="0.2980392156862745" stroke="none"
        d="M 43.9 26.15 L 44.55 26.9 47.75 44.5 57.4 47.35 56.2 30.4 56.1 30.3 43.9 26.15 M 15.25 25.8 L 11.8 43.3 13.6 43.1 16.9 26.6 28.25 18.9 26.8 18 15.25 25.8 Z"
      />
      <path fill="#FFFFFF" fill-opacity="0.30980392156862746" stroke="none"
        d="M 56.1 30.3 L 46.95 20.5 33.9 14.9 43.9 26.15 56.1 30.3 Z"
      />
    `,
    Treasure: `
      <path stroke-width="2px"
        d="M 23.6 39.35 L 22.8 39.95 30.05 59.45 34.45 43.5 23.6 39.35 M 17.2 34 L 18.2 43.35 22.8 39.95 23.6 39.35 32.55 33.05 39.4 28.15 43 25.65 36.95 20.7 17.2 34 M 42.45 46.55 L 43.05 36.45 32.55 33.05 23.6 39.35 34.45 43.5 42.45 46.55 M 8.3 30.3 L 4.85 36.4 18.2 43.35 17.2 34 8.3 30.3 M 18.85 19.25 L 19.3 18.95 17.75 9.15 5.6 21.95 4.25 30.65 18.85 19.25 M 33.5 11.4 L 27.75 5.25 17.75 9.15 19.3 18.95 19.3 19.05 33.5 11.4 M 36.95 20.7 L 29 17.3 9.15 29.3 8.7 29.55 8.3 30.3 17.2 34 36.95 20.7 M 33.95 11.85 L 33.5 11.4 19.3 19.05 18.85 19.25 4.25 30.65 4.1 30.8 8.8 29.4 9.15 29.3 29 17.3 29.7 16.85 29.8 16.8 33.95 11.85 M 48.6 32.15 L 43.05 36.45 42.45 46.55 54.6 37.3 51.85 34.9 48.8 32.25 48.6 32.15 M 43.05 36.45 L 48.6 32.15 39.4 28.15 32.55 33.05 43.05 36.45 M 51.85 34.9 L 55.2 35.4 49.2 20.4 29.7 16.85 29 17.3 36.95 20.7 43 25.65 39.4 28.15 48.6 32.15 48.65 32.1 48.8 32.25 51.85 34.9 M 49.2 20.4 L 47.25 10.7 36.1 9.4 33.95 11.85 29.8 16.8 29.7 16.85 49.2 20.4 M 47.25 10.7 L 49.2 20.4 55.2 35.4 55.5 35.45 Q 54.65 27.65 54.2 26.6 L 47.25 10.7 Z"
      />
      <path fill="#000000" fill-opacity="0.4980392156862745" stroke="none"
        d="M 23.6 39.35 L 22.8 39.95 30.05 59.45 34.45 43.5 23.6 39.35 Z"
      />
      <path fill="#000000" fill-opacity="0.32941176470588235" stroke="none"
        d="M 17.2 34 L 18.2 43.35 22.8 39.95 23.6 39.35 32.55 33.05 39.4 28.15 43 25.65 36.95 20.7 17.2 34 Z"
      />
      <path fill="#000000" fill-opacity="0.5098039215686274" stroke="none"
        d="M 8.3 30.3 L 4.85 36.4 18.2 43.35 17.2 34 8.3 30.3 Z"
      />
      <path fill="#000000" fill-opacity="0.47843137254901963" stroke="none"
        d="M 42.45 46.55 L 43.05 36.45 32.55 33.05 23.6 39.35 34.45 43.5 42.45 46.55 Z"
      />
      <path fill="#000000" fill-opacity="0.2784313725490196" stroke="none"
        d="M 48.8 32.25 L 48.6 32.15 46.8 33.8 43.05 36.45 42.45 46.55 54.6 37.3 51.25 34.4 48.8 32.25 M 19.5 18.75 L 18 9 5.6 21.95 4.25 30.65 4.85 30.25 19.05 19.05 19.5 18.75 M 47.25 10.5 L 49.2 20.4 55.2 35.4 55.5 35.45 Q 54.65 27.65 54.2 26.6 L 47.25 10.5 Z"
      />
      <path fill="#000000" fill-opacity="0.4470588235294118" stroke="none"
        d="M 51.25 34.4 L 51.85 34.9 55.2 35.4 49.2 20.4 29.7 16.85 29.8 16.8 33.95 11.85 33.5 11.4 19.05 19.05 4.85 30.25 4.1 30.8 9.15 29.3 29 17.3 35.8 19.75 36.95 20.7 43 25.65 39.4 28.15 48.6 32.15 48.65 32.1 48.8 32.25 51.25 34.4 Z"
      />
    `,
    'Treasure Map': `
      <path fill="#000000" fill-opacity="0.5" stroke="none"
        d="M 30 59.7 L 33.4 49.75 25.05 47.5 30 59.7 Z"
      />
      <path stroke-width="2px"
        d="M 44.9 47.5 Q 47.2 44.5 47.15 41.1 47.15 40.2 45.35 30.7 44.15 24.5 46.45 19.05 48.15 15 49.55 13.2 51.5 10.7 54.55 9.75 L 25.6 1.55 Q 20.7 1.9 17.95 4.2 15.2 6.5 14 11.2 11.4 21.3 14.4 30.35 15.6 34 13.3 37.8 11.6 40.55 8.4 42.95 L 25.05 47.5 33.4 49.75 40.35 51.65 Q 43.35 49.55 44.9 47.5 M 15.8 41.6 L 19 39.8 15.8 41.6 M 27.75 34.65 L 29.65 30.8 27.75 34.65 M 21.8 39 L 25.8 36.6 21.8 39 M 30.2 27.8 L 30.6 24.6 30.2 27.8 Z"
      />
      <path fill="#000000" fill-opacity="0.5" stroke="none"
        d="M 30 59.1 L 33.4 49.75 25.05 47.5 30 59.1 Z"
      />
      <path fill="#000000" fill-opacity="0.5" stroke="none"
        d="M 47.1 42.3 Q 47.15 41.7 47.15 41.1 47.15 40.2 45.35 30.7 45.1 29.3 45 27.95 L 12.8 19.5 Q 12.65 25.1 14.4 30.35 14.9 31.95 14.8 33.55 L 47.1 42.3 Z"
      />
      <path stroke="#990000" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" fill="none"
        d="M 37.6 14.4 L 31.2 20.25 36.8 29 M 25.6 25.4 L 31.2 20.25 25.8 11.8"
      />
    `,
    Weapon: `
      <path stroke-width="2px" 
        d="M 35.95 7.8 L 34.25 15.9 Q 30.85 26.05 29.3 33.9 27.8 41.8 27.6 49.7 L 31.9 50.5 Q 32 41.9 33.65 33.55 35.25 25.3 38.9 15.3 L 40 9.55 40.95 4.95 36.7 4.15 35.95 7.8 M 34.25 15.9 L 35.95 7.8 Q 28.15 7.5 21.65 1.4 19.7 5.25 18.8 9.9 17.9 14.45 18.3 18.2 21.65 16.4 25.85 15.95 29.45 15.5 34.25 15.9 M 44.45 17.05 Q 45.6 15.5 45.9 13.3 46.35 11.2 45.85 9.3 L 40 9.55 38.9 15.3 44.45 17.05 Z"
      />
      <path fill="#000000" fill-opacity="0.4980392156862745" stroke="none"
        d="M 35.95 7.8 L 34.25 15.9 Q 30.85 26.05 29.3 33.9 27.8 41.8 27.6 49.7 L 31.9 50.5 Q 32 41.9 33.65 33.55 35.25 25.3 38.9 15.3 L 40 9.55 40.95 4.95 36.7 4.15 35.95 7.8 Z"
      />
      <path fill="#FFFFFF" fill-opacity="0.24705882352941178" stroke="none"
        d="M 34.25 15.9 L 35.95 7.8 Q 28.15 7.5 21.65 1.4 19.7 5.25 18.8 9.9 17.9 14.45 18.3 18.2 21.65 16.4 25.85 15.95 29.45 15.5 34.25 15.9 M 45.9 13.3 Q 46.35 11.2 45.85 9.3 L 40 9.55 38.9 15.3 44.45 17.05 Q 45.6 15.5 45.9 13.3 Z"
      />
      <path id="Layer3_0_1_STROKES" stroke="#000000" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" fill="none"
        d="M 21.6 47.4 L 30 58.5 37.9 47.4"
      />
    `,
  };
  
  return `
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      x="0px"
      y="0px"
      height="100%"
      viewBox="0 0 60 60"
      xml:space="preserve"
      class="marker-icon ${(lsData.completedMarkers.includes(uid)) ? MODIFIER__COMPLETED : ''}"
      data-sub-type="${markerSubType}"
      data-type="${markerType}"
      data-uid="${uid}"
    >${icons[markerType]}</svg>
  `;
};

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
    window.removeEventListener('beforeunload', handleUnload);
    
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
  
  const handleUnload = (ev) => {
    markerFlyout.close();
    
    ev.preventDefault(); // Cancel the event as stated by the standard.
    ev.returnValue = undefined; // Chrome requires returnValue to be set.
  };
  window.addEventListener('beforeunload', handleUnload);
  
  markerTypeInput.dispatchEvent(new Event('change'));
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

function renderFilterTag({
  label,
  markerItems,
  subType,
  type,
} = {}) {
  const iconDataAtts = (subType)
    ? `data-sub-type="${subType}" data-type="${type}"`
    : '';
  const filterTag = document.createElement('button');
        filterTag.className = 'filter-tag';
        filterTag.innerHTML = `
          <span class="filter-tag__icon" ${iconDataAtts}>${(markerItems) ? '&#10033;' : ''}</span>
          ${label || subType}
          <span class="filter-tag__close">&#10005;</span>
        `;
  
  if (markerItems) {
    filterTag.dataset.markerItems = JSON.stringify(markerItems);
  }
  else {
    filterTag.dataset.subType = subType;
    filterTag.dataset.type = type;
  }
  
  subTypeFilterWrapper.appendChild(filterTag);
}

function handleFilterSelect({ elements: filters, value }) {
  if (filters.length) {
    if (filters.length > 1) {
      const markerItems = [];
      
      filters.forEach((filter) => {
        const { subType, type } = filter.dataset;
        renderMarkers(subType);
        markerItems.push({ subType, type });
      });
      
      renderFilterTag({ label: value, markerItems });
    }
    else {
      const { subType, type } = filters[0].dataset;
      renderMarkers(subType);
      renderFilterTag({ subType, type });
    }
  }
}

function handleFilterRemoval(ev) {
  const el = ev.target;
  
  if (el.classList.contains('filter-tag')) {
    function removeFilter({ subType, type } = {}) {
      const filterNdx = filteredSubTypes.indexOf(subType);
      
      filteredSubTypes.splice(filterNdx, 1);
      typesLayerGroups[type].eachLayer((marker) => {
        if (marker.customData.markerSubType === subType) {
          typesLayerGroups[type].removeLayer(marker);
          marker.remove();
        }
      });
      
      // if no more filters are applied, show all Markers
      if (!filteredSubTypes.length) renderMarkers();
    };
    
    if (el.dataset.subType) {
      const { subType, type } = el.dataset;
      removeFilter({ subType, type });
    }
    else if (el.dataset.markerItems) {
      const markerItems = JSON.parse(el.dataset.markerItems);
      markerItems.forEach(({ subType, type }) => {
        removeFilter({ subType, type });
      });
    }
    
    el.remove();
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
    if (!lsData.completedMarkers) lsData.completedMarkers = [];
    if (!lsData.hiddenOverlays) lsData.hiddenOverlays = [];
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
    
    const layersControlList = document.querySelector('.leaflet-control-layers-list');
    const allLayersToggle = document.createElement('button');
          allLayersToggle.type = 'button';
          allLayersToggle.className = 'leaflet-control-layers-list__toggle-all-btn';
          allLayersToggle.innerText = 'Toggle All';
          allLayersToggle.title = 'Click to toggle all layers on or off';
    layersControlList.prepend(allLayersToggle);
    allLayersToggle.addEventListener('click', () => {
      const checkboxLabels = [...layersControlList.querySelectorAll('label')];
      const layerCheckboxes = [...layersControlList.querySelectorAll('input[type="checkbox"]')];
      const numberOfVisibleLayers = layerCheckboxes.reduce((count, checkbox) => {
        count += (checkbox.checked) ? 1 : 0;
        return count;
      }, 0);
      
      checkboxLabels.forEach((label) => {
        const checkbox = label.querySelector('input[type="checkbox"]');
        if (numberOfVisibleLayers > 0 && checkbox.checked) label.click();
        else if (numberOfVisibleLayers === 0 && !checkbox.checked) label.click();
      });
    });
    
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
