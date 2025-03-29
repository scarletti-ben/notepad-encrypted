// < ========================================================
// < Imports
// < ========================================================

import { tools } from "./tools.js";

// < ========================================================
// < Exported Tab Class
// < ========================================================

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
     * @param {string} uuid - The unique identifier for this tab
     * @param {HTMLDivElement} element - The element to go in the pane
     */
    constructor(uuid, element) {
        this.uuid = uuid;
        this._element = element;
        this.pane = this._createPane();
        this.notch = this._createNotch();
    }

    /** @returns {HTMLDivElement} */
    _createPane() {
        let pane = document.createElement('div');
        pane.classList.add('pane', 'hidden');
        pane.dataset.uuid = this.uuid;
        pane.appendChild(this._element);
        return pane;
    }

    /** @returns {HTMLDivElement} */
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

export class Switcher {

    /** @type {Tab[]} */
    static tabs = [];

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
     * Generate Switcher HTML structure inside a given container element
     * @param {string} containerID - The ID of the container element
     */
    static init(containerID) {
        let switcherID = this.inject(containerID);
        this.element = document.getElementById(switcherID);
        this.top = this.element.querySelector('.top-section');
        this.ribbon = this.element.querySelector('.ribbon');
        this.bottom = this.element.querySelector('.bottom-section');
        this.viewport = this.element.querySelector('.viewport');
        this.header = this.element.querySelector('.header');
        this.frame = this.element.querySelector('.frame');
        this.footer = this.element.querySelector('.footer');
    }

    /** @param {string} uuid @returns {Tab} */
    static getTab(uuid) {
        return this.tabs.find(tab => tab.uuid === uuid);
    }

    /** @param {Tab} tab */
    static highlightTab(tab) {
        for (let instance of this.tabs) {
            tools.toggleHidden(instance.pane, instance !== tab);
            tools.toggleHighlighted(instance.notch, instance === tab);
        }
    }

    /** @param {Tab} tab */
    static closeTab(tab) {
        this.frame.removeChild(tab.pane);
        this.ribbon.removeChild(tab.notch);
        tools.remove(this.tabs, tab);
        console.log(`Switcher closed tab: ${tab.uuid}`);
    }

    /** @param {Tab} tab */
    static addTab(tab) {
        this.ribbon.appendChild(tab.notch);
        this.frame.appendChild(tab.pane);
        this.tabs.push(tab);
    }

    /**
     * Generate Switcher HTML structure inside a given container element
     * @param {string} containerID - The ID of the container element
     * @returns {string} - The id of the new Switcher element
     */
    static inject(containerID) {
        let switcherID = 'switcher'
        let container = document.getElementById(containerID);
        const switcherHTML = `
        <div id="${switcherID}" class="switcher">
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
        console.log(`TabSwitcher created switcher element with ID: ${switcherID}`)
        return switcherID;
    }

    // < ========================================================
    // < 
    // < ========================================================

    static toggleHeader(force) {
        tools.toggleHidden(this.header, force);
    }

    static toggleFooter(force) {
        tools.toggleHidden(this.footer, force);
    }

    static toggleBorder(force) {
        tools.toggleBordered(this.viewport, force);
    }

}