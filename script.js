/* Virtual Dog Park - JavaScript (Round 1 + Round 2)
   This file is linked from index.html with <script src="script.js"></script>.
   Round 1: keeps the footer year up to date.
   Round 2: adopts one dog, shows its status, and raises happiness with
   the Feed and Play buttons.

   Nothing is saved between visits, and day / stage changes belong to a
   later round. */

// ---------- Constants ----------
var MAX_NAME_LENGTH = 20;
var START_HAPPINESS = 50;
var MIN_HAPPINESS = 0;
var MAX_HAPPINESS = 100;
var HAPPINESS_STEP = 10;
var START_DAY = 1;
var START_STAGE = "Puppy";

// Each breed reuses one of the illustrations from Round 1.
var BREED_IMAGES = {
  "Beagle": { src: "assets/beagle.svg", alt: "Illustration of a Beagle" },
  "Golden Retriever": { src: "assets/golden-retriever.svg", alt: "Illustration of a Golden Retriever" },
  "Poodle": { src: "assets/poodle.svg", alt: "Illustration of a Poodle" }
};

// Only one dog can be adopted at a time. null means "no dog yet".
var dog = null;

// ---------- Page elements ----------
var form, breedSelect, nameInput, formError;
var statusPanel, statusPhoto, statusName, statusBreed;
var statusDay, statusStage, happinessValue, happinessFill, happinessTrack, statusMessage;
var feedButton, playButton;

// ---------- Small helpers ----------

// Keep a number inside the allowed range (used for the happiness cap).
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Show or hide the error message under the adoption form.
function showFormError(message) {
  formError.textContent = message;
  formError.hidden = false;
}

function clearFormError() {
  formError.textContent = "";
  formError.hidden = true;
}

// Check the typed name and return a cleaned-up version plus any error.
function validateName(rawName) {
  // trim() removes leading and trailing whitespace only;
  // spaces INSIDE the name (e.g. "Sir Barks A Lot") are kept.
  var name = rawName.trim();

  if (name.length === 0) {
    return {
      valid: false,
      name: "",
      error: "Please enter a name for your dog. Names cannot be empty or only spaces."
    };
  }

  if (name.length > MAX_NAME_LENGTH) {
    return {
      valid: false,
      name: "",
      error: "Name must be " + MAX_NAME_LENGTH + " characters or fewer. Yours is " +
             name.length + " characters."
    };
  }

  return { valid: true, name: name, error: "" };
}

// Build the object that stores everything about the adopted dog.
function createDog(name, breed) {
  return {
    name: name,
    breed: breed,
    day: START_DAY,
    stage: START_STAGE,
    happiness: START_HAPPINESS
  };
}

// Draw the dog's current information on the page.
function renderDog() {
  if (!dog) {
    return;
  }

  // textContent keeps user-typed names as plain, safe text; no markup is injected.
  statusName.textContent = dog.name;
  statusBreed.textContent = dog.breed;
  statusDay.textContent = dog.day;
  statusStage.textContent = dog.stage;
  happinessValue.textContent = dog.happiness + " / " + MAX_HAPPINESS;

  // Choose the matching local illustration from the fixed breed list.
  var image = BREED_IMAGES[dog.breed];
  if (image) {
    statusPhoto.src = image.src;
    statusPhoto.alt = image.alt + " named " + dog.name;
  }

  // Update the visual bar and its accessible value.
  happinessFill.style.width = dog.happiness + "%";
  happinessTrack.setAttribute("aria-valuenow", String(dog.happiness));
  happinessTrack.setAttribute("aria-valuetext", dog.happiness + " out of " + MAX_HAPPINESS);
  happinessFill.classList.toggle("happiness__fill--full", dog.happiness === MAX_HAPPINESS);
}

// ---------- Actions ----------

// Handle the Adopt button (a form submit).
function handleAdopt(event) {
  event.preventDefault(); // do not reload the page

  if (dog) {
    showFormError("You already have a dog. Reload the page to choose a different friend.");
    return;
  }

  var result = validateName(nameInput.value);

  if (!result.valid) {
    showFormError(result.error);
    nameInput.focus();
    return;
  }

  clearFormError();
  dog = createDog(result.name, breedSelect.value);

  // Swap the form for the status panel so only one dog can be adopted.
  form.hidden = true;
  statusPanel.hidden = false;
  statusMessage.textContent = dog.name + " has joined you at the park!";
  renderDog();
  statusName.focus(); // move keyboard focus to the new information
}

// Raise happiness by one step. clamp() stops it going above 100.
function raiseHappiness(actionText) {
  if (!dog) {
    return;
  }

  var before = dog.happiness;
  dog.happiness = clamp(before + HAPPINESS_STEP, MIN_HAPPINESS, MAX_HAPPINESS);

  if (dog.happiness === before) {
    statusMessage.textContent = actionText + " Happiness is already at the maximum of " +
                                MAX_HAPPINESS + ".";
  } else if (dog.happiness === MAX_HAPPINESS) {
    statusMessage.textContent = actionText + " Happiness reached the maximum of " +
                                MAX_HAPPINESS + "!";
  } else {
    statusMessage.textContent = actionText + " Happiness is now " + dog.happiness + ".";
  }

  renderDog();
}

function handleFeed() {
  if (!dog) {
    return;
  }
  raiseHappiness("You fed " + dog.name + ".");
}

function handlePlay() {
  if (!dog) {
    return;
  }
  raiseHappiness("You played with " + dog.name + ".");
}

// ---------- Start everything once the HTML is ready ----------
document.addEventListener("DOMContentLoaded", function () {
  // Round 1: footer year.
  var yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // Round 2: find the elements once, then reuse them.
  form = document.getElementById("adoption-form");
  breedSelect = document.getElementById("dog-breed");
  nameInput = document.getElementById("dog-name");
  formError = document.getElementById("form-error");
  statusPanel = document.getElementById("dog-status");
  statusPhoto = document.getElementById("status-photo");
  statusName = document.getElementById("status-name");
  statusBreed = document.getElementById("status-breed");
  statusDay = document.getElementById("status-day");
  statusStage = document.getElementById("status-stage");
  happinessValue = document.getElementById("happiness-value");
  happinessFill = document.getElementById("happiness-fill");
  happinessTrack = document.getElementById("happiness-track");
  statusMessage = document.getElementById("status-message");
  feedButton = document.getElementById("feed-btn");
  playButton = document.getElementById("play-btn");

  form.addEventListener("submit", handleAdopt);
  feedButton.addEventListener("click", handleFeed);
  playButton.addEventListener("click", handlePlay);

  // Clear the error as soon as the user starts fixing the name.
  nameInput.addEventListener("input", clearFormError);
});
