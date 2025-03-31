// < ========================================================
// < Imports
// < ========================================================

import { tools } from "./tools.js";
import { Sprite } from "./sprite.js";
import { PBKDF2, encryptString, decryptString } from "./encryptor.js";
import { Switcher, Tab } from "./switcher.js"

// < ========================================================
// < Note Class
// < ========================================================

class Note {

    /** @type {Note[]} */
    static instances = [];

    /** @type {string} */
    uuid;

    /** @type {Object<string, { name: string, text: string }>} */
    data;

    /** @type {HTMLTextAreaElement} */
    textarea;

    /** @type {Tab} */
    tab;

    /** 
     * Initialise a Note instance, generating an associated Switcher tab
     * @param {string} uuid - The unique identifier for the Note instance
     * @param {Object<string, { name: string, text: string }>} data - The data object for the Note instance
     */
    constructor(uuid, data) {
        this.uuid = uuid;
        this.data = data;
        this.textarea = this._createTextarea(data);
        this.tab = this._createTab(this.textarea);
    }

    /**
     * Create a textarea element using the given data
     * @param {Object<string, { name: string, text: string }>} data - The data object
     * @returns {HTMLTextAreaElement} The created textarea element
     */
    _createTextarea(data) {
        const textarea = document.createElement('textarea');
        textarea.value = data.text;
        return textarea;
    }

    /**
     * Create a div element as a container for the given textarea
     * @param {HTMLDivElement} textarea - The textarea element
     * @returns {Tab} The created div element
     */
    _createTab(textarea) {
        const element = document.createElement('div');
        element.classList.add('note');
        element.appendChild(textarea);
        let tab = new Tab(this.uuid, element);
        tab.notch.innerText = this.data.name;
        return tab;
    }

    /**
     * Get a Note instance from Note.instances using a given uuid
     * @param {string} noteUUID - The uuid of the note
     * @returns {Note} The Note instance
     */
    static getNote(noteUUID) {
        return Note.instances.find(note => note.uuid === noteUUID);
    }

}

// ! ========================================================
// ! Save Manager
// ! ========================================================

class SaveManager {

    static dataKey = 'notepad-encrypyted-2025-03-31-data';
    static ivKey = 'notepad-encrypyted-2025-03-31-iv';
    static savingNow = false;
    static savingSoon = false;
    static delay = 3000;

    /** 
     * Implement custom asynchronous save function here
     * @returns {Promise<null>}
     */
    static async _save() {
        await tools.delay(500);
        const string = JSON.stringify(Core.data);
        const key = await PBKDF2("password", "salt");
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encryptedString = await encryptString(string, key, iv);
        localStorage.setItem(SaveManager.dataKey, encryptedString);
        localStorage.setItem(SaveManager.ivKey, arrayBufferToBase64(iv));
        console.log(`SaveManager saved all data to localStorage`);
    }

    /** 
     * Implement custom asynchronous load function here
     * @returns {Promise<object>}
     */
    static async _load() {
        const key = await PBKDF2("password", "salt");
        const iv = localStorage.getItem(SaveManager.ivKey);
        let encryptedString = localStorage.getItem(SaveManager.dataKey);
        const decryptedString = await decryptString(encryptedString, key, base64ToArrayBuffer(iv));
        const data = JSON.parse(decryptedString);
        console.log(`SaveManager loaded all data from localStorage`);
        return data;
    }

    /** 
     * Initiate an immediate save if none is in progress
     * @returns {Promise<null>}
     */
    static async saveNow() {
        if (this.savingNow) return;
        this.savingNow = true;
        try {
            await this._save();
            tools.dispatch('saved');
        }
        finally {
            this.savingNow = false;
        }
    }

    /** 
     * Schedule a save after a delay unless one is queued or in progress
     */
    static saveSoon() {
        if (this.savingSoon || this.savingNow) return;
        this.savingSoon = true;
        setTimeout(() => {
            this.savingSoon = false;
            this.saveNow();
        }, this.delay);
    }

}

function arrayBufferToBase64(buffer) {
    var binaryString = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binaryString += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binaryString);
}

function base64ToArrayBuffer(base64) {
    var binaryString = window.atob(base64);
    var bytes = new Uint8Array(binaryString.length);
    for (var i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

// ! ========================================================
// ! Core Class
// ! ========================================================

/**
 * Core class to interface between other project components
 * - Interface between Switcher, Tab, and Note
 * - Manage data synchronisation via localStorage
 */
class Core {

    static data = {
        highlighted: null,
        opened: [],
        notes: {}
    }

    /** @type {HTMLDivElement} sprite */
    static sprite;

    static reset() {
        let data = {
            highlighted: null,
            opened: [],
            notes: {}
        }
        let dataJSON = JSON.stringify(data);
        localStorage.setItem(Core.dataKey, dataJSON);
        console.log(`Core reset all data in localStorage`);
    }

    static highlightNote(note) {
        Core.data.highlighted = note.uuid;
        Switcher.highlightTab(note.tab);
        console.log(`Core highlighted note: ${note.uuid}`);
    }

    static closeNote(note) {
        if (Core.data.highlighted === note.uuid) {
            Core.data.highlighted = null;
        }
        Switcher.closeTab(note.tab);
        tools.remove(Note.instances, note);
        tools.remove(Core.data.opened, note.uuid);
        console.log(`Core closed note: ${note.uuid}`);
    }

    static deleteNote(note) {
        if (confirm('Are you sure?')) {
            Core.closeNote(note);
            delete Core.data.notes[note.uuid];
            console.log(`Core deleted note: ${note.uuid}`);
        }
    }

    /** @returns {Note} */
    static createNote(noteUUID, noteData) {
        let note = new Note(noteUUID, noteData);
        Note.instances.push(note);
        Switcher.addTab(note.tab);
        Core.applyListeners(note);
        Core.data.notes[noteUUID] = note.data;
        if (!Core.data.opened.includes(noteUUID)) {
            Core.data.opened.push(noteUUID);
        }
        console.log(`Core created note: ${note.uuid}`);
        return note;
    }

    /** @returns {Note} */
    static blankNote() {
        let noteUUID = crypto.randomUUID();
        let noteData = {
            name: '',
            text: ''
        }
        return Core.createNote(noteUUID, noteData)
    }

    static async init() {

        // > Load data from localStorage
        Core.data = await SaveManager._load();

        // > Generate notes from data
        let noteUUIDS = [...Core.data.opened];
        for (let noteUUID of noteUUIDS) {
            let noteData = Core.data.notes[noteUUID];
            tools.assert(noteData !== undefined);
            Core.createNote(noteUUID, noteData);
        }

        // > Highlight the previously highlighted note
        if (Core.data.highlighted) {
            let noteUUID = Core.data.highlighted;
            let note = Note.getNote(noteUUID);
            Core.highlightNote(note);
        }

        console.log(`Core initialised`);

    }

    /** 
     * Add listeners to the elements of a given note instance
     * @param {Note} note
     */
    static applyListeners(note) {

        let notch = note.tab.notch;
        let textarea = note.textarea;

        // > Highlight note when notch left clicked
        notch.addEventListener('click', (event) => {
            Core.highlightNote(note);
            SaveManager.saveSoon();
        });

        // > Enable text editing when notch double clicked
        notch.addEventListener('dblclick', (event) => {
            notch.contentEditable = true;
            notch.focus();
            tools.selectAll(notch);
        });

        // > Save note name when notch focus lost
        notch.addEventListener('blur', (event) => {
            if (notch.contentEditable) {
                notch.contentEditable = false;
                note.data.name = notch.innerText;
                SaveManager.saveSoon();
            }
        });

        // > Close note when notch middle clicked
        notch.addEventListener('mousedown', (event) => {
            if (event.button === 1) {
                Core.closeNote(note);
                SaveManager.saveSoon();
            }
        });

        // > Delete note when notch right clicked
        notch.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            Core.deleteNote(note);
            SaveManager.saveSoon();
        });

        // > Save note text when textarea focus lost
        textarea.addEventListener('blur', (event) => {
            note.data.text = textarea.value;
            SaveManager.saveSoon();
        })

    }

    /** Print Core.data object in a readable format */
    static print() {
        console.log(JSON.stringify(Core.data, null, 2));
    }

}

// < ========================================================
// < Utility Functions
// < ========================================================

/** 
 * 
 * @param {Sprite} sprite
 */
const showRotateHide = (sprite) => {
    sprite.swap('load');
    sprite.rotate(3).then(() => {
        sprite.swap('done');
        setTimeout(() => {
            sprite.swap('save');
        }, 2000);
    });
}

async function test() {
    let password = prompt("Password: ");
    let salt = prompt("Salt: ");
    let text = prompt("Text: ");
    let iv = crypto.getRandomValues(new Uint8Array(12));
    let key = await PBKDF2(password, salt);
    let encryptedString = await encryptString(text, key, iv);
    let decryptedString = await decryptString(encryptedString, key, iv);
    alert(`Decrypted: ${decryptedString}`);
}

// < ========================================================
// < Entry Point
// < ========================================================

/**
 * Entry point of the application
 * - Initialises necessary components
 */
async function main() {

    // > Add devtools access to components
    window.Core = Core;
    window.Switcher = Switcher;

    // > Initialise the Switcher
    Switcher.init('page');
    Switcher.toggleBorder(true);
    Switcher.toggleFooter(false);

    // > Optionally reset the Core
    // Core.reset();

    // > Initialise the Core
    await Core.init();

    // ! ========================================================
    // ! Experimental
    // ! ========================================================

    // > Add the menu button
    var element = document.createElement('div');
    element.innerText = '=';
    element.classList.add('notch');
    element.title = 'show menu'
    Switcher.top.insertBefore(element, Switcher.top.firstChild);
    element.addEventListener('click', () => {
        Switcher.toggleHeader();
        // Core.print();
    })

    // > Add the new tab button
    var element = document.createElement('div');
    element.innerText = '+';
    element.classList.add('notch');
    Switcher.top.appendChild(element);
    element.addEventListener('click', () => {
        Core.blankNote();
    })

    // > Add the reset button
    var element = document.createElement('div');
    element.innerText = 'R';
    element.classList.add('notch');
    Switcher.top.appendChild(element);
    element.addEventListener('click', () => {
        Core.reset();
    })

    // > Add the soon button
    var element = document.createElement('div');
    element.innerText = 'Soon';
    element.classList.add('notch');
    Switcher.top.appendChild(element);
    element.addEventListener('click', () => {
        SaveManager.saveSoon();
    })

    // > Add the now button
    var element = document.createElement('div');
    element.innerText = 'Now';
    element.classList.add('notch');
    Switcher.top.appendChild(element);
    element.addEventListener('click', () => {
        SaveManager.saveNow();
    })

    // > Add the load button
    var element = document.createElement('div');
    element.innerText = 'Load';
    element.classList.add('notch');
    Switcher.top.appendChild(element);
    element.addEventListener('click', () => {
        SaveManager._load();
    })

    // > Add the autosave sprite
    let sprite = new Sprite("test", "save");
    sprite.element.addEventListener('click', () => {
        SaveManager.saveNow();
    })
    Switcher.top.appendChild(sprite.element);
    Core.sprite = sprite;

    // > Spin the autosave icon when save occurs
    tools.respond('saved', () => {
        showRotateHide(Core.sprite);
    });

}

// < ========================================================
// < Execution
// < ========================================================

main();