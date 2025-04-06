// < ========================================================
// < Imports
// < ========================================================

import { tools } from "../tools.js";

// < ========================================================
// < Exported Sprite Class
// < ========================================================

/**
 * Construct wrapper instance for an HTML `svg` element
 * - Uses symbols from `sprite.svg` for the sprite image
 * - Swap image using a different symbol name via sprite.swap(name)
 * - Uses `.sprite` styling from `sprite.css`
 */
export class Sprite {

    /** @type {HTMLElement} */
    element;

    /** @type {SVGElement} */
    svg;

    /** @type {SVGUseElement} */
    use;

    /**
     * Construct wrapper instance for an HTML `svg` element
     * - Uses `.sprite` styling from `sprite.css`
     * - Uses symbols from `sprite.svg` for the sprite image
     * - Swap image using a different symbol name via sprite.swap(name)
     * @param {string} elementID - The id to be given to the new element
     * @param {string} symbolName - The name of the symbol from `sprite.svg`
     */
    constructor(elementID, symbolName) {
        this.element = document.createElement("div");
        this.element.id = elementID;
        this.element.className = "sprite";
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        this.svg.appendChild(this.use);
        this.element.appendChild(this.svg);
        this.swap(symbolName);
    }

    /**
     * Swap image using a given symbol name
     * - Uses "cache busting" techniques
     * @param {string} symbolName - The name of the symbol from `sprite.svg`
     */
    swap(symbolName) {
        let cacheBust = new Date().getTime();
        let value = `sprite/sprite.svg?${cacheBust}#${symbolName}`;
        this.use.setAttribute('href', value);
        tools.reflow(this.element);
    }

    /**
     * Toggle .hidden class for sprite element
     * @param {boolean} [force] - Force hidden on or off
     */
    toggleHidden(force) {
        tools.toggleHidden(this.element, force);
    }

    /** 
     * Manipulate the sprite instance, immediately calling the given action
     * - Useful in situations in which a function returns a sprite instance
     * @param {(sprite: Sprite)} action - Action immediately applied to this sprite instance
     * @returns {Sprite} This sprite instance, for method chaining
     */
    also(action) {
        action(this);
        return this;
    }

    // ! ========================================================
    // ! Experimental Methods
    // ! ========================================================

    /** 
     * Rotate this sprite's element n times across a given duration
     * - Returns a Promise that resolves after 'animationend' event
     * - Allows .then chaining
     * - Uses 'animationend' event to avoid timing issues with setTimeout
     * @param {number} [duration=1000] - Time to complete all rotations in ms
     * @param {number} [n=1] - The number of rotations to make in the given time
     * @returns {Promise} Promise that resolves after 'animationend' event
     */
    rotate(duration = 1000, n = 1) {
        return _rotate(this.element, duration, n);
    }

}

// < ========================================================
// < Internal Functions
// < ========================================================

/** 
 * Rotate an element n times across a given duration
 * - Returns a Promise that resolves after 'animationend' event
 * - Allows .then chaining
 * - Uses 'animationend' event to avoid timing issues with setTimeout
 * @param {HTMLElement} element - The element to apply the rotation animation to
 * @param {number} [duration=1000] - Time to complete all rotations in ms
 * @param {number} [n=1] - The number of rotations to make in the given time
 * @returns {Promise} Promise that resolves after 'animationend' event
 */
function _rotate(element, duration = 1000, n = 1) {

    // > Calculate the duration of one full rotation
    const rotationDuration = duration / n;

    // > Start animation, and reflow element
    element.style.animation = `rotate ${rotationDuration}ms linear ${n}`;
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

// /** 
//  * Rotate an element n times, each for a given duration
//  * - Returns a Promise that resolves after 'animationend' event
//  * - Allows .then chaining
//  * - Uses 'animationend' event to avoid timing issues with setTimeout
//  * @param {HTMLElement} element - The element to apply the rotation animation to
//  * @param {number} [n=1] - The number of rotations to make
//  * @param {number} [duration=1000] - The duration in milliseconds
//  * @returns {Promise} Promise that resolves after 'animationend' event
//  */
// function _rotate(element, n = 1, duration = 1000) {

//     // > Start animation, and reflow element
//     element.style.animation = `rotate ${duration}ms linear ${n}`;
//     tools.reflow(element);

//     // > Return Promise that resolves after 'animationend' event
//     return new Promise((resolve, reject) => {

//         function handleAnimationEnd() {

//             // > Remove the event listeners
//             element.removeEventListener('animationend', handleAnimationEnd);
//             element.removeEventListener('animationcancel', handleAnimationCancel);

//             // > Disable animation, and reflow element
//             element.style.animation = '';
//             tools.reflow(element);

//             // > Resolve the Promise
//             resolve();

//         }

//         function handleAnimationCancel() {

//             // > Remove the event listeners
//             element.removeEventListener('animationcancel', handleAnimationCancel);
//             element.removeEventListener('animationend', handleAnimationEnd);

//             // > Reject the Promise
//             reject();

//         }

//         // > Add the event listeners
//         element.addEventListener('animationend', handleAnimationEnd);
//         element.addEventListener('animationcancel', handleAnimationCancel);

//     });

// }

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