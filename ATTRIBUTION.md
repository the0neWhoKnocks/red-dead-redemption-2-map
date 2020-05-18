# Attribution

---

- Map tiles were scraped from IGN's Server via [bin/scrape-tiles.sh](./bin/scrape-tiles.sh).
- Default Marker data was scraped from https://www.ign.com/maps/red-dead-redemption-2/world via this code
  ```js
  var s = new Set();
  var data = JSON.parse(document.getElementById('__NEXT_DATA__').innerHTML);
  var d = await Object.keys(data.props.apolloState).reduce((arr, m) => {
    const { lat, lng, markerName, typeSlug } = data.props.apolloState[m];
    if (lat && lng && markerName && typeSlug) {
      let markerType;

      switch(typeSlug) {
        case 'cigarette-card': markerType = 'Cigarette Card'; break;
        case 'dinosaur-bones': markerType = 'Dino Bones'; break;
        case 'dreamcatcher': markerType = 'Dreamcatcher'; break;
        case 'cougar-spawn-point': 
        case 'legendary-animal': 
        case 'bear-spawn-point': 
        case 'panther-spawn-point': 
          markerType = 'Animal'; break;
        case 'treasure-location': markerType = 'Treasure'; break;
        case 'treasure-map': markerType = 'Treasure Map'; break;
        case 'rock-carving': markerType = 'Rock Carving'; break;
        case 'special-hat': markerType = 'Hat'; break;
        case 'legendary-fish': markerType = 'Fish'; break;
        case 'point-of-interest': markerType = 'Point of Interest'; break;
        case 'unique-weapon': markerType = 'Weapon'; break;
        case 'rare-item': markerType = 'Rare Item'; break;
      }
      s.add(typeSlug);
      
      if (markerType) {
        const [markerSubType, markerDescription] = markerName.split(' - ');
        setTimeout(() => {}, 0);
        arr.push({
          data: {
            markerDescription: markerDescription && markerDescription.trim(),
            markerType,
            markerSubType,
            uid: `${performance.now()}`.replace('.', ''),
          },
          lat: lat * 191,
          lng: lng * 190.75,
        });
      }
    }
    
    return arr;
  }, []);
  copy(d);
  console.log(s);
  ```
