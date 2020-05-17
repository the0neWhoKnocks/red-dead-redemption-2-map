# TODO

---

- [x] Spin up a simple Server so that I can save user created markers in a
centralized location.
  - [x] Allow for storing saved marker data in a centralized location.
- [x] Figure out odd Mobile scrolling/sizing behavior
- [x] Switch from a Modal to a Flyout, so Desktop & Mobile experience is the
same, and so the vertical size of content doesn't matter.
- [x] Add a `control` that allows for enabling Marker placement instead of it
just always happening on click of the map.
- [x] Add a star rating selector for just Animal markers.
- [x] Customize Marker icons based on `markerType`.
  - https://leafletjs.com/reference-1.6.0.html#icon
- [x] Have Marker popup display this info
  ```
  Title - typeIcon markerType: markerSubType|markerCustomSubType
  Rating (if Animal) - rating
  Body - markerDescription
  ```
- Add Filter option to filter by `markerType` & `*SubType`
  - https://leafletjs.com/reference-1.6.0.html#control-layers
  - [x] Hide/Show by `markerType`
  - [x] Hide/Show by `*SubType`
- On click of Marker Creator toggle
  - [x] Change the cursor to a crosshair
- On open/close of Marker Creator
  - [x] Hide all Markers
- [ ] Combine custom subTypes with default subTypes so a User can select them later.
- [x] Have a list of `default-markers.json` and `user-markers.json`, and combine
those together during `loadMarkers`.
- [x] Have a checkbox on a Marker popup so that a marker can act as a todo item.
- [x] Add a toggle in Layers to 'Toggle All'.
- [x] Add ability to type a partial item in the Filter input, and after hitting
ENTER, all items that were filtered down, are returned. May have to add some
sort of submit button for Mobile.
- Add new `markerType`s
  - [x] Bird
  - [x] Mission Item
- [ ] Look into scraping/creating better map tiles
- [x] Switch over to canvas for Markers for better performance
  - [ ] Figure out how to combine and render all Markers at once to maintain
  proper z-indexing. May have to create a custom Layers control that doesn't
  rely on layer groups, but rather just simulate layer groups.

---

## Bugs

- [x] On edit of Marker, the subtype dropdown doesn't reflect what's being edited.
- [x] If you refresh the page while in Edit Marker mode, all the layers
will be off on load. Add a `beforeunload` to reset layers.
