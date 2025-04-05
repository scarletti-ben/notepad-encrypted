// < ========================================================
// < Imports
// < ========================================================

import { tools } from "./tools.js";
import { Sprite } from "./sprite/sprite.js";
import { Switcher, Tab } from "./switcher/switcher.js"
import { FixedTable } from "./fixed-table/fixed-table.js"
import { Note } from "./note/note.js"

// < ========================================================
// < Core Class
// < ========================================================

/**
 * Core class to interface between other project components
 * - Namespace attached to window as window.Core
 * - Interfaces between Switcher, Tab, and Note
 * - Manages encryption of data
 * - Manages data synchronisation via localStorage
 */
class Core {

    static data = {
        highlighted: null,
        opened: [],
        notes: {}
    }

    /** 
     * Initialise the Core with a given CryptoKey object
     * @param {CryptoKey} cryptoKey
     */
    static async init(cryptoKey) {
        this.cryptoKey = cryptoKey;
        this.data = await this.decryptedLoad(this.cryptoKey);
        window.Core = Core;
    }

    /** 
     * Reset the Core
     * @param {CryptoKey} cryptoKey
     */
    static async reset(cryptoKey) {
        console.log('resetting')
        let data = {
            highlighted: null,
            opened: [],
            notes: {}
        }
        Core.data = data;
        await this.encryptedSave(data, cryptoKey)
        // Core.saveNow(data);
        console.log(`Core reset all data in localStorage`);
    }

    // < ========================================================
    // < I: Saving and Loading
    // < ========================================================

    /** @type {CryptoKey} */
    static cryptoKey;
    static storageKey = '2025-04-04-notepad';

    /** 
     * Text
     * - Dispatches `UserEvent` with flavour "saved"
     * @param {object | string} data
     * @param {CryptoKey} cryptoKey
     */
    static async encryptedSave(data, cryptoKey) {

        // > Ensure string format, converting if necessary
        let string = typeof data === 'string' ? data : JSON.stringify(data);

        // > Encrypt
        let cipherData = await tools.encrypt(string, cryptoKey);

        // > Save
        tools.save(cipherData, this.storageKey);

        // > Dispatch `UserEvent`
        tools.dispatch('saved');

    }

    /** 
     * Text
     * - Dispatches `UserEvent` with flavour "loaded"
     * @async
     * @param {CryptoKey} cryptoKey
     */
    static async decryptedLoad(cryptoKey) {

        // > Load
        let cipherData = tools.load(this.storageKey);

        // > Decrypt
        let string = await tools.decrypt(cipherData, cryptoKey);

        // > Try to parse string to object, fallback to string if SyntaxError
        let output;
        try {
            output = JSON.parse(string);
        } catch (error) {
            if (error instanceof SyntaxError) {
                output = string;
            }
            else {
                throw error;
            }
        }

        // > Dispatch `UserEvent`
        tools.dispatch('loaded');

        // > Return the decrypted output
        return output;

    }

    static saveNow() {
        console.log('saving not implemented');
        // this.encryptedSave(this.data, this.cryptoKey);
    }

    static saveSoon() {
        console.log('saving not implemented');
        // this.encryptedSave(this.data, this.cryptoKey);
    }

    static sync() {
        // > Ensure all notes match data
    }

    // < ========================================================
    // < II: Notes Methods
    // < ========================================================

    static generateNotes() {

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

    /** @returns {Note} */
    static createNote(noteUUID, noteData) {
        let note = new Note(noteUUID, noteData);
        Note.instances.push(note);
        Switcher.addTab(note.tab);
        Core.applyNoteListeners(note);
        Core.data.notes[noteUUID] = note.data;
        if (!Core.data.opened.includes(noteUUID)) {
            Core.data.opened.push(noteUUID);
        }
        console.log(`Core created note: ${note.uuid}`);
        return note;
    }

    /** @returns {Note} */
    static createBlankNote() {
        let noteUUID = crypto.randomUUID();
        let noteData = {
            name: '',
            text: ''
        }
        return Core.createNote(noteUUID, noteData)
    }

    /** @param {Note} note */
    static highlightNote(note) {
        Core.data.highlighted = note.uuid;
        Switcher.highlightTab(note.tab);
        console.log(`Core highlighted note: ${note.uuid}`);
    }

    /** @param {Note} note */
    static closeNote(note) {
        if (Core.data.highlighted === note.uuid) {
            Core.data.highlighted = null;
        }
        Switcher.closeTab(note.tab);
        tools.remove(Note.instances, note);
        tools.remove(Core.data.opened, note.uuid);
        console.log(`Core closed note: ${note.uuid}`);
    }

    /** 
     * 
     * @param {Note} note
     * @returns {boolean} Whether or not user confirmed action
     */
    static deleteNote(note) {
        const confirmation = confirm('Are you sure?')
        if (confirmation) {
            Core.closeNote(note);
            delete Core.data.notes[note.uuid];
            console.log(`Core deleted note: ${note.uuid}`);
        }
        return confirmation;
    }

    /** 
     * Add listeners to the elements of a given note instance
     * @param {Note} note
     */
    static applyNoteListeners(note) {

        let notch = note.tab.notch;
        let textarea = note.textarea;

        // > Highlight note when notch left clicked
        notch.addEventListener('click', (event) => {
            Core.highlightNote(note);
            Core.saveSoon(Core.data);
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
                Core.saveSoon(Core.data);
            }
        });

        // > Close note when notch middle clicked
        notch.addEventListener('mousedown', (event) => {
            if (event.button === 1) {
                Core.closeNote(note);
                Core.saveSoon(Core.data);
            }
        });

        // > Delete note when notch right clicked
        notch.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            const deleted = Core.deleteNote(note);
            if (deleted) {
                Core.saveSoon(Core.data);
            }
        });

        // > Save note text when textarea focus lost
        textarea.addEventListener('blur', (event) => {
            note.data.text = textarea.value;
            Core.saveSoon(Core.data);
        })

    }

    // < ========================================================
    // < III: Sprite Methods
    // < ========================================================

    // < ========================================================
    // < VI: Miscellaneous
    // < ========================================================

    /** Print Core.data object in a readable format */
    static print() {
        let message = JSON.stringify(this.data, null, 4);
        console.log(message);
        // alert(message);
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
 * @param {(event: Event)} onclick
 * @returns {Sprite}
 */
function addSprite(name, container, onclick) {
    const sprite = new Sprite(name, name);
    sprite.element.title = name;
    container.appendChild(sprite.element);
    sprite.element.addEventListener('click', (event) => onclick(event));
    return sprite;
}

function addListeners() {

    // > Listeners for keyboard keys
    document.addEventListener('keydown', (event) => {

        // > CTRL + S: Save notes
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            Core.saveNow();
        }

    })

}

function addSprites() {

    addSprite('top_panel_open', Switcher.top, () => {
        Switcher.toggleHeader()
    });
    addSprite('add', Switcher.top, () => {
        Core.createBlankNote()
    });
    addSprite('delete_history', Switcher.header, () => {
        Core.reset()
    });
    addSprite('download', Switcher.header, () => {
        Core.print()
    });
    addSprite('fullscreen', Switcher.header, () => {
        console.log('yee')
    });
    addSprite('no_encryption', Switcher.header, () => {
        console.log('yee')
    });
    addSprite('lock', Switcher.header, () => {
        console.log('yee')
    });
    addSprite('encrypted', Switcher.header, () => {
        console.log('yee')
    });
    addSprite('table', Switcher.header, () => {
        let uuid = 'file-table';
        let tab = Switcher.getTab(uuid);
        if (!tab) {
            tab = addTableTab(uuid);
            tab.notch.addEventListener('mousedown', (event) => {
                if (event.button === 1) {
                    Switcher.removeTab(tab);
                }
            });
        }
        else {
            Switcher.removeTab(tab);
        }
    });
    addSprite('file_upload', Switcher.header, () => {
        console.log('yee')
    });

    addSprite('save', Switcher.header, () => {
        Core.encryptedSave(Core.data, Core.cryptoKey);
    }).also((sprite) => {
        tools.respond('saved', () => {
            showRotateHide(sprite);
        })
    })

}

function addTableTab(tabUUID) {

    let headers = ['UUID', 'Name', 'Text', 'Actions'];
    let table = new FixedTable(headers);
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

    return tab;

}

function quickReset() {
    tools.save('C+HpI+GiNgQjJB2H2WPI4onmxYIxqyhyaf39HUaph5F6tTBlMkSYmHMRWZ5nOPwSHs+wmpg2Y7ya6fBRATo70TIv8XIIrAwc+mJbBPFUXYPcnwa2V1uLEEIPXbFTHS8WUEMDx/BerIR0LdujI9auIH5tzxWKuAFqlMbaJ321NCvGr2wRFbx1aHe17kwJPw//H/Yb49dZVOry5gllDMCV5PVxeFgmWSbdQp6JejaUcDWilKzHiunPSF3nLIzczH7UokETJjDzU+pa5vQdFdPzj9I4LpJlg9qQMIwsuJMlWoy0LeyQgS1zq6r1OXSaZ13UY0SxylXBho1OCS5lygV8uq9+ZCqntxMhD2pC+LKuB9sB,m8q9+XHDGBiTU4vP', '2025-04-04-notepad');
    console.warn('Reset, waiting to reload');
    setTimeout(() => {
        window.location.reload();
    }, 500);
}
window.quickReset = quickReset;
console.warn('Added window.quickReset')

// < ========================================================
// < Entry Point
// < ========================================================

/**
 * Entry point of the application
 * - Initialises necessary components
 */
async function main() {

    // < ========================================================
    // < Initialise the Switcher
    // < ========================================================

    Switcher.init('page', true, false, true);

    // < ========================================================
    // < Initialise the Core
    // < ========================================================

    try {
        // POSTIT - Aim is to ask for user input on load
        let cryptoKey = await tools.PBKDF2('password', 'salt');
        await Core.init(cryptoKey);
        Core.generateNotes();
    } catch (error) {
        console.error(error)
        return;
    }

    // < ========================================================
    // < Initialise the Listeners
    // < ========================================================

    addListeners();

    // < ========================================================
    // < Add Sprites
    // < ========================================================

    addSprites();

    // < ========================================================
    // < Notes
    // < ========================================================

    // - DOES NOT SAVE CURRENT NOTE, ONLY BLUR CAN ACCESS NOTE.innerText
    //      - Applies to all Core.saveNow calls
    // - Animation reacts to saved but sent often via savenow, perhaps animation cancel?

}

// < ========================================================
// < Execution
// < ========================================================

main();