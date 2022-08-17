"use strict";

class Bikeride {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  clicks = 0;

  constructor(coords, distance, time) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.time = time; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

class Biking extends Bikeride {
  type = "biking";

  constructor(coords, distance, time) {
    super(coords, distance, time);
    // this.type = 'biking';
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.time / 60);
    return this.speed;
  }
}
// APPLICATION ARCHITECTURE
const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".bikerides");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputTime = document.querySelector(".form__input--time");

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #bikerides = [];

  constructor() {
    // Get user's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Attach event handlers
    form.addEventListener("submit", this._newBikeride.bind(this));
    containerBikerides.addEventListener("click", this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Could not get your position");
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    this.#map = L.map("map").setView(coords, this.#mapZoomLevel);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on("click", this._showForm.bind(this));

    this.#bikerides.forEach((bike) => {
      this._renderBikerideMarker(bike);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _hideForm() {
    // Empty inputs
    inputDistance.value = inputTime.value = "";
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }

  _newBikeride(e) {
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every((inp) => inp > 0);

    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const time = +inputTime.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let bikeride;

      // Check if data is valid
      if (
        !validInputs(distance, time) ||
        !allPositive(distance, time)
      )
        return alert("Inputs have to be positive numbers!");
    }
      bikeride = new Biking([lat, lng], distance, time);
    }

    // Add new object to workout array
    this.#bikerides.push(bikeride);

    // Render workout on map as marker
    this._renderBikerideMarker(bikeride);

    // Render workout on list
    this._renderBikeride(bikeride);

    // Hide form + clear input fields
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();


  _renderBikerideMarker(bikeride) {
    L.marker(bikeride.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${bikeride.type}-popup`,
        })
      )
      .setPopupContent(
        `${bikeride.type === "🚴‍♀️"} ${bikeride.description}`
      )
      .openPopup();
  }

  _renderBikeride(bikeride) {
    let html = `
      <li class="workout workout--${bikeride.type}" data-id="${bikeride.id}">
        <h2 class="bikeride__title">${bikeride.description}</h2>
        <div class="bikeride__details">
          <span class="bikeride__icon">${
            bikeride.type === "🚴‍♀️"
          }</span>
          <span class="bikeride__value">${bikeride.distance}</span>
          <span class="bikeride__unit">km</span>
        </div>
        <div class="bikeride__details">
          <span class="bikeride__icon">⏱</span>
          <span class="bikeride__value">${bikeride.time}</span>
          <span class="bikeride__unit">min</span>
        </div>
    `;

    if (bikeride.type === "biking")
      html += `
        <div class="bikeride__details">
          <span class="bikeride__icon">⚡️</span>
          <span class="bikeride__value">${bikeride.speed.toFixed(1)}</span>
          <span class="bikeride__unit">km/h</span>
        </div>
        <div class="bikeride__details">
          <span class="bikeride__icon">⛰</span>
          <span class="bikeride__value">${bikeride.elevationGain}</span>
          <span class="bikeride__unit">m</span>
        </div>
      </li>
      `;

    form.insertAdjacentHTML("afterend", html);
  }

  _moveToPopup(e) {
    // BUGFIX: When we click on a workout before the map has loaded, we get an error. But there is an easy fix:
    if (!this.#map) return;

    const bikerideEl = e.target.closest(".bikeride");

    if (!bikerideEl) return;

    const bikeride = this.#bikerides.find(
      (bike) => bike.id === bikerideEl.dataset.id
    );

    this.#map.setView(bikeride.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        time: 1,
      },
    });

  }

  _setLocalStorage() {
    localStorage.setItem("bikerides", JSON.stringify(this.#bikerides));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("bikerides"));

    if (!data) return;

    this.#bikerides = data;

    this.#bikerides.forEach((bike) => {
      this._renderBikeride(bike);
    });
  }

  reset() {
    localStorage.removeItem("bikerides");
    location.reload();
  }
}



const app = new App();
