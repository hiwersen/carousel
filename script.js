// Get carousel elements
const carousel = document.getElementById("carousel");
const cardsContainer = document.getElementById("cards-container");
const cards = document.querySelectorAll(".card");

// Set parameters
let translateX = 0;
let cardsCount = cards.length;
const cardsCloned = 1;
let cardWidth = cards[0].offsetWidth;
let gap = Number(
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

// Set snap parameters
const snapThreshold = (cardWidth + gap) * 0.5;
const transitionDurationSnap = transitionDuration * 2;
// Flag to prevent multiple concurrent translations
let isSnapping = false;

// Clone and append ending cards
const leftClone = cards[0].cloneNode(true);
cardsContainer.append(leftClone);

const rightClone = cards[cardsCount - 1].cloneNode(true);
cardsContainer.prepend(rightClone);

cardsCount = cardsContainer.children.length;

// Set wheel speed based on cardsCount
const wheelSpeed = cardsCount * 0.1;

// Function to update x translation
function updateTranslateX(deltaX, speed) {
  // Normalize wheel delta
  deltaX = Math.round(deltaX * speed);
  translateX += deltaX * -1;
  console.log(translateX, deltaX);
}

// Function to perform regular translation with preset transition effect
function translate() {
  [...cardsContainer.children].forEach((card, i) => {
    const z = getTranslateZQuadratic(i);
    card.style.transform = `translate3D(${translateX}px, 0px, ${z}px)`;
  });
  setZIndex();
}

// Function to perform a smooth snap translation - with prolonged transition effect
function snap(direction) {
  // Set snapping flag to prevent wheel and touch events
  isSnapping = true;

  // Step 1: Complete full translation (to end position)
  const endPos = direction === "left" ? -cardWidth - gap : cardWidth + gap;
  translateX = endPos;

  // Translate cards to the end position with transition enabled for smooth effect
  [...cardsContainer.children].forEach((card) => {
    card.style.transition = `transform ${transitionDurationSnap}ms cubic-bezier(0.34, 1.1, 0.64, 1)`;
  });

  translate();

  // Step 2: After full snap translation completes, reorganize DOM
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
  handleTouchCancel();

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

function getCarouselCenter() {
  return (cardWidth * cardsCount + gap * (cardsCount - 1)) / 2;
}

// Function to get the distance from the card's center to the carousel's center
function getCardCenterFromCarouselCenter(i) {
  const carouselCenter = getCarouselCenter();
  // Card's center to the carousel's left
  const cardCenter = i * (cardWidth + gap) + cardWidth / 2;
  return Math.abs(cardCenter + translateX - carouselCenter);
}

// Function to get the card's normalized distance (0-1) from the center on the x-axis
function normalizeX(i) {
  return (
    getCardCenterFromCarouselCenter(i) / (getCarouselCenter() - cardWidth * 0.5)
  );
}

function getZIndex(i) {
  const maxZIndex = cardsCount;
  return Math.ceil((maxZIndex - maxZIndex * normalizeX(i)) * 10);
}

function setZIndex() {
  [...cardsContainer.children].forEach((card, i) => {
    card.style.zIndex = `${getZIndex(i)}`;
  });
}

function getTranslateZCircular(i) {
  // Get normalized distance x to center (0-1)
  const x = normalizeX(i);

  // Define radius of the circular arch
  const radius = Math.floor((cardsCount - 1) / 2) * 80;

  // Create a circular arch effect
  return radius * (Math.cos(x * Math.PI) - 1);
}

function getTranslateZQuadratic(i) {
  // Get normalized distance x to center (0-1)
  const x = normalizeX(i);

  // Define max z translation (deepest point of the arch)
  const maxZ = Math.floor((cardsCount - 1) / 2) * -300;

  // Create a quadratic arch effect
  return maxZ * Math.pow(x, 2);
}

function init() {
  disableTransitions();
  translate();
  enableTranslationAndTransition();
}

init();

/**
 * Handle window resize
 */

window.addEventListener("resize", () => {
  cardWidth = cards[0].offsetWidth;
  gap = Number(
    window
      .getComputedStyle(cardsContainer)
      .getPropertyValue("column-gap")
      .slice(0, -2)
  );
  init();
});

/**
 * Hand wheel event
 */
window.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();

    // Skip if snap translation is in progress
    if (isSnapping) return;

    updateTranslateX(e.deltaY, wheelSpeed);

    // Check for snap translation
    if (Math.abs(translateX) > snapThreshold) {
      if (translateX < 0) {
        snap("left");
      } else {
        snap("right");
      }
    } else {
      // Regular translation
      translate();
    }
  },
  { passive: false }
);

/**
 * Hand touch events
 */

// Track touch positions
const touchSpeed = 1;
const maxSwipe = cardWidth + gap;
let touchStartX = null;
let touchEndX = null;

function handleTouchStart(e) {
  e.preventDefault();
  if (isSnapping) return;

  touchStartX = e.touches[0].clientX;
}

function handleTouchMove(e) {
  e.preventDefault();
  if (isSnapping) return;

  const touchMoveX = e.touches[0].clientX;
  touchStartX = touchStartX ?? touchMoveX;
  const touchDeltaX = touchMoveX - touchStartX;
  translateX = touchDeltaX;

  console.log("start:", touchStartX);
  console.log("move:", touchMoveX);
  console.log("delta:", touchDeltaX);

  // Check for snap translation
  if (Math.abs(touchDeltaX) > snapThreshold) {
    if (touchDeltaX < 0) {
      snap("left");
    } else {
      snap("right");
    }
  } else {
    // Regular translation
    translate();
  }

  /*
  console.log(
    "@move:",
    "start:",
    touchStartX,
    "end:",
    touchEndX,
    "translateX:",
    translateX
  );
  */
}

function handleTouchEnd(e) {
  if (isSnapping) return;

  touchEndX = e.changedTouches[0].clientX;
  const touchDeltaX = touchEndX - touchStartX;

  // Check for snap translation
  if (Math.abs(touchDeltaX) > snapThreshold) {
    if (touchDeltaX < 0) {
      snap("left");
    } else {
      snap("right");
    }
  } else {
    // Return to initial position
    handleTouchCancel();
  }
}

function handleTouchCancel() {
  touchStartX = null;
  touchEndX = null;
  translateX = 0;
  translate();
}

carousel.addEventListener("touchstart", handleTouchStart, { passive: false });
carousel.addEventListener("touchmove", handleTouchMove, { passive: false });
carousel.addEventListener("touchend", handleTouchEnd);
carousel.addEventListener("touchcancel", handleTouchCancel);

// ! FIX: bug when swiping right after snapping
// ! TODO: limit swipe length
// ! TODO: ADD arrow key event listeners
