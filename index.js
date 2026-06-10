/* Local Storage Keys */

const TEXT_STATE = 'textState';
const WPM = 'wpm';

/* Constants */

const WPM_DEFAULT = 200;
const NUM_WORDS_UNBURN = 10;
const ANIMATION_DURATION = 1.8 * 1000;

/* Shared State */

let burning = false;

/* Manage Local Storage */

function initializeLocalStorage() {
  if (!localStorage.getItem(TEXT_STATE)) {
    localStorage.setItem(TEXT_STATE, '');
  }
  if (!localStorage.getItem(WPM)) {
    localStorage.setItem(WPM, WPM_DEFAULT);
  }
}

function getWpm() {
  const storedWpm = localStorage.getItem(WPM);
  return storedWpm ? storedWpm : WPM_DEFAULT;
}

function getTextState() {
  const storedText = localStorage.getItem(TEXT_STATE);
  return storedText ? storedText : '';
}

/* Article of Text to Read */

function splitAndAddWords(text) {
  const paragraph = document.querySelector('#text-to-read');
  const words = text.split(' ');

  const newWords = [];

  let wordIndex = 0;

  words.forEach((word, index) => {
    // handle newLine characters
    const splitWords = word.split('\n');
    splitWords.forEach((splitWord, splitIndex) => {
      if (splitWord.trim()) {
        const wordSpan = document.createElement('span');
        wordSpan.textContent = splitWord;
        wordSpan.classList.add('word');
        wordSpan.id = `word-${wordIndex}`;
        wordIndex++;
        newWords.push(wordSpan);
      }
      // add a newLine between the words that originally had a newLine between them
      if (splitIndex < splitWords.length - 1) {
        newWords.push(document.createTextNode('\n'));
      }
    });

    // add a space between each word
    if (index < words.length - 1) {
      newWords.push(document.createTextNode(' '));
    }
  });

  paragraph.replaceChildren(...newWords);
}

function calcDelaySecondsFromWpm(wpm) {
  return 60 / wpm;
}

function applyAnimationToWords(p, startIndex = 0, playNewAnimations = false) {
  const wpm = getWpm();
  const words = Array.from(p.querySelectorAll('.word'));
  const animations = [];

  const slicedWords = words.slice(startIndex);
  slicedWords.forEach((word, index) => {
    // remove old animation
    word.getAnimations().forEach((animation) => animation.cancel());

    // add new animation
    const animation = word.animate(
      [
        { opacity: 1, color: 'black' },
        { opacity: 0.5, color: 'red' },
        { opacity: 0, color: 'yellow' },
      ],
      {
        duration: ANIMATION_DURATION,
        easing: 'ease-in',
        delay: calcDelaySecondsFromWpm(wpm) * (index + 1) * 1000,
        fill: 'forwards',
      },
    );
    if (!playNewAnimations) {
      animation.pause();
    }
    if (index === slicedWords.length - 1) {
      animation.addEventListener('finish', () => {
        const startButton = document.querySelector('#start-button');
        startButton.disabled = true;
      });
    }
    animations.push(animation);
  });
  if (animations.length > 0) {
    const startButton = document.querySelector('#start-button');
    startButton.disabled = false;
  }
  return animations;
}

function initializeArticle() {
  const paragraph = document.querySelector('#text-to-read');
  // cancel existing animations to remove old event listeners from running after reset
  const animations = paragraph.getAnimations({ subtree: true });
  animations.forEach((animation) => animation.cancel());

  paragraph.replaceChildren();
  splitAndAddWords(getTextState());
  applyAnimationToWords(paragraph);
}

/* Unburn (Restore N Words) Button */

function restoreWords(num) {
  // reset the last num animations that haven't completely finished
  const p = document.querySelector('#text-to-read');
  const animations = p.getAnimations({ subtree: true });

  if (animations.length === 0) return;

  // pause the animations
  animations.forEach((animation) => {
    if (animation.overallProgress === 1) {
      animation.pause();
    }
  });

  // find the last animation that has finished
  const nextAnimationIndexToStart = animations.findLastIndex(
    (animation) => animation.overallProgress === 1,
  );

  // handle the case where none of the animations have finished
  const animationIndex =
    nextAnimationIndexToStart === -1 ? 0 : nextAnimationIndexToStart;
  const startIndex = animationIndex - num;
  // handle negative startIndex values
  const normalizedStartIndex = startIndex < 0 ? 0 : startIndex;
  // starting from the nth previous animation, reapply the animations
  applyAnimationToWords(p, normalizedStartIndex, burning);
}

function initializeUnburnButton() {
  const button = document.querySelector('#unburn-button');
  button.textContent = `Restore ${NUM_WORDS_UNBURN} words`;
  button.addEventListener('click', () => restoreWords(NUM_WORDS_UNBURN));
}

/* Text Area Input */

function initializeTextAreaInput() {
  const textAreaInput = document.querySelector('#text-input');

  const initialText = getTextState();
  textAreaInput.value = initialText;

  // Update Article value on change
  textAreaInput.addEventListener('input', (event) => {
    const inputValue = event.target.value;

    localStorage.setItem(TEXT_STATE, inputValue);

    resetTextAndBurnBehavior();
  });
}

/* Start/Pause Button */

function resetStartButton() {
  const button = document.querySelector('#start-button');
  button.textContent = 'Start Burning';
  button.style.color = 'red';
  button.disabled = false;
  burning = false;
  return button;
}

function initializeStartButton() {
  function toggleBurningBehavior(wasBurning) {
    const p = document.querySelector('#text-to-read');
    let animations = p.getAnimations({ subtree: true });
    const wpmInput = document.querySelector('#wpm-input');

    if (!wasBurning && animations.length === 0) {
      animations = applyAnimationToWords(p);
    }

    animations.forEach((animation) => {
      if (animation.overallProgress !== 1) {
        wasBurning ? animation.pause() : animation.play();
      }
    });
    wpmInput.disabled = !wasBurning;
    burning = !wasBurning;
  }

  const button = resetStartButton();
  button.addEventListener('click', () => {
    if (burning === false) {
      button.textContent = 'Pause Burning';
      button.style.color = 'blue';
    } else {
      button.textContent = 'Start Burning';
      button.style.color = 'red';
    }
    toggleBurningBehavior(burning);
  });
}

/* WPM Input */

function resetWpmInput() {
  const wpmInput = document.querySelector('#wpm-input');
  wpmInput.disabled = false;
  wpmInput.value = getWpm();
  return wpmInput;
}

function initializeWpmInput() {
  const wpmInput = resetWpmInput();
  wpmInput.addEventListener('change', (event) => {
    const wpm = event.target.value;
    localStorage.setItem(WPM, wpm);
  });
}

/* Reset Button */

function resetTextAndBurnBehavior() {
  resetStartButton();
  initializeArticle();
}

function initializeResetButton() {
  const button = document.querySelector('#reset-button');
  button.textContent = 'Reset Burn';
  button.addEventListener('click', resetTextAndBurnBehavior);
}

/* Initialization Logic */

document.addEventListener('DOMContentLoaded', () => {
  initializeLocalStorage();

  initializeArticle();

  initializeTextAreaInput();

  // Controls section
  initializeStartButton();
  initializeUnburnButton();
  initializeWpmInput();
  initializeResetButton();
});
