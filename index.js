/* Local Storage Keys */
const TEXT_STATE = 'textState';
const WPM = 'wpm';

/* Defaults */
const WPM_DEFAULT = 200;

/* Shared State */
let burning = false;

/* Helper Functions */
function getWpm() {
  return localStorage.getItem(WPM).trim()
    ? localStorage.getItem(WPM)
    : WPM_DEFAULT;
}

function calcDelaySecondsFromWpm(wpm) {
  return 60 / wpm;
}

function applyAnimationToWords(p, startIndex = 0) {
  const wpm = getWpm();
  const words = Array.from(p.querySelectorAll('.word'));
  const animations = [];

  const slicedWords = words.slice(startIndex);
  slicedWords.forEach((word, index) => {
    // remove old animation
    word.getAnimations().forEach(animation => animation.cancel());

    // add new animation
    const animation = word.animate(
      [
        { opacity: 1, color: 'black' },
        { opacity: 0.5, color: 'red' },
        { opacity: 0, color: 'yellow' },
      ],
      {
        id: word.id,
        duration: 1.8 * 1000,
        easing: 'ease-in',
        delay: calcDelaySecondsFromWpm(wpm) * (index + 1) * 1000,
        fill: 'forwards',
      },
    );
    animation.pause();
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
  const nextAnimationToStart = animations.findLast(
    (animation) => animation.overallProgress === 1,
  );

  // handle the case where none of the animations have finished
  const animationIndex = nextAnimationToStart?.id.split('-')[1] ?? 0;
  const startIndex = animationIndex - num;
  // handle negative startIndex values
  const normalizedStartIndex = startIndex < 0 ? 0 : startIndex;
  // starting from the nth previous animation, reapply the animations
  const newAnimations = applyAnimationToWords(p, normalizedStartIndex);

  // play the animations if they were playing before
  newAnimations.forEach((animation) => {
    if (animation.overallProgress !== 1) {
      burning ? animation.play() : animation.pause();
    }
  });

}

function splitAndAddWords(text) {
  const paragraph = document.querySelector('#text-to-read')
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
      // add a newLine between each word that originally had newLines between them
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

function resetParagraph() {
  const paragraph = document.querySelector('#text-to-read');
  // cancel existing animations to remove old event listeners from running after reset
  const animations = paragraph.getAnimations({subtree: true});
  animations.forEach((animation) => animation.cancel());

  paragraph.replaceChildren();
  splitAndAddWords(localStorage.getItem(TEXT_STATE));
  applyAnimationToWords(paragraph);
  burning = false;
}

/* COMPONENTS */
function initializeTextAreaInput() {
  const textAreaInput = document.querySelector('#text-input');

  const initialText = localStorage.getItem(TEXT_STATE);
  textAreaInput.value = initialText;

  // Update Article value on change
  textAreaInput.addEventListener('input', (event) => {
    const inputValue = event.target.value;

    localStorage.setItem(TEXT_STATE, inputValue);

    splitAndAddWords(inputValue);
  });

  return textAreaInput;
}

function initializeArticle() {
  // wrap each word in a span
  splitAndAddWords(localStorage.getItem(TEXT_STATE));
}

function toggleBurning(wasBurning) {
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

function initializeStartButton() {
  const button = document.querySelector('#start-button');
  button.textContent = 'Start Burning';
  button.addEventListener('click', () => {
    const p = document.querySelector('#text-to-read');
    let animations = p.getAnimations({ subtree: true });
    const wpmInput = document.querySelector('#wpm-input');

    if (burning === false) {
      button.textContent = 'Pause Burning';
      button.style.color = 'blue';
    } else {
      button.textContent = 'Start Burning';
      button.style.color = 'red';
    }
    toggleBurning(burning);
  });

  return button;
}

function initializeUnburnButton() {
  const numWords = 10;
  const button = document.querySelector('#unburn-button');
  button.textContent = `Restore ${numWords} words`;
  button.style.color = 'green';
  button.addEventListener('click', () => restoreWords(numWords));
  return button;
}

function initializeResetButton() {
  const button = document.querySelector('#reset-button');
  button.textContent = 'Reset Burn';
  button.style.color = 'green';
  button.style.minWidth = '85px';
  button.addEventListener('click', () => {
    const wpmInput = document.querySelector('#wpm-input');
    const startButton = document.querySelector('#start-button');

    startButton.textContent = 'Start Burning';
    startButton.style.color = 'red';
    startButton.disabled = false;
    resetParagraph();
    wpmInput.disabled = false;
  });
}

function initializeWpmInput() {
  const wpmInput = document.querySelector('#wpm-input');
  wpmInput.style.maxWidth = '50px';
  wpmInput.value = getWpm();
  wpmInput.addEventListener('change', (event) => {
    const wpm = event.target.value;
    localStorage.setItem('wpm', wpm);
  });
}

function initializeControlsSection() {
  const section = document.querySelector('#controls-section');
  const leftControls = document.querySelector('#left-controls');
  const startButton = initializeStartButton();
  const unburnButton = initializeUnburnButton();
  const wpmInput = initializeWpmInput();
  const resetButton = initializeResetButton();

  section.style.display = 'flex';
  section.style.justifyContent = 'space-between';
  section.style.gap = '4px';

  leftControls.style.display = 'flex';
  leftControls.style.gap = '4px';
}

/* RENDERING LOGIC */
document.addEventListener('DOMContentLoaded', () => {
  initializeArticle();
  initializeTextAreaInput();
  initializeControlsSection();
});
