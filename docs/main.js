// < ========================================================
// < Imports
// < ========================================================

import { tools } from "./tools.js";
import { Sprite } from "./sprite/sprite.js";
import { Switcher, Tab } from "./switcher/switcher.js"
import { Note } from "./note/note.js"
import { FixedTable } from "./fixed-table/fixed-table.js"

// ~ ========================================================
// ~ Core Class (Work in Progress)
// ~ ========================================================

/**
 * Core class to interface between other application modules
 * - Interfaces between Switcher, Tab, Note and more
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
    static async init(cryptoKey, reset = false) {
        this.cryptoKey = cryptoKey;
        if (reset) {
            await this._reset();
        }
        this.data = await this.decryptedLoad(this.cryptoKey);
        window.Core = Core;
    }

    /** 
     * Reset the Core
     */
    static async _reset() {
        console.log('resetting')
        let data = {
            highlighted: null,
            opened: [],
            notes: {}
        }
        Core.data = data;
        await Core.saveNow();
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

    // ! TODO: Document saving functionality

    static savingNow = false;
    static savingDelay = 5000;
    static savingTimeout = null;

    static saveSoon() {
        if (this.savingTimeout || this.savingNow) {
            return console.info('Save not queued');
        } else {
            console.info('Save queued');
        }
        this.savingTimeout = setTimeout(() => {
            this.savingTimeout = null;
            this.saveNow();
        }, this.savingDelay);
    }

    static async saveNow() {
        if (this.savingNow) {
            return console.info('Save not started')
        } else {
            console.info('Save started');
        }
        this.savingNow = true;
        if (this.savingTimeout) {
            window.clearTimeout(this.savingTimeout);
            this.savingTimeout = null;
        }
        await this.encryptedSave(this.data, this.cryptoKey);
        setTimeout(() => {
            this.savingNow = false;
        }, this.savingDelay);
    }

    // < ========================================================
    // < II: Notes Methods
    // < ========================================================

    static initNotes() {

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

    /** 
     * Remove a specific note tab's notch and tab pane from the DOM
     * - Data for the note remains in Core.data.notes
     * @param {Note} note - The note instance to close
     */
    static closeNote(note) {
        Switcher.closeTab(note.tab, true);
        if (Core.data.highlighted === note.uuid) {
            Core.data.highlighted = null;
        }
        tools.remove(Note.instances, note);
        tools.remove(Core.data.opened, note.uuid);
        console.log(`Core closed note: ${note.uuid}`);
    }

    /** 
     * Remove a specific note tab's notch and tab pane from the DOM
     * - Data for the note is also removed from Core.data.notes
     * @param {Note} note - The note instance to remove
     * @param {boolean} force - Option to force and avoid confirmation
     * @returns {boolean} Confirmation value
     */
    static removeNote(note, force = false) {
        const confirmation = Switcher.closeTab(note.tab, force);
        if (confirmation) {
            if (Core.data.highlighted === note.uuid) {
                Core.data.highlighted = null;
            }
            tools.remove(Note.instances, note);
            tools.remove(Core.data.opened, note.uuid);
            delete Core.data.notes[note.uuid];
            console.log(`Core deleted note: ${note.uuid}`);
        }
        return confirmation
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
            Core.saveSoon();
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
                Core.saveSoon();
            }
        });

        // > Close note when notch middle clicked
        notch.addEventListener('mousedown', (event) => {
            if (event.button === 1) {
                Core.closeNote(note);
                Core.saveSoon();
            }
        });

        // > Delete note when notch right clicked
        notch.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            const removed = Core.removeNote(note);
            if (removed) {
                Core.saveSoon();
            }
        });

        // > Save note text when textarea focus lost
        textarea.addEventListener('blur', (event) => {
            Core.saveSoon();
        })

    }

    // < ========================================================
    // < III: Sprite Methods
    // < ========================================================

    /** 
     * 
     * @param {string} name
     * @param {HTMLElement} container
     * @param {(event: Event)} onclick
     * @returns {Sprite}
     */
    static addSprite(name, container, onclick) {
        const sprite = new Sprite(name, name);
        sprite.element.title = name;
        container.appendChild(sprite.element);
        sprite.element.addEventListener('click', (event) => onclick(event));
        return sprite;
    }

    static initSprites() {

        // < ========================================================
        // < Implemented Sprites
        // < ========================================================

        Core.addSprite('add', Switcher.top, () => {
            let note = Core.createBlankNote();
            note.tab.notch.innerText = 'Note';
            Core.highlightNote(note);
            note.tab.notch.contentEditable = true;
            note.tab.notch.focus();
            tools.selectAll(note.tab.notch);
        });
        Core.addSprite('delete_history', Switcher.header, () => {
            Core._reset();
        });

        let first = Core.addSprite('top_panel_open', Switcher.top, () => {
            Switcher.toggleHeader();
        })
        Switcher.top.prepend(first.element);

        Core.addSprite('table', Switcher.header, () => {
            let uuid = 'file-table';
            let tab = Switcher.getTab(uuid);
            if (!tab) {
                tab = addTableTab(uuid);
                tab.notch.addEventListener('mousedown', (event) => {
                    if (event.button === 1) {
                        Switcher.closeTab(tab, true);
                    }
                });
            }
            else {
                Switcher.closeTab(tab, true);
            }
        });

        Core.addSprite('save', Switcher.header, () => {
            Core.saveNow();
        }).also((sprite) => {

            tools.respond('saved', () => {

                sprite.swap('progress_activity');

                sprite.rotate(2000).then(() => {
                    sprite.swap('check_circle');
                    setTimeout(() => {
                        sprite.swap('save');
                    }, 1000);
                });

            })

        })

        Core.addSprite().element.onclick = function() {
            console.log(this);
        }

        let progressSprite = Core.addSprite('progress_activity', Switcher.top)
        progressSprite.toggleHidden(true);
        tools.respond('saved', () => {
            progressSprite.toggleHidden(false);
        })

        Core.addSprite('fullscreen', Switcher.header, () => {
            function toggleFullscreen() {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    document.documentElement.requestFullscreen();
                }
            }
            toggleFullscreen();
        });

        // < ========================================================
        // < Sprites without Implementation
        // < ========================================================

        Core.addSprite('download', Switcher.header, () => {
            alert('Not implemented');
        });
        Core.addSprite('no_encryption', Switcher.header, () => {
            alert('Not implemented');
        });
        Core.addSprite('lock', Switcher.header, () => {
            alert('Not implemented');
        });
        Core.addSprite('encrypted', Switcher.header, () => {
            alert('Not implemented');
        });
        Core.addSprite('file_upload', Switcher.header, () => {
            alert('Not implemented');
        });

    }

    // < ========================================================
    // < VI: Miscellaneous
    // < ========================================================

    /** Print Core.data object in a readable format */
    static print() {
        let message = JSON.stringify(this.data, null, 4);
        console.log(message);
        // alert(message);
    }

    static initWindowTools() {

        // > Add quick reset functionality to window
        window.quickReset = () => {
            tools.save('2r5Ra3rS+c/6O+YnXmCSoodHWlpfmlukrmb3eIK29pO3Rj1q6iLB99Fqz646BNvnAfT7Shfq+7iZcwVeOYR4aLDr5EXZ6g0ySBH5vSSlLbDe62JT5bVNaLao6iQuTEGFd4lIPLwa14nRbTFEQvbTNsTyGCvrbxPD9gbRwRKRmzFAWSH/YHLovc2EC53qiHMmGh8MuDJAKJxsgXey81Nchly/6JMpqUGWzS64+BRsUkG8kaM6pEV1XNsbolgop3XUP/DR6CSDJoDgoQBn598ViYveiuMZDXJwJGeqkOxL6JYiZ7QCQ2Z9xNay+fug3kCPveCgnVVwnwo0swtvRONIX0LF5yFX0CnbPXFxvQ==,tMV0b0YHjU0u+Iyy', '2025-04-04-notepad');
            console.warn('Reset, waiting to reload');
            setTimeout(() => {
                window.location.reload();
            }, 500);
        }
        console.warn('Added window.quickReset');

        // > Add tools object to window
        window.tools = tools;
        console.warn('Added window.tools');

    }

    static initListeners() {

        // > Listeners for keyboard keys
        document.addEventListener('keydown', (event) => {

            // > CTRL + S: Save notes
            if (event.ctrlKey && event.key === 's') {
                event.preventDefault();
                Core.saveNow();
            }

        })

    }

}

// ! ========================================================
// ! Experimental Utility Functions
// ! ========================================================

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
        Core.addSprite('edit_note', actionElement, () => {
            if (!Core.data.opened.includes(uuid)) {
                let noteData = Core.data.notes[uuid];
                tools.assert(noteData !== undefined);
                Core.createNote(uuid, noteData);
            }
            else {
                console.log('This note is already open')
            }
        });
        Core.addSprite('download', actionElement, () => {
            let data = Core.data.notes[uuid];
            data['uuid'] = uuid;
            tools.downloadObject(data, 4);

        });
        Core.addSprite('content_copy', actionElement, () => {
            navigator.clipboard.writeText(Core.data.notes[uuid].text).catch(console.error);
            tools.flash(actionElement);
        });
        Core.addSprite('delete', actionElement, () => {
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

// < ========================================================
// < Entry Point
// < ========================================================

/**
 * Entry point for the application
 * - Initialises application components
 */
async function main() {

    try {

        Core.initWindowTools();

        Switcher.init('page', true, false, true);

        // let password = prompt('Password: ')
        // let salt = prompt('Salt: ')
        let password = 'password'
        let salt = 'salt'
        let key = await tools.PBKDF2(password, salt);
        
        await Core.init(key);
        
        Core.initNotes();
        Core.initSprites();
        Core.initListeners();

    } catch (error) {

        console.warn(error);
        return;

    }

    // ! TODO: Move saving wheel to Switcher.top

}

// < ========================================================
// < Execution
// < ========================================================

main();