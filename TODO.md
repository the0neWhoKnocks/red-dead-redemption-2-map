# TODO

---

- [ ] Spin up a simple Server so that I can save user created markers in a
centralized location.
- [x] Figure out odd Mobile scrolling/sizing behavior
- [x] Switch from a Modal to a Flyout, so Desktop & Mobile experience is the
same, and so the vertical size of content doesn't matter.
- [x] Add a `control` that allows for enabling Marker placement instead of it
just always happening on click of the map.
- [ ] Add a star rating selector for just Animal markers.
- [ ] Customize Marker icons based on `markerType`.
  - https://leafletjs.com/reference-1.6.0.html#icon
- [ ] Allow for choosing base type of Marker. Right now it's just `marker`, but
it'd be useful to use `circle` for a more general radius of where an animal may
spawn.
- [ ] Have Marker popup display this info
  ```
  Title - typeIcon markerType: markerSubType|markerCustomSubType
  Rating (if Animal) - rating
  Body - markerDescription
  ```
- [ ] Add Filter option to filter by `markerType` & `*SubType`
  - https://leafletjs.com/reference-1.6.0.html#control-layers