// MVP:
// render an input for a user to paste a large block of text

// display the text below
// render a button for the user to start the burn
// render dropdown input for the user to choose the speed at which the text burns in terms of words per minute
// the text disappears at the chosen charaters per minute
// there is a "Add [n] words back" button that allows the user to add text back if needed

// Stretch:
// pause button
// reset button
// store text in localStorage for next time
// make the "burning" look more realistic
// the pause button shoud stick to the top of the page
// auto scroll the page so that the burning portion is always visible at the top of the page

/* Local Storage Keys */
const TEXT_STATE = 'textState';
const WPM = 'wpm';

/* Defaults */
const WPM_DEFAULT = 200;

function getWpm() {
  return localStorage.getItem(WPM).trim()
    ? localStorage.getItem(WPM)
    : WPM_DEFAULT;
}

function calcDelaySecondsFromWpm(wpm) {
  return 60 / wpm;
}

/* Helper Functions */
function applyAnimationToWords(p, wpm) {
  const words = p.querySelectorAll('.word');
  const animations = []
  words.forEach((word, index) => {
    const initialColor = 'black';
    const initialOpacity = 1;
    word.style.color = initialColor;
    word.style.opacity = initialOpacity;
    const animation = word.animate(
      [
        { opacity: initialOpacity, color: initialColor },
        { opacity: 0, color: 'red' },
      ],
      {
        duration: 0.6 * 1000,
        easing: 'ease-in',
        delay: calcDelaySecondsFromWpm(wpm) * (index + 1) * 1000,
        fill: 'forwards',
      },
    );
    animation.pause();
    if (index === words.length - 1) {
      animation.addEventListener('finish', () => {
        const button = document.querySelector('#animation-button');
        button.textContent = 'Reset';
        button.style.color = 'green';
      });
    }
    animations.push(animation);
  });
  return animations;
}

function splitAndAddWords(paragraph, text) {
  const words = text.split(' ');

  const newWords = [];

  words.forEach((word, index) => {
    // handle newLine characters
    const splitWords = word.split('\n');
    splitWords.forEach((splitWord, splitIndex) => {
      if (splitWord.trim()) {
        const wordSpan = document.createElement('span');
        wordSpan.textContent = splitWord;
        wordSpan.classList.add('word');
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

/* COMPONENTS */
function createTextAreaInput(article) {
  const textAreaInput = document.createElement('textarea');

  textAreaInput.id = 'text-input';
  textAreaInput.name = 'text-input';
  textAreaInput.rows = '10';
  textAreaInput.cols = '50';

  const initialText = localStorage.getItem(TEXT_STATE);
  textAreaInput.value = initialText;

  // Update Article value on change
  textAreaInput.addEventListener('input', (event) => {
    const inputValue = event.target.value;

    localStorage.setItem(TEXT_STATE, inputValue);

    const p = article.querySelector('p');
    splitAndAddWords(p, inputValue);
  });

  return textAreaInput;
}

function createArticle() {
  const article = document.createElement('article');

  article.id = 'article-of-text';

  const paragraph = document.createElement('p');
  paragraph.id = 'text-to-read';

  // wrap each word in a span
  splitAndAddWords(paragraph, localStorage.getItem(TEXT_STATE));

  article.append(paragraph);

  return article;
}

function resetParagraph() {
  const paragraph = document.querySelector('#text-to-read');
  paragraph.replaceChildren();
  splitAndAddWords(paragraph, localStorage.getItem(TEXT_STATE));
}

function createControlsButton() {
  const button = document.createElement('button');
  button.id = 'animation-button';
  button.textContent = 'Start Burning';
  button.style.color = 'red';
  button.addEventListener('click', () => {
    const p = document.querySelector('#text-to-read');
    let animations = p.getAnimations({ subtree: true });
    const wpmInput = document.querySelector('#wpm-input');
    if (button.textContent === 'Start Burning') {
      button.textContent = 'Pause Burning';
      button.style.color = 'blue';
      const wpm = getWpm();
      if (animations.length === 0) {
        animations = applyAnimationToWords(p, wpm);
      }
      animations.forEach((animation) => {
        if (animation.overallProgress !== 1) {
          animation.play();
        }
      });
      wpmInput.disabled = true;
    } else if (button.textContent === 'Pause Burning') {
      button.textContent = 'Start Burning';
      button.style.color = 'red';
      animations.forEach((animation) => {
        if (animation.overallProgress !== 1) {
          animation.pause();
        }
      });
      wpmInput.disabled = true;
    } else {
      resetParagraph();
      button.textContent = 'Start Burning';
      button.style.color = 'red';
      wpmInput.disabled = false;
    }
  });

  return button;
}

function createWpmInput() {
  const span = document.createElement('span');
  const title = document.createTextNode(' Words per minute: ');
  const wpmInput = document.createElement('input');
  wpmInput.id = 'wpm-input';
  wpmInput.type = 'number';
  wpmInput.style.maxWidth = '50px';
  wpmInput.value = getWpm();
  wpmInput.addEventListener('change', (event) => {
    const wpm = event.target.value;
    localStorage.setItem('wpm', wpm);
  });
  span.append(title);
  span.append(wpmInput);
  return span;
}

function createControlsSection() {
  const section = document.createElement('section');
  const controlsButton = createControlsButton();
  const wpmInput = createWpmInput();
  section.append(controlsButton);
  section.append(wpmInput);
  return section;
}

/* RENDERING LOGIC */
document.addEventListener('DOMContentLoaded', () => {
  const article = createArticle();
  const textAreaInput = createTextAreaInput(article);
  const controlsSection = createControlsSection();

  document.body.append(textAreaInput);
  document.body.append(controlsSection);
  document.body.append(article);
});
