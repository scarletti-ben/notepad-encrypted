// < ========================================================
// < Imports
// < ========================================================

import { Tab } from "../switcher/switcher.js"

// < ========================================================
// < Exported Note Class
// < ========================================================

/**
 * Construct wrapper instance for a `Tab` with a textarea
 * - Uses `.note` styling from `note.css`
 */
export class Note {

    /** @type {Note[]} */
    static instances = [];

    /** @type {string} */
    className = 'note';

    /** @type {string} */
    uuid;

    /** @type {{ name: string, text: string }>} */
    data;

    /** @type {HTMLTextAreaElement} */
    textarea;

    /** @type {Tab} */
    tab;

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
    }

    /**
     * Create a `textarea` element using the given data
     * @param {{ name: string, text: string }} data - The data object
     * @returns {HTMLTextAreaElement} The created `textarea` element
     */
    _createTextarea(data) {
        const textarea = document.createElement('textarea');
        textarea.value = data.text;
        return textarea;
    }

    /**
     * Create container for the `textarea` and generate `Tab` instance
     * @param {HTMLDivElement} textarea - The `textarea` element
     * @returns {Tab} The created `Tab` instance
     */
    _createTab(textarea) {
        const element = document.createElement('div');
        element.classList.add(this.className);
        element.appendChild(textarea);
        let tab = new Tab(this.uuid, element);
        tab.notch.innerText = this.data.name;
        return tab;
    }

    /**
     * Get a note instance from `Note.instances` using a given uuid
     * @param {string} noteUUID - The unique identifier for the note instance
     * @returns {Note} The note instance
     */
    static getNote(noteUUID) {
        return Note.instances.find(note => note.uuid === noteUUID);
    }

}