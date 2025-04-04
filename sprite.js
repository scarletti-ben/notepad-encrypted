// < ========================================================
// < Imports
// < ========================================================

import { tools } from "./tools.js";

// < ========================================================
// < Exported Sprite Class
// < ========================================================

export class Sprite {

    /** @type {HTMLElement} */
    element;

    constructor(elementID, spriteName) {
        this.element = document.createElement("div");
        this.element.id = elementID;
        this.element.className = "sprite";
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        this.svg.appendChild(this.use);
        this.element.appendChild(this.svg);
        this.swap(spriteName);
    }

    swap(spriteName) {
        this.spriteName = spriteName;
        let cacheBust = new Date().getTime();
        let value = `sprite.svg?${cacheBust}#${this.spriteName}`;
        this.use.setAttribute('href', value);
        tools.reflow(this.element);
    }

    /** 
     * Rotate this sprite's element n times, each for a given duration
     * - Returns a Promise that resolves after 'animationend' event
     * - Allows .then chaining
     * - Uses 'animationend' event to avoid timing issues with setTimeout
     * @param {number} [n=1] - The number of rotations to make
     * @param {number} [duration=1000] - The duration in milliseconds
     * @returns {Promise} Promise that resolves after 'animationend' event
     */
    rotate(n = 1, duration = 1000) {
        return _rotate(this.element, n, duration);
    }

    show() {
        tools.toggleHidden(this.element, false);
    }

    hide() {
        tools.toggleHidden(this.element, true);
    }

}

// < ========================================================
// < Internal Functions
// < ========================================================

/** 
 * Rotate an element n times, each for a given duration
 * - Returns a Promise that resolves after 'animationend' event
 * - Allows .then chaining
 * - Uses 'animationend' event to avoid timing issues with setTimeout
 * @param {HTMLElement} element - The element to apply the rotation animation to
 * @param {number} [n=1] - The number of rotations to make
 * @param {number} [duration=1000] - The duration in milliseconds
 * @returns {Promise} Promise that resolves after 'animationend' event
 */
function _rotate(element, n = 1, duration = 1000) {

    // > Start animation, and reflow element
    element.style.animation = `rotate ${duration}ms linear ${n}`;
    tools.reflow(element);

    // > Return Promise that resolves after 'animationend' event
    return new Promise((resolve, reject) => {

        function handleAnimationEnd() {

            // > Remove the event listeners
            element.removeEventListener('animationend', handleAnimationEnd);
            element.removeEventListener('animationcancel', handleAnimationCancel);

            // > Disable animation, and reflow element
            element.style.animation = '';
            tools.reflow(element);

            // > Resolve the Promise
            resolve();

        }

        function handleAnimationCancel() {

            // > Remove the event listeners
            element.removeEventListener('animationcancel', handleAnimationCancel);
            element.removeEventListener('animationend', handleAnimationEnd);

            // > Reject the Promise
            reject();

        }

        // > Add the event listeners
        element.addEventListener('animationend', handleAnimationEnd);
        element.addEventListener('animationcancel', handleAnimationCancel);

    });

}

/** 
 * Animate an element using the given arguments
 * - Returns a Promise that resolves after 'animationend' event
 * - Allows .then chaining
 * - Uses 'animationend' event to avoid timing issues with setTimeout
 * @param {HTMLElement} element - The element to apply the rotation animation to
 * @param {string} keyframes - The name of the CSS keyframes
 * @param {number} [duration=1000] - The duration in milliseconds
 * @param {string} [flavour='linear'] - The  of the animation
 * @param {number} [iterations=1] - The number of times to run the animation
 * @returns {Promise} Promise that resolves after the last iteration, via 'animationend' event
 */
function _animate(element, keyframes, duration = 1000, flavour = 'linear', iterations = 1) {

    // > Start animation, and reflow element
    element.style.animation = `${keyframes} ${duration}ms ${flavour} ${iterations}`;
    tools.reflow(element);

    // > Return Promise that resolves after 'animationend' event
    return new Promise((resolve, reject) => {

        function handleAnimationEnd() {

            // > Remove the event listeners
            element.removeEventListener('animationend', handleAnimationEnd);
            element.removeEventListener('animationcancel', handleAnimationCancel);

            // > Disable animation, and reflow element
            element.style.animation = '';
            tools.reflow(element);

            // > Resolve the Promise
            resolve();

        }

        function handleAnimationCancel() {

            // > Remove the event listeners
            element.removeEventListener('animationcancel', handleAnimationCancel);
            element.removeEventListener('animationend', handleAnimationEnd);

            // > Reject the Promise
            reject();

        }

        // > Add the event listeners
        element.addEventListener('animationend', handleAnimationEnd);
        element.addEventListener('animationcancel', handleAnimationCancel);

    });

}