// Get carousel elements
const carousel = document.getElementById("carousel");
const cardsContainer = document.getElementById("cards-container");
const cards = document.querySelectorAll(".card");

// Set parameters
let translate = 0;
const wheelSpeed = 0.6;
const cardsCount = cards.length;
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

// Flag to prevent multiple translations
let isSnapping = false;

// Clone and append ending cards
const leftClone = cards[0].cloneNode(true);
cardsContainer.append(leftClone);

const rightClone = cards[cardsCount - 1].cloneNode(true);
cardsContainer.prepend(rightClone);

// Perform regular translation
window.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();

    // Skip regular translation if snap translation  is in progress
    if (isSnapping) return;

    // Normalize wheel delta
    const deltaY = Math.round(e.deltaY * wheelSpeed);
    translate += deltaY * -1;

    [...cardsContainer.children].forEach((card) => {
      card.style.translate = `${translate}px`;
    });

    // Check for snap translation
    const threshold = (cardWidth + gap) * 0.5;

    if (translate <= threshold * -1) {
      // Left shift (scrolling right)
      snap("left", translate);
    } else if (translate >= threshold) {
      // Right shift (scrolling left)
      snap("right", translate);
    }
  },
  { passive: false }
);

// Function to perform a smooth snap translation - with transition effect
function snap(direction) {
  isSnapping = true;

  // Step 1: Complete full translation (to end position)
  const endPos = direction === "left" ? -cardWidth - gap : cardWidth + gap;

  // Translate cards to the end position with transition enabled for smooth effect
  [...cardsContainer.children].forEach((card) => {
    card.style.transition = `translate ${transitionDurationSnap}ms cubic-bezier(0.34, 1.1, 0.64, 1)`;
    card.style.translate = `${endPos}px`;
  });

  // Step 2: After full snap translation (endPos) completes (transitionDurationSnap), reorganize DOM
  shiftCards(direction);
}

// Function to shift the cards in the DOM
function shiftCards(direction) {
  // Delay shift - wait for snap transition effect to complete
  const delayShift = transitionDurationSnap;

  setTimeout(() => {
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
      const rightClone =
        cardsContainer.children[rightCloneIndex].cloneNode(true);
      cardsContainer.prepend(rightClone);
    }

    // reset translation to 0 immediately after the DOM is reorganized
    // to create the illusion of continuous movement
    translate = 0;
    [...cardsContainer.children].forEach((card) => {
      card.style.translate = `${translate}px`;
    });

    // Reenable regular translation and regular transition effect - it happens after small delay of 100ms
    enableTranslationAndTransition();
  }, delayShift);
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
  // Small delay to ensure DOM changes are complete
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
