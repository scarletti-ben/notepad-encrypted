// < ========================================================
// < Imports
// < ========================================================

import { tools } from "./tools.js";
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

    /** @param {Object<string, { name: string, text: string }>} data */
    _createTextarea(data) {
        const textarea = document.createElement('textarea');
        textarea.value = data.text;
        return textarea;
    }

    /** @param {HTMLTextAreaElement} textarea */
    _createTab(textarea) {
        const element = document.createElement('div');
        element.classList.add('note');
        element.appendChild(textarea);
        let tab = new Tab(this.uuid, element);
        tab.notch.innerText = this.data.name;
        return tab;
    }

    /** @param {string} uuid @returns {Note} */
    static getNote(uuid) {
        return Note.instances.find(note => note.uuid === uuid);
    }

}

// < ========================================================
// < Core Class
// < ========================================================

/**
 * Core class to interface between other project components
 * - Interface between Switcher, Tab, and Note
 * - Manage data synchronisation via localStorage
 */
class Core {

    static dataKey = 'notepad-encrypyted-2025-03-29';
    static data = {
        highlighted: null,
        opened: [],
        notes: {}
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

    static load() {
        const dataJSON = localStorage.getItem(Core.dataKey);
        const data = JSON.parse(dataJSON);
        Core.data = data;
        console.log(`Core loaded all data from localStorage`);
    }

    static save = tools.debounced(() => {
        let dataJSON = JSON.stringify(Core.data);
        localStorage.setItem(Core.dataKey, dataJSON);
        console.log(`Core saved all data to localStorage`);
    }, 3000)

    static init(resetting = false) {
        if (resetting) {
            Core.save()
        } else {
            Core.load();
        }
        let noteUUIDS = [...Core.data.opened];
        for (let noteUUID of noteUUIDS) {
            let noteData = Core.data.notes[noteUUID];
            tools.assert(noteData !== undefined);
            Core.createNote(noteUUID, noteData);
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
            Core.save();
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
                Core.save();
            }
        });

        // > Close note when notch middle clicked
        notch.addEventListener('mousedown', (event) => {
            if (event.button === 1) {
                Core.closeNote(note);
                Core.save();
            }
        });

        // > Delete note when notch right clicked
        notch.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            Core.deleteNote(note);
            Core.save();
        });

        // > Save note text when textarea focus lost
        textarea.addEventListener('blur', (event) => {
            note.data.text = textarea.value;
            Core.save();
        })

    }

    // ! ========================================================
    // ! Experimental Methods
    // ! ========================================================

    /** @param {Note} note */
    static flashNote(note, ms = 200) {
        note.tab.notch.style.transition = 'opacity 0.2s';
        note.tab.notch.style.opacity = '0.5';
        setTimeout(() => note.tab.notch.style.opacity = '1', ms);
    }

    /** Print Core.data object in a readable format */
    static print() {
        console.log(JSON.stringify(Core.data, null, 2));
    }

}

// < ========================================================
// < Entry Point
// < ========================================================

function main() {

    // > Add console access for Swicher
    window.Switcher = Switcher;

    // > Initialise Switcher
    Switcher.init('page');
    Switcher.toggleBorder(true);
    Switcher.toggleFooter(false);

    // > Init
    Core.init(true);

    if (Core.data.highlighted) {
        let noteUUID = Core.data.highlighted;
        let note = Note.getNote(noteUUID);
        Core.highlightNote(note);
    }

    // ! ========================================================
    // ! 
    // ! ========================================================

    let element = document.createElement('div');
    element.innerText = '+';
    element.classList.add('notch');
    Switcher.top.appendChild(element);
    element.addEventListener('click', () => {
        Core.blankNote();
        Core.print();
    })

}

// < ========================================================
// < Execution
// < ========================================================

main();