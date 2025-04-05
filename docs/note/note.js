// < ========================================================
// < Imports
// < ========================================================

import { Switcher, Tab } from "../switcher/switcher.js"

// < ========================================================
// < Exported Note Class
// < ========================================================

export class Note {

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
     * Create container for the given textarea and generate Tab instance
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