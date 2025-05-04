// Get carousel elements
const carousel = document.getElementById("carousel");
const cardsContainer = document.getElementById("cards-container");
const cards = document.querySelectorAll(".card");

// Set parameters
const wheelSpeed = 0.6;
let translateX = 0;
let cardsCount = cards.length;
const cardsCloned = 1;
const cardWidth = cards[0].offsetWidth;
const gap = Number(
  window
    .getComputedStyle(cardsContainer)
    .getPropertyValue("column-gap")
    .slice(0, -2)
);
const transition = window
  .getComputedStyle(cards[0])
  .getPropertyValue("transition");

const transitionDuration =
  Number(
    window
      .getComputedStyle(cards[0])
      .getPropertyValue("transition-duration")
      .slice(0, -1)
  ) * 1000;

const transitionDurationSnap = transitionDuration * 2;

// Flag to prevent multiple concurrent translations
let isSnapping = false;

// Clone and append ending cards
const leftClone = cards[0].cloneNode(true);
cardsContainer.append(leftClone);

const rightClone = cards[cardsCount - 1].cloneNode(true);
cardsContainer.prepend(rightClone);

cardsCount = cardsContainer.children.length;

disableTransitions();
translate();
enableTranslationAndTransition();

// Perform translation on wheel event
window.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();

    // Skip if snap translation is in progress
    if (isSnapping) return;

    updateTranslateX(e.deltaY);

    // Check for snap translation
    const threshold = (cardWidth + gap) * 0.5;
    if (translateX <= threshold * -1) {
      snap("left");
    } else if (translateX >= threshold) {
      snap("right");
    } else {
      // Regular translation
      translate();
    }
  },
  { passive: false }
);

// Function to update translation
function updateTranslateX(deltaY) {
  // Normalize wheel delta
  deltaY = Math.round(deltaY * wheelSpeed);
  translateX += deltaY * -1;
}

// Function to perform regular translation with preset transition effect
function translate() {
  [...cardsContainer.children].forEach((card, i) => {
    const z = getTranslateZ(i);
    card.style.transform = `translate3D(${translateX}px, 0px, ${z}px)`;
  });
  setZIndex();
}

// Function to perform a smooth snap translation - with prolonged transition effect
function snap(direction) {
  // Set snapping flag to prevent wheel events
  isSnapping = true;

  // Step 1: Complete full translation (to end position)
  const endPos = direction === "left" ? -cardWidth - gap : cardWidth + gap;
  translateX = endPos;

  // Translate cards to the end position with transition enabled for smooth effect
  [...cardsContainer.children].forEach((card) => {
    card.style.transition = `transform ${transitionDurationSnap}ms cubic-bezier(0.34, 1.1, 0.64, 1)`;
  });

  translate();

  // Step 2: After full snap animation completes, reorganize DOM
  setTimeout(() => {
    shiftCards(direction);
  }, transitionDurationSnap);
}

// Function to shift the cards in the DOM
function shiftCards(direction) {
  // Disable transitions before DOM manipulation
  disableTransitions();

  if (direction === "left") {
    // Remove first element
    cardsContainer.removeChild(cardsContainer.firstElementChild);

    // Clone and append new element
    const leftClone = cardsContainer.children[cardsCloned].cloneNode(true);
    cardsContainer.append(leftClone);
  } else {
    // Remove last element
    cardsContainer.removeChild(cardsContainer.lastElementChild);

    // Clone and prepend new element
    const rightCloneIndex = cardsContainer.children.length - 1 - cardsCloned;
    const rightClone = cardsContainer.children[rightCloneIndex].cloneNode(true);
    cardsContainer.prepend(rightClone);
  }

  // reset translation to 0 immediately after the DOM is reorganized
  // to create the illusion of continuous movement
  translateX = 0;

  translate();

  // Re-enable regular translation and preset transition effect
  enableTranslationAndTransition();
}

// Function to temporarily disable transitions
function disableTransitions() {
  [...cardsContainer.children].forEach((card) => {
    card.style.transition = "none";
  });
  cardsContainer.style.scrollBehavior = "";
  // Force reflow to ensure the transition change takes effect immediately
  cardsContainer.offsetHeight;
}

// Function to re-enable transitions
function enableTranslationAndTransition() {
  // It happens after small delay of 100ms to ensure DOM changes are complete
  setTimeout(() => {
    // Release snapping lock
    isSnapping = false;
    // Reestablish original transition settings
    [...cardsContainer.children].forEach((card) => {
      card.style.transition = transition;
    });
    cardsContainer.style.scrollBehavior = "smooth";
  }, 100);
}

// ! BUG: cards crossing through each other at the center of the carousel
// ! Fix: calculate z-index based on the card's position along the carousel's length -
// ! instead of DOM indexing
// ! as reorganizing the DOM happens after the cards have actually crossed in the center.
function getCarouselCenter() {
  return (cardWidth * cardsCount + gap * (cardsCount - 1)) / 2;
}

// Function to get the distance from the card's center to the carousel's center
function getCardCenterToCarouselCenter(i) {
  const carouselCenter = getCarouselCenter();
  // Card's center to the carousel's left
  const cardCenter = i * (cardWidth + gap) + cardWidth / 2;
  return Math.abs(cardCenter + translateX - carouselCenter);
}

// Function to ge the card's normalized distance to the center on the x-axis
function normalizeX(i) {
  return (
    getCardCenterToCarouselCenter(i) / (getCarouselCenter() - cardWidth * 0.5)
  );
}

// ! BUG: when the carousel has even cardsCount
// ! the right side z-index looks reversed
// ! and the central 2 cards are displaced in the z-axis when they shouldn't be.
function getZIndex(i) {
  const maxZIndex = cardsCount;
  return Math.ceil(maxZIndex - maxZIndex * normalizeX(i));
}

function setZIndex() {
  [...cardsContainer.children].forEach((card, i) => {
    card.style.zIndex = `${getZIndex(i)}`;
    console.log(getZIndex(i));
  });
}

function getTranslateZ(i) {
  // Define max z translation - applied to ending cards
  const maxTranslationZ = Math.floor((cardsCount - 1) / 2) * -300;
  return maxTranslationZ * normalizeX(i);
}
