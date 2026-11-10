/* Virtual Dog Park - JavaScript (Round 1 + Round 2 + Round 3)
   This file is linked from index.html with <script src="script.js"></script>.
   Round 1: keeps the footer year up to date.
   Round 2: adopts one dog and raises happiness with Feed / Play.
   Round 3: Next Day, growth stages, localStorage saving and Start Over.
   Plain vanilla JavaScript - no libraries, no framework, no backend. */

// ---------- Constants ----------
var STORAGE_KEY = "virtualDogParkPetV1";
var MAX_NAME_LENGTH = 20;
var START_HAPPINESS = 50;
var MIN_HAPPINESS = 0;
var MAX_HAPPINESS = 100;
var HAPPINESS_STEP = 10;   // Feed and Play
var HAPPINESS_DROP = 5;    // Next Day
var START_DAY = 1;
var STAGES = ["Puppy", "Young Dog", "Adult Dog"];
var STAGE_CLASSES = ["status-photo--puppy", "status-photo--young", "status-photo--adult"];
var VALID_BREEDS = ["Beagle", "Golden Retriever", "Poodle"];

// Each breed reuses one of the illustrations from Round 1.
var BREED_IMAGES = {
  "Beagle": { src: "assets/beagle.svg", alt: "Illustration of a Beagle" },
  "Golden Retriever": { src: "assets/golden-retriever.svg", alt: "Illustration of a Golden Retriever" },
  "Poodle": { src: "assets/poodle.svg", alt: "Illustration of a Poodle" }
};

// Only one dog can exist at a time. null means "no dog yet".
// The four saved properties are name, breed, day and happiness.
// The growth stage is NEVER stored - it is always derived from day.
var dog = null;

// ---------- Page elements ----------
var form, breedSelect, nameInput, formError;
var statusPanel, statusPhoto, statusName, statusBreed;
var statusDay, statusStage, happinessValue, happinessFill, happinessTrack, statusMessage;
var feedButton, playButton, nextDayButton, startOverButton, growthSteps;

// ---------- Small helpers ----------

// Keep a number inside the allowed range.
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// The single shared growth rule. Every part of the page calls this function,
// so the visible stage and the stored day can never disagree.
function stageFor(day) {
  if (day <= 1) {
    return "Puppy";        // Day 1
  }
  if (day <= 3) {
    return "Young Dog";    // Days 2-3
  }
  return "Adult Dog";      // Day 4 onward
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
    happiness: START_HAPPINESS
  };
}

// ---------- Saving and restoring ----------

// Save the four properties under the required key.
function saveDog() {
  if (!dog) {
    return;
  }

  var petToSave = {
    name: dog.name,
    breed: dog.breed,
    day: dog.day,
    happiness: dog.happiness
  };

  try {
    // localStorage only stores strings, so the object is turned into JSON text.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(petToSave));
  } catch (error) {
    // Storage can be blocked (private browsing or disabled settings).
    // The dog still works for this visit - it just will not be restored.
  }
}

// Reject anything that is not a complete, sensible saved dog.
function isValidSavedPet(pet) {
  if (!pet || typeof pet !== "object" || Array.isArray(pet)) {
    return false;
  }
  if (typeof pet.name !== "string" || !validateName(pet.name).valid) {
    return false;
  }
  if (VALID_BREEDS.indexOf(pet.breed) === -1) {
    return false;
  }
  if (typeof pet.day !== "number" || !isFinite(pet.day) ||
      pet.day < 1 || Math.floor(pet.day) !== pet.day) {
    return false;
  }
  if (typeof pet.happiness !== "number" || !isFinite(pet.happiness)) {
    return false;
  }
  return true;
}

// Read the saved dog, or return null when there is no usable data.
function loadDog() {
  var raw;

  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    return null;
  }

  if (!raw) {
    return null; // nothing saved yet
  }

  var saved;
  try {
    // Turn the JSON text back into an object. Bad text throws an error.
    saved = JSON.parse(raw);
  } catch (error) {
    return null; // damaged data - start fresh instead of crashing
  }

  if (!isValidSavedPet(saved)) {
    return null;
  }

  // Rebuild a clean dog. The stage is NOT saved or copied;
  // renderDog() will work it out from this day with stageFor().
  return {
    name: validateName(saved.name).name,
    breed: saved.breed,
    day: saved.day,
    happiness: clamp(saved.happiness, MIN_HAPPINESS, MAX_HAPPINESS)
  };
}

// Automatically show a saved dog when the page loads.
function restoreDog() {
  dog = loadDog();

  if (!dog) {
    return;
  }

  form.hidden = true;
  statusPanel.hidden = false;
  statusMessage.textContent = "Welcome back! " + dog.name + " is waiting at the park.";
  renderDog();
}

// ---------- Drawing the page ----------

function renderDog() {
  if (!dog) {
    return;
  }

  var stage = stageFor(dog.day);          // derived from the day
  var stageIndex = STAGES.indexOf(stage);

  // textContent keeps user-typed names as plain, safe text; no markup is injected.
  statusName.textContent = dog.name;
  statusBreed.textContent = dog.breed;
  statusDay.textContent = dog.day;
  statusStage.textContent = stage;
  happinessValue.textContent = dog.happiness + " / " + MAX_HAPPINESS;

  // Choose the matching local illustration from the fixed breed list.
  var image = BREED_IMAGES[dog.breed];
  if (image) {
    statusPhoto.src = image.src;
    statusPhoto.alt = image.alt + " named " + dog.name;
  }

  // The illustration grows: small puppy, medium young dog, large adult.
  statusPhoto.classList.remove("status-photo--puppy", "status-photo--young", "status-photo--adult");
  statusPhoto.classList.add(STAGE_CLASSES[stageIndex]);

  // Highlight the current stage in the three-step growth bar.
  for (var i = 0; i < growthSteps.length; i++) {
    var step = growthSteps[i];
    step.classList.toggle("growth__step--active", i === stageIndex);
    step.classList.toggle("growth__step--done", i < stageIndex);
    if (i === stageIndex) {
      step.setAttribute("aria-current", "step");
    } else {
      step.removeAttribute("aria-current");
    }
  }

  // Update the happiness bar and its accessible value.
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
    showFormError("You already have a dog. Use Start Over to choose a different friend.");
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
  saveDog(); // save immediately after adoption

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

  saveDog(); // save immediately after Feed / Play
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

// Move to the next day: +1 day, -5 happiness (never below 0).
function handleNextDay() {
  if (!dog) {
    return;
  }

  dog.day += 1;
  dog.happiness = clamp(dog.happiness - HAPPINESS_DROP, MIN_HAPPINESS, MAX_HAPPINESS);

  statusMessage.textContent = "Day " + dog.day + " begins. " + dog.name + " is now a " +
                              stageFor(dog.day) + ". Happiness is " + dog.happiness + ".";

  saveDog(); // save immediately after Next Day
  renderDog();
}

// Ask before deleting the dog. Cancel keeps everything; OK resets everything.
function handleStartOver() {
  if (!dog) {
    return;
  }

  var confirmed = window.confirm("Start over? This will remove " + dog.name +
                                 " and all saved progress.");

  if (!confirmed) {
    // Cancel: do not touch the dog, the screen or the saved data.
    statusMessage.textContent = "Start Over cancelled. " + dog.name + " is still here.";
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // Storage may be blocked; the in-memory dog is still cleared below.
  }

  dog = null;

  // Clear the visible status so no old information lingers.
  statusName.textContent = "";
  statusBreed.textContent = "";
  statusDay.textContent = "";
  statusStage.textContent = "";
  happinessValue.textContent = "";
  statusMessage.textContent = "";
  happinessFill.style.width = "0%";
  happinessFill.classList.remove("happiness__fill--full");
  for (var i = 0; i < growthSteps.length; i++) {
    growthSteps[i].classList.remove("growth__step--active", "growth__step--done");
    growthSteps[i].removeAttribute("aria-current");
  }

  // Return to the adoption form.
  statusPanel.hidden = true;
  form.hidden = false;
  nameInput.value = "";
  breedSelect.value = VALID_BREEDS[0];
  clearFormError();
  nameInput.focus();
}

// ---------- Start everything once the HTML is ready ----------
document.addEventListener("DOMContentLoaded", function () {
  // Round 1: footer year.
  var yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // Find the elements once, then reuse them.
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
  nextDayButton = document.getElementById("next-day-btn");
  startOverButton = document.getElementById("start-over-btn");
  growthSteps = document.querySelectorAll(".growth__step");

  form.addEventListener("submit", handleAdopt);
  feedButton.addEventListener("click", handleFeed);
  playButton.addEventListener("click", handlePlay);
  nextDayButton.addEventListener("click", handleNextDay);
  startOverButton.addEventListener("click", handleStartOver);

  // Clear the error as soon as the user starts fixing the name.
  nameInput.addEventListener("input", clearFormError);

  // Round 3: bring back the saved dog, if there is a valid one.
  restoreDog();
});
