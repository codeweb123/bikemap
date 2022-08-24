"use strict";

class Exercise {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  clicks = 0;

  constructor(coords, distance, time) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in miles
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
    // min/m
    this.pace = this.distance / (this.time / 60);
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
    // m/h
    this.speed = this.distance / (this.time / 60);
    return this.speed;
  }
}
// APPLICATION ARCHITECTURE
const form = document.querySelector(".form");
const containerExercises = document.querySelector(".exercises");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputTime = document.querySelector(".form__input--time");

//private class fields : private instance properties
class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #exercises = [];

  constructor() {
    // user's position
    this._getPosition();

    // data from local storage
    this._getLocalStorage();

    // vent handlers
    form.addEventListener("submit", this._newExercise.bind(this));
    containerExercises.addEventListener("click", this._moveToPopup.bind(this));
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
      this._renderExerciseMarker(bike);
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

  _newExercise(e) {
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
      if (!validInputs(distance, time) || !allPositive(distance, time))
        return alert("Inputs have to be positive numbers!");
      exercise = new Jogging([lat, lng], distance, time);
    }

    if (type === "biking") {
      if (!validInputs(distance, time) || !allPositive(distance, time))
        return alert("Inputs must be positive.");
      exercise = new Biking([lat, lng], distance, time);
    }

    // Add new object to array
    this.#exercises.push(exercise);

    this._renderExerciseMarker(exercise);

    //on list
    this._renderExercise(exercise);

    // Hide form
    this._hideForm();

    // Set local storage
    this._setLocalStorage();
  }

  _renderExerciseMarker(exercise) {
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
      .setPopupContent(
        `${exercise.type === "jogging" ? "🏃‍♂️" : "🚴‍♀️"} ${exercise.description}`
      )
      .openPopup();
  }

  _renderExercise(exercise) {
    let html = `
      <li class="exercise exercise--${exercise.type}" data-id="${exercise.id}">
        <h2 class="exercise__title">${exercise.description}</h2>
        <div class="exercise__details">
          <span class="exercise__icon">${
            exercise.type === "jogging" ? "🏃‍♂️" : "🚴‍♀️"
          }</span>
          <span class="exercise__value">${exercise.distance}</span>
          <span class="exercise__unit">miles</span>
        </div>
        <div class="exercise__details">
          <span class="exercise__icon">⏱</span>
          <span class="exercise__value">${exercise.time}</span>
          <span class="exercise__unit">minutes</span>
        </div>
    `;

    if (exercise.type === "jogging")
      html += `
        <div class="exercise__details">
          <span class="exercise__icon">⚡️</span>
          <span class="exercise__value">${exercise.pace.toFixed(1)}</span>
          <span class="exercise__unit">miles/hour</span>
        </div>
      </li>
      `;

    if (exercise.type === "biking")
      html += `
        <div class="exercise__details">
          <span class="exercise__icon">⚡️</span>
          <span class="exercise__value">${exercise.speed.toFixed(1)}</span>
          <span class="exercise__unit">miles/hour</span>
        </div>
      </li>
      `;

    form.insertAdjacentHTML("afterend", html);
  }

  _moveToPopup(e) {
    if (!this.#map) return;
    const exerciseEl = e.target.closest(".exercise");

    if (!exerciseEl) return;

    const exercise = this.#exercises.find(
      (exer) => exer.id === exerciseEl.dataset.id
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

    this.#exercises.forEach((exer) => {
      this._renderExercise(exer);
    });
  }

  reset() {
    localStorage.removeItem("exercises");
    location.reload();
  }
}

const app = new App();
