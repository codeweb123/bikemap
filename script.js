"use strict";

class Exercise {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  clicks = 0;

  constructor(coords, distance, time) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in m
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

class Jogging extends Exercise {
  type = "jogging";

  constructor(coords, distance, time) {
    super(coords, distance, time);
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.time / this.distance;
    return this.pace;
  }
}

class Biking extends Exercise {
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
const containerWorkouts = document.querySelector(".exercises");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputTime = document.querySelector(".form__input--time");

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #exercises = [];

  constructor() {
    // Get user's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Attach event handlers
    form.addEventListener("submit", this._newexercise.bind(this));
    containerexercises.addEventListener("click", this._moveToPopup.bind(this));
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

    this.#exercises.forEach((bike) => {
      this._renderexerciseMarker(bike);
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

  _newexercise(e) {
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every((inp) => inp > 0);

    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const time = +inputTime.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let exercise;

    if (type === "jogging") {
      // Check if data is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert("Inputs have to be positive numbers!");

      workout = new Jogging([lat, lng], distance, time);
    }

    if (type === "biking") {
      // Check if data is valid
      if (!validInputs(distance, time) || !allPositive(distance, time))
        return alert("Inputs have to be positive numbers!");
      exercise = new Biking([lat, lng], distance, time);
    }

    // Add new object to workout array
    this.#exercises.push(exercise);

    // Render workout on map as marker
    this._renderexerciseMarker(exercise);

    // Render workout on list
    this._renderexercise(exercise);

    // Hide form + clear input fields
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();
  }

  _renderexerciseMarker(exercise) {
    L.marker(exercise.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${exercise.type}-popup`,
        })
      )
      .setPopupContent(`${exercise.type === "🚴‍♀️"} ${exercise.description}`)
      .openPopup();
  }

  _renderexercise(exercise) {
    let html = `
      <li class="workout workout--${exercise.type}" data-id="${exercise.id}">
        <h2 class="exercise__title">${exercise.description}</h2>
        <div class="exercise__details">
          <span class="exercise__icon">${exercise.type === "🚴‍♀️"}</span>
          <span class="exercise__value">${exercise.distance}</span>
          <span class="exercise__unit">km</span>
        </div>
        <div class="exercise__details">
          <span class="exercise__icon">⏱</span>
          <span class="exercise__value">${exercise.time}</span>
          <span class="exercise__unit">min</span>
        </div>
    `;

    if (exercise.type === "jogging")
      html += `
        <div class="exercise__details">
          <span class="exercise__icon">⚡️</span>
          <span class="exercise__value">${exercise.pace.toFixed(1)}</span>
          <span class="exercise__unit">min/km</span>
        </div>
        <div class="exercise__details">
          <span class="exercise__icon">🦶🏼</span>
          <span class="exercise__unit">spm</span>
        </div>
      </li>
      `;

    if (exercise.type === "biking")
      html += `
        <div class="exercise__details">
          <span class="exercise__icon">⚡️</span>
          <span class="exercise__value">${exercise.speed.toFixed(1)}</span>
          <span class="exercise__unit">m/h</span>
        </div>
        <div class="exercise__details">
          <span class="exercise__icon">⛰</span>
          <span class="exercise__unit">m</span>
        </div>
      </li>
      `;

    form.insertAdjacentHTML("afterend", html);
  }

  _moveToPopup(e) {
    // BUGFIX: When we click on a workout before the map has loaded, we get an error. But there is an easy fix:
    if (!this.#map) return;

    const exerciseEl = e.target.closest(".exercise");

    if (!exerciseEl) return;

    const exercise = this.#exercises.find(
      (bike) => bike.id === exerciseEl.dataset.id
    );

    this.#map.setView(exercise.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        time: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem("exercises", JSON.stringify(this.#exercises));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("exercises"));

    if (!data) return;

    this.#exercises = data;

    this.#exercises.forEach((bike) => {
      this._renderexercise(bike);
    });
  }

  reset() {
    localStorage.removeItem("exercises");
    location.reload();
  }
}

const app = new App();
