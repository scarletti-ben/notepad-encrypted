# Project Overview
The aims and constraints I gave myself before starting this were to
- Have no reliance on external libraries or imports
- Build entirely with "vanilla" `Javascript` / `HTML` / `CSS`
- Build a notepad application with note tabs that you can switch between
- Allow useers to create notes, close notes, open old notes
- Allow notes to persist across sessions

The less important feature I wanted to add as a proof of concept was an encrpytion system in which the notes in `localStorage` were encrypted using a user password.

All of the above aims were met, and it has morphed into a modular `JavaScript` project with a few proof of concept modules that are rather rough around the edges. Both this README, and the project itself, are more learning tools for myself than anything else.

### A Note On Compatability
- Designed and tested in `Google Chrome Version 134.0.6998.178 (Official Build) (64-bit)`
- As there is decent use of the `import` / `export` syntax introduced in `ECMAScript 6 (ES6)` / `ES2015` it is likely that compatability with older browsers is limited
- Not tested on other browsers, mobile devices, or other desktop devices

# Repository Overview

### FixedTable – JavaScript Wrapper for HTML Table
- [`fixed-table.css`](./docs/fixed-table/fixed-table.css)
- [`fixed-table.js`](./docs/fixed-table/fixed-table.js)

I started writing this script to gain a deeper undestanding of the structure of `HTML` tables, so that in the future I would never have to look at them again. The primary aim for the functionality of the `FixedTable` class is to use `JavaScript` to generate an `HTML` table that has a fixed number of columns, fits across a fixed width, and has limited functionality for resizing of columns. It is more suited to data viewing than data maniupulation, less a spreadsheet and more a lens.

The structure for a basic `HTML` table might look something like the snippet below
```html
<table>
  <colgroup>
    <col>
  </colgroup>
  <thead>
    <tr>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td></td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <td></td>
    </tr>
  </tfoot>
</table>
```

The constructor of `FixedTable` attempts to build the `HTML` structure with a more functional approach
```javascript
constructor(headers) {
    this.headers = headers;
    this.element = document.createElement('div');
    this.table = document.createElement('table');
    this.colgroup = document.createElement('colgroup');
    this.head = document.createElement('thead');
    this.headRow = document.createElement("tr");
    this.body = document.createElement('tbody');
    this.foot = document.createElement('tfoot');
    this.init();
}
```

The `FixedTable` class generates this sort of structure for a given list of headers via its constructor. The element that holds a structure similar to the `HTML` is `this.element` which is a `<div>` element, and is the parent of the `<table>` element `this.table`. The other attributes of `FixedTable` instances relate to the child elements of `<table>`.

Uses `.fixed-table` styling from `fixed-table.css` which utilises `table-layout: fixed` to prevent the table overflowing. This should mean that altering the column widths via `table.setColumnWidth` shouldn't cause any headaches.

#### Useful `FixedTable` Methods
- `addRowFromStrings(...strings)`
- `addRowFromElements(...elements)`
- `toggleColumnHighlighted(columnIndex)`
- `toggleColumnCollapsed(columnIndex)`
- `setColumnWidth(columnIndex, value)`

#### Example Usage of `FixedTable`
```javascript
let table = new FixedTable(['ID', 'Name', 'Age']);
document.body.appendChild(table.element);
table.addRowFromStrings(['384', 'Alice', '42']);
table.setColumnWidth(1, '80px');
```

---

### Sprite - JavaScript Wrapper for Interactive SVG Icons / Buttons
- [`sprite.css`](./docs/sprite/sprite.css)
- [`sprite.js`](./docs/sprite/sprite.js)
- [`sprite.svg`](./docs/sprite/sprite.svg)

There aren't many projects I work on in which I don't need a button that conveys its purpose visually, rather than textually. In general it makes for a more modern looking UI. The aim of creating the `Sprite` was to wrap the visual and functional aspects together. It is by no means complete, and serves more as a proof of concept for another project, a simple framework to be expanded upon later. More animations could be added as methods of `Sprite`, accompanied by named `keyframes` in `sprite.css` but this project has no use for them.

Styling is handled via `sprite.css` which assumes a `<div>` with `class='sprite'` as the parent of an `<svg>` element, the `<div>` element is stored as the attribute `this.element` for `Sprite` instances.

#### A Note on SVG
Often, when testing, I use [`Google Material Icons`](https://fonts.google.com/icons) and just use text codes in the sytnax `<span class="material-symbols-outlined">menu</span>` where the inner text of the element is the name of the icon. This is great when testing as you can "hot swap" the icon very easily. One issue is that you introduce an external dependency, and another issue is that you get less control over the `SVG` itself. An alternative would be "inline" `SVG`, which allows for a great deal of fine-tuning but can make your `HTML` or `JavaScript` feel "bloated". 

In the past I have opted for `.json` files to act as `SVG` arrays, but recently I have found that you can make use of the `<symbol>` tag in `.svg` files, and essentially read this file as a "spritesheet" of sorts. An example of the format of a sprite symbol that would be in `sprite.svg` is in the snippet below
```svg
<symbol id="name" viewBox="0 -960 960 960">
    <path
        d="..." />
</symbol>
```

The `HTML` would utlisise the `<use>` tag in some way similar to the snippet below, where `sprite/sprite.svg` is the path to the `.svg` file and `name` is the name of the `<symbol>` id
```html
<svg width="100" height="100">
  <use href="sprite/sprite.svg#name"></use>
</svg>
```

An excerpt from the `Sprite` class shows how the `<symbol>` elements from `sprite.svg` are utilised, and also shows a "cache busting" technique to ensure new requests for `sprite.svg` are made every time it needs to be read from
```javascript
constructor(elementID, symbolName) {
    this.element = document.createElement("div");
    this.element.id = elementID;
    this.element.className = "sprite";
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    this.svg.appendChild(this.use);
    this.element.appendChild(this.svg);
    this.swap(symbolName);
}

swap(symbolName) {
    let cacheBust = new Date().getTime();
    let value = `sprite/sprite.svg?${cacheBust}#${symbolName}`;
    this.use.setAttribute('href', value);
    tools.reflow(this.element);
}
```

#### A Note on CSS Animations / Keyframes
You define animations in `CSS` with a name that can then be referenced later. For `sprite.css` we define a 360 degree rotation
```css
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
```

We can start that animation in `JavaScript` using something similar to the function below, where `rotate` is the name of the `CSS` keyframe
```javascript
function rotate(element, n = 1, duration = 1000) {
    element.style.animation = `rotate ${duration}ms linear ${n}`;
}
```

#### Example Usage of `Sprite`
```javascript
const sprite = new Sprite('save-button', 'save');
sprite.element.title = 'save';
container.appendChild(sprite.element);
sprite.element.addEventListener('click', (event) => {
  sprite.swap('saving');
  sprite.rotate(1000, 1);
  console.log('saving not implemented');
});
```

---


### Switcher - A Browser-Style Tab Switcher
- [`switcher.css`](./docs/switcher/switcher.css)
- [`switcher.js`](./docs/switcher/switcher.js)

The aim of `Switcher` is to create a minimal version of a tab switching system, similar to that of a desktop browser such as `Chrome`, for use across multiple projects. Having a central window that displays a single element at a time, and being able to switch between these elements at the click of a button is a very familiar design pattern for an application.

Currently `Switcher` does not create instances, and is instead a class of `static` methods for a singular element with `id='switcher'`, it would not be difficult to tweak the code to work for multiple `Switcher` instances.

`Switcher` allows only one `pane` element to be displayed at a time within the `frame`, and each `pane` element has an associated `notch` element in the `ribbon`, allowing the user to "switch tabs" with a click of the mouse much like in `Chrome`.

`Switcher` uses the `Tab` class for instances that link `pane` and `notch` elements together. The `pane` and `notch` elements are also linked together by a shared attribute `element.dataset.uuid`, generated via `crypto.randomUUID()`, which is a unique identifier for the tab, and helps avoid `HTML` id clashing.

In its current implementation, the `viewport` element houses the `header`, `frame` and `footer` elements. As the `header` and `footer` elements are separate from the `frame` element, each tab shares a header and footer. This is useful for creating a toolbar that is shared across different tabs but in future implementations this behaviour may be altered to allow tabs to control their header and footer, if needed.

The `CSS` styling for `Switcher` and `Tab` is found in `switcher.css`

The styling for `Tab` uses `.notch` and `.pane` styling from `switcher.css`, and `Switcher` utilises multiple other styling rules from the same file

When initialising `Switcher` you pass the id for an existing `HTML` element container that the `Switcher` element will be appended to. The container element will have a structure similar to below injected into it via `Switcher.inject(containerID)`
```html
<div id="switcher" class="switcher">
  <div class="top-section">
    <div class="ribbon"></div>
  </div>
  <div class="bottom-section">
    <div class="viewport">
      <div class="header"></div>
      <div class="frame"></div>
      <div class="footer"></div>
    </div>
  </div>
</div>`;
```

The `init` function of `Switcher` should look something like the snippet below, but is subject to changes that may not appear in this README
```javascript
/**
 * Generate `Switcher` HTML structure inside an existing container element
 * and assign HTML elements to attributes of `Switcher`
 * @param {string} containerID - The ID of the existing container element
 * @param {boolean} [header=true] - Whether header is visible
 * @param {boolean} [footer=true] - Whether footer is visible
 * @param {boolean} [border=true] - Whether border is visible
 */
static init(containerID, header = true, footer = true, border = true) {
    const id = this.inject(containerID);
    this.element = document.getElementById(id);
    this.top = this.element.querySelector('.top-section');
    this.ribbon = this.element.querySelector('.ribbon');
    this.bottom = this.element.querySelector('.bottom-section');
    this.viewport = this.element.querySelector('.viewport');
    this.header = this.element.querySelector('.header');
    this.frame = this.element.querySelector('.frame');
    this.footer = this.element.querySelector('.footer');
    this.toggleHeader(header);
    this.toggleFooter(footer);
    this.toggleBorder(border);
}
```

The same applies to the `constructor` of `Tab` below
```javascript
/** 
 * Initialise a Tab instance for use with Switcher
 * - A wrapper for linked HTML elements for use with `Switcher`
 * @param {string} uuid - The unique identifier for this tab
 * @param {HTMLDivElement} element - The element to go in the pane
 */
constructor(uuid, element) {
    this.uuid = uuid;
    this._element = element;
    this.pane = this._createPane();
    this.notch = this._createNotch();
}
```

#### Useful Methods for `Switcher`
- `getTab(tabUUID)` get a tab from a given string uuid
- `highlightTab(tab)` highlights the given tab and shows its corresponding pane, hiding all other panes
- `closeTab(tab)` closes the given tab removes its pane and notch from the DOM
- `addTab(tab)` adds a tab instance to the `Switcher`, appending its notch and pane to the DOM
- `toggleHeader(shown)` toggles the visibility of the `Switcher` header
- `toggleFooter(shown)` toggles the visibility of the `Switcher` footer
- `toggleBorder(shown)` toggles the visibility of the `Switcher` border

#### Example Usage of Switcher and Tab
```javascript
import { Tab, Switcher } from './switcher.js';
Switcher.init('page', true, false, true);
let element = document.createElement('div');
let uuid = crypto.randomUUID();
let tab = new Tab(uuid, element);
tab.notch.innerText = 'test';
tab.pane.style.backgroundColor = 'red';
Switcher.addTab(tab);
Switcher.highlightTab(tab);
```

---

### Note - JavaScript Wrapper for a Switcher Tab with a Textarea
- [`note.css`](./docs/note/note.css)
- [`note.js`](./docs/note/note.js)

The `Note` class is a wrapper for a `Tab` (for use with `Switcher`) that includes a `textarea` element. A `Note` instance is useful as a way to visualise note data, which is in `localStorage`, the note name will be in the `notch` element of the `Tab`, and the note text will be in the `<textarea>`. In this project, `main.js` creates `Note` instances with various project-specific listeners.

Similarly to the default usage of `Tab` and `Switcher`, each `Note` uses a unique identifier (uuid). This unique identifier is also useful for saving notes to `localStorage`, as notes can share a name, but will be given a different key in the data object from their uuid.

Uses `.note` styling from `note.css`

The `constructor` for `Note` can be found below
```javascript
/** 
 * Construct note instance as a wrapper for a `Tab` with a `textarea`
 * @param {string} uuid - The unique identifier for the note instance
 * @param {{ name: string, text: string }} data - The data for this instance
 */
constructor(uuid, data) {
    this.uuid = uuid;
    this.data = data;
    this.textarea = this._createTextarea(data);
    this.tab = this._createTab(this.textarea);
    this._applyListeners();
}
```
The `_createTextarea` method creates a `<textarea>` element which will be used for the note text. The `_createTab` method creates a `<div>` element of `class='note'` to act as the parent of the `textarea`, and that same `div` is passed to `Tab` as the element to go in the `pane` of `Switcher` when the tab is open. The name of the note is going to be displayed in the `notch` of the `Tab` instance.#

The `_applyListeners()` method adds `input` listeners for the `textarea` and `notch` so that their text is synced with `note.data` when the user edits element text.

#### Useful `Note` Methods
- `Note.getNote(noteUUID)` retrieves a `Note` instance from `Note.instances` by `uuid`

#### Example Usage of `Note`
```javascript
import { Switcher, Tab } from "./switcher/switcher.js"
import { Note } from "./note/note.js"
let noteUUID = crypto.randomUUID();
let noteData = {
    name: 'name',
    text: 'text'
}
let note = new Note(noteUUID, noteData);
Note.instances.push(note);
Switcher.addTab(note.tab);
note.textarea.value = 'new text';
console.log(note.data);
```
---

### The Rest of the Owl
- [`index.html`](./docs/index.html/)
- [`main.css`](./docs/main.css/)
- [`main.js`](./docs/main.js/)
- [`tools.js`](./docs/tools.js/)

#### index.html
With the way that the "modular" system is set up, `index.html` only needs to import a single `JavaScript` file, which serves as the entry point script of the `notepad-encrypted`. The script used for this is `main.js`.

#### main.js
The script imports and ties the functionality together from the other modules, which are all mostly "project agnostic". 

Because `main.js` is loaded as a module via `<script type="module" src="main.js" defer></script>`, its variables and functions do pollute the `window` namespace. To further cement this however I decided on the overkill of additionally having a `Core` class with static methods for application-specific functionality.

#### main.css
The styling in `main.css` is not changed much from my other projects, it's mostly just the boilerplate code I use when setting up a test project. Most of the application-specific styling is left up to the individual modules / components. Whenever a new `.css` file is created it needs to be added into `index.html` manually.

#### tools.js
The script `tools.js` defines `tools` as a utility object that can be imported via `import { tools } from "./tools.js"`. The `tools` object defines many functions under a single namespace. It has been useful to smooth over some of the repetitive tasks that are needlessly verbose in `JavaScript`.

In this project, one of the main uses of `tools.js` was for encryption, to encrypt / decrypt `Core.data` when saving / loading via `localStorage`

An abridged version of the three useful functions from `tools` can be seen below, the general idea is that a `CryptoKey` is derived via `tools.PBKDF2` and used for both encryption and decryption
```javascript
/**
 * Derive cryptographic key using PBKDF2 from a given password and salt
 * @param {string} password - The password to derive the key from
 * @param {string} salt - The salt to use for key derivation
 * @returns {Promise<CryptoKey>} The derived CryptoKey object
 */
async PBKDF2(password, salt) {...}

/**
 * Decrypt Base64 cipherData using AES-GCM, returning original string
 * @param {string} cipherData - Base64-encoded ciphertext and iv as one comma-separated string
 * @param {CryptoKey} cryptoKey - The CryptoKey object used for decryption
 * @returns {Promise<string>} The decrypted string
 */
async decrypt(cipherData, cryptoKey) {...}

/**
 * Encrypt string using AES-GCM, returning a single cipher data string
 * @param {string} string - The string to encrypt
 * @param {CryptoKey} cryptoKey - The CryptoKey object used for encryption
 * @returns {Promise<{string}>} The ciphertext and iv as a comma-separated Base64-encoded string
 */
async encrypt(string, cryptoKey) {...}
```

### Directory Diagram
```
docs/
├── fixed-table/
│   ├── fixed-table.css
│   └── fixed-table.js
├── note/
│   ├── note.css
│   └── note.js
├── sprite/
│   ├── sprite.css
│   ├── sprite.js
│   └── sprite.svg
├── switcher/
│   ├── switcher.css
│   └── switcher.js
├── index.html
├── main.css
├── main.js
└── tools.js
```

# Learnings
- You can use a `<colgroup>` element with `<col>` element children to alter styling for an entire column of an `HTML` table