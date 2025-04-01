// < ========================================================
// < Imports
// < ========================================================

import { tools } from "./tools.js";
import { Sprite } from "./sprite.js";
import { PBKDF2, encryptString, decryptString } from "./encryptor.js";
import { Switcher, Tab } from "./switcher.js"
import { SaveManager } from "./save-manager.js"

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
            SaveManager.saveSoon(Core.data);
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
                SaveManager.saveSoon(Core.data);
            }
        });

        // > Close note when notch middle clicked
        notch.addEventListener('mousedown', (event) => {
            if (event.button === 1) {
                Core.closeNote(note);
                SaveManager.saveSoon(Core.data);
            }
        });

        // > Delete note when notch right clicked
        notch.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            Core.deleteNote(note);
            SaveManager.saveSoon(Core.data);
        });

        // > Save note text when textarea focus lost
        textarea.addEventListener('blur', (event) => {
            note.data.text = textarea.value;
            SaveManager.saveSoon(Core.data);
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

    // > Initialise the save manager
    await SaveManager.init();
    // SaveManager.saveNow(Core.data);

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
        SaveManager.saveSoon(Core.data);
    })

    // > Add the now button
    var element = document.createElement('div');
    element.innerText = 'Now';
    element.classList.add('notch');
    Switcher.top.appendChild(element);
    element.addEventListener('click', () => {
        SaveManager.saveNow(Core.data);
    })

    // > Add the load button
    var element = document.createElement('div');
    element.innerText = 'Load';
    element.classList.add('notch');
    Switcher.top.appendChild(element);
    element.addEventListener('click', async () => {
        Core.data = await SaveManager._load();
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