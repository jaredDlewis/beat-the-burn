# Beat the Burn
This is a small coding exercise for the prompt "Burn after reading."

### Goals
- Write code by hand (no AI generated code)
- Learn something new (Web Animations API)
- Avoid frameworks (vanilla DOM manipulation)

### Codebase priorities
- Prioritize adding features over implementing tests or spreading code out amongst modules
- Still keep the code relatively organized

### Functionality to build

MVP:
- [x] render an input for a user to paste a large block of code
- [x] display the text below
- [x] render a button for the user to start the burn
- [x] render an input for the user to choose the speed at which the text burns in terms of words per minute
- [x] the text disappears at the chosen words per minute

Stretch:
- [x] pause button
- [x] reset button
- [x] the reset button is available at all times
- [x] there is a "Add [n] words back" button that allows the user to add text back if needed
- [x] store text in localStorage for persistent state
- [x] the textarea should expand with the width of the page
- [ ] enable changing wpm for remaining text while burning is paused
- [ ] the controls section should stick to the top of the page when scrolling lower would make it disappear
- [ ] make the "burning" look more realistic