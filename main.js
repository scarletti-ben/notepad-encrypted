// < ========================================================
// < Imports
// < ========================================================

import { tools } from "./tools.js";
import { Sprite } from "./sprite.js";
import { PBKDF2, encryptString, decryptString } from "./encryptor.js";
import { Switcher, Tab } from "./switcher.js"
import { SaveManager } from "./save-manager.js"
import { FixedTable } from "./fixed-table.js"

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
        SaveManager.saveNow(data);
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
        let message = JSON.stringify(Core.data, null, 2);
        console.log(message);
        alert(message);
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
    sprite.swap('progress_activity');
    sprite.rotate(2, 1000).then(() => {
        sprite.swap('check_circle');
        setTimeout(() => {
            sprite.swap('save');
        }, 1000);
    });
}

/** 
 * 
 * @param {string} name
 * @param {HTMLElement} container
 * @param {Function} onclick
 * @returns {Sprite}
 */
function addSprite(name, container, onclick) {
    const sprite = new Sprite(name, name);
    sprite.element.title = name;
    container.appendChild(sprite.element);
    sprite.element.addEventListener('click', (event) => onclick(event));
    return sprite;
}

// < ========================================================
// < Entry Point
// < ========================================================

/**
 * Entry point of the application
 * - Initialises necessary components
 */
async function main() {

    // > Initialise the Switcher
    Switcher.init('page');
    Switcher.toggleBorder(true);
    Switcher.toggleFooter(false);

    // > Add Sprites
    let x = addSprite('top_panel_open', Switcher.top, () => Switcher.toggleHeader());
    Switcher.top.prepend(x.element)
    addSprite('add', Switcher.top, () => Core.blankNote());
    addSprite('delete_history', Switcher.header, () => Core.reset());
    addSprite('download', Switcher.header, () => Core.print());

    addSprite('fullscreen', Switcher.header, () => console.log('yee'));
    addSprite('no_encryption', Switcher.header, () => console.log('yee'));
    addSprite('lock', Switcher.header, () => console.log('yee'));
    addSprite('encrypted', Switcher.header, () => console.log('yee'));
    addSprite('table', Switcher.header, () => console.log('yee'));
    addSprite('file_upload', Switcher.header, () => console.log('yee'));
    
    // > Add the autosave sprite
    var sprite = addSprite('save', Switcher.header, () => SaveManager.saveNow(Core.data));
    // POSTIT - DOES NOT SAVE CURRENT NOTE, ONLY BLUR CAN ACCESS NOTE.innerText
    tools.respond('saved', () => {
        showRotateHide(sprite);
        // > Reacts to saved but saved can be sent often with savenow, perhaps animation cancel?
    });

    // > Initialise the save manager
    await SaveManager.init();

    // > Load data from localStorage
    Core.data = await SaveManager._load();

    // > Initialise the Core
    await Core.init();

    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            SaveManager.saveNow(Core.data);
            // POSTIT - DOES NOT SAVE CURRENT NOTE, ONLY BLUR CAN ACCESS NOTE.innerText
        }
    })

    // > Add FixedTable
    let headers = ['UUID', 'Name', 'Text', 'Actions'];
    let table = new FixedTable(headers);
    let tabUUID = 'filesystem';
    let tab = new Tab(tabUUID, table.element);
    tab.notch.innerText = 'Files';
    tab.notch.addEventListener('click', (event) => {
        Switcher.highlightTab(tab);
        Core.data.highlighted = null;
    });
    Switcher.addTab(tab);
    Switcher.highlightTab(tab);

    for (let [uuid, data] of Object.entries(Core.data.notes)) {

        /** @type {HTMLDivElement[]} */
        let elements = [];

        let uuidElement = document.createElement('div');
        uuidElement.innerText = uuid;
        elements.push(uuidElement);

        let nameElement = document.createElement('div');
        nameElement.innerText = data.name;
        elements.push(nameElement);

        let textElement = document.createElement('div');
        textElement.innerText = data.text;
        elements.push(textElement);
    
        let actionElement = document.createElement('div');
        let styling = {
            display: 'flex',
            padding: '8px',
            justifyContent: 'space-evenly'
        }
        if (!Core.data.opened.includes(uuid)) {
            uuidElement.style.color = 'rgb(200, 48,48)';
        }
        tools.style(actionElement, styling);
        addSprite('edit_note', actionElement, () => {
            if (!Core.data.opened.includes(uuid)) {
                let noteData = Core.data.notes[uuid];
                tools.assert(noteData !== undefined);
                Core.createNote(uuid, noteData);
            }
            else {
                console.log('This note is already open')
            }
        });
        addSprite('download', actionElement, () => {
            let data = Core.data.notes[uuid];
            data['uuid'] = uuid;
            tools.downloadObject(data, 4);

        });
        addSprite('content_copy', actionElement, () => {
            navigator.clipboard.writeText(Core.data.notes[uuid].text).catch(console.error);
            tools.flash(actionElement);
        });
        addSprite('delete', actionElement, () => {
            let confirmation = confirm('Are you sure?');
            if (confirmation) {
                console.log('yee')
            }
        });
        elements.push(actionElement);

        table.addRowFromElements(elements);

    }

    // table.toggleColumnCollapsed(0);
    // table.setColumnWidth(0, '30%');
    // table.setColumnWidth(1, '15%');
    // table.setColumnWidth(2, '5%');

}

// < ========================================================
// < Execution
// < ========================================================

main();