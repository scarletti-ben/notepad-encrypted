// < ========================================================
// < Imports
// < ========================================================

import { tools } from "../tools.js";

// < ========================================================
// < Exported Tab Class
// < ========================================================

/**
 * Construct wrapper for linked HTML elements for use with `Switcher`
 * - Uses `.notch` and `.pane` styling from `switcher.css`
 * @see Switcher
 */
export class Tab {

    /** @type {string} */
    uuid;

    /** @type {HTMLDivElement} */
    _element;

    /** @type {HTMLDivElement} */
    notch;

    /** @type {HTMLDivElement} */
    pane;

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

    /** 
     * Create the pane element for the tab instance and return
     * @returns {HTMLDivElement} The created pane element
     */
    _createPane() {
        let pane = document.createElement('div');
        pane.classList.add('pane', 'hidden');
        pane.dataset.uuid = this.uuid;
        pane.appendChild(this._element);
        return pane;
    }

    /** 
     * Create the notch element for the tab instance and return
     * @returns {HTMLDivElement} The created notch element
     */
    _createNotch() {
        let notch = document.createElement('div');
        notch.dataset.uuid = this.uuid;
        notch.classList.add('notch');
        return notch;
    }

}

// < ========================================================
// < Exported Switcher Class
// < ========================================================

/**
 * Class as wrapper for linked HTML elements for use with `Tab`
 * - Elements from instances of `Tab` populate `Switcher` elements
 * - Initialise via `Switcher.init()`
 * - Uses multiple styling rules from `switcher.css`
 * @see Tab
 */
export class Switcher {

    /** @type {Tab[]} */
    static tabs = [];

    /** @type {string} */
    static id = 'switcher';

    /** @type {string} */
    static className = 'switcher';

    /** @type {HTMLDivElement} */
    static element;

    /** @type {HTMLDivElement} */
    static top;

    /** @type {HTMLDivElement} */
    static ribbon;

    /** @type {HTMLDivElement} */
    static bottom;

    /** @type {HTMLDivElement} */
    static viewport;

    /** @type {HTMLDivElement} */
    static header;

    /** @type {HTMLDivElement} */
    static frame;

    /** @type {HTMLDivElement} */
    static footer;

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

    /** 
     * Get tab instance from a given uuid
     * @param {string} tabUUID - The uuid of the tab instance
     * @returns {Tab | undefined} The tab instance
     */
    static getTab(tabUUID) {
        return this.tabs.find(tab => tab.uuid === tabUUID);
    }

    /** 
     * Highlight a specific tab notch, show tab pane, hide all other tab panes
     * @param {Tab} tab - The tab instance to highlight
     */
    static highlightTab(tab) {
        for (let instance of this.tabs) {
            tools.toggleHidden(instance.pane, instance !== tab);
            tools.toggleHighlighted(instance.notch, instance === tab);
        }
    }

    /** 
     * Close a specific tab, the tab's notch and pane remain in the DOM
     * @param {Tab} tab - The tab instance to close
     */
    static closeTab(tab) {
        this.frame.removeChild(tab.pane);
        this.ribbon.removeChild(tab.notch);
        tools.remove(this.tabs, tab);
        console.log(`Switcher closed tab: ${tab.uuid}`);
    }

    /** 
     * Remove a specific tab's notch and pane from the DOM
     * @param {Tab} tab - The tab instance to remove
     * @param {boolean} force - Option to force and avoid confirmation
     * @returns {boolean} Confirmation value
     */
    static removeTab(tab, force = false) {
        const confirmation = force || confirm('Are you sure?');
        if (confirmation) {
            tab.pane.remove();
            tab.notch.remove();
            tools.remove(this.tabs, tab);
            console.log(`Switcher deleted tab: ${tab.uuid}`);
        }
        return confirmation
    }

    /** 
     * Add a tab instance to Switcher
     * @param {Tab} tab - The tab instance to add
     */
    static addTab(tab) {
        this.ribbon.appendChild(tab.notch);
        this.frame.appendChild(tab.pane);
        this.tabs.push(tab);
    }

    /** 
     * Toggle or set visibility of Switcher header
     * @param {boolean} [shown] - Toggles when undefined
     */
    static toggleHeader(shown) {
        tools.toggleShown(this.header, shown);
    }

    /** 
     * Toggle or set visibility of Switcher footer
     * @param {boolean} [shown] - Toggles when undefined
     */
    static toggleFooter(shown) {
        tools.toggleShown(this.footer, shown);
    }

    /** 
     * Toggle or set the border of `Switcher` viewport
     * @param {boolean} [bordered] - Toggles when undefined
     */
    static toggleBorder(bordered) {
        tools.toggleBordered(this.viewport, bordered);
    }

    /**
     * Generate `Switcher` HTML structure inside a existing container element
     * @param {string} containerID - The ID of the existing container element
     * @returns {string} The id of the new `Switcher` element
     */
    static inject(containerID) {
        let container = document.getElementById(containerID);
        const switcherHTML = `
        <div id="${this.id}" class="${this.className}">
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
        container.insertAdjacentHTML('beforeend', switcherHTML);
        console.log(`Switcher created ${this.className} element with ID: ${this.id}`);
        return this.id;
    }

}