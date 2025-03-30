// < ========================================================
// < Exported tools Object
// < ========================================================

/**
 * A collection of utility functions
 * @namespace tools
 */
export const tools = {

    // > ========================================================
    // > I: JavaScript Tools
    // > ========================================================

    // ==========================================================
    // Language Tools
    // ==========================================================

    /**
     * Remove an item from a given array
     * @template T
     * @param {Array<T>} array - The array to remove the item from
     * @param {T} item - The item to remove from the array
     * @returns {Array<T>} - The spliced array of deleted elements
     * @throws {Error} If the item is not found in the given array
     */
    remove(array, item) {
        const index = array.indexOf(item);
        if (index !== -1) {
            return array.splice(index, 1);
        }
        throw new Error(`UserError: item not in array`);
    },

    /**
     * Ensure none of the arguments passed are undefined
     * @param {...*} args - Arguments to check for undefined values
     * @throws {Error} If any argument passed is undefined
     */
    argcheck(...args) {
        let successful = args.every(arg => arg !== undefined);
        if (!successful) {
            throw new Error('UserError: A passed argument was undefined');
        }
    },

    /** 
     * Throws an error if the passed condition is false
     * @param {boolean} condition - The condition to assert
     * @param {string} [message='Assertion'] - The error message
     * @throws {Error} UserError if condition is false
     */
    assert(condition, message = 'Assertion') {
        if (!condition) {
            console.error(`Condition: ${condition}`);
            throw new Error(`UserError: ${message}`);
        }
    },

    /**
     * Create an array of numbers from 0 to n-1
     * @param {number} n - The end number (exclusive)
     * @returns {Array<number>} An array containing the sequence [0, 1, 2, ..., n-1]
     */
    range(n) {
        let array = Array(n);
        let indices = array.keys();
        return [...indices];
    },

    /** 
     * Get a random element from an array
     * @template T
     * @param {Array<T>} array - The array
     * @returns {T} A random element from the array
     */
    choice(array) {
        const index = Math.floor(Math.random() * array.length);
        return array[index];
    },

    /**
     * Generate a random integer from min to max, both inclusive
     * @param {number} min - The minimum value (will be rounded up)
     * @param {number} max - The maximum value (will be rounded down)
     * @returns {number} A random integer between min and max (inclusive)
     */
    randint(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Generate a random boolean, true or false
     * @returns {boolean} A random boolean
     */
    randbool() {
        return Math.random() > 0.5;
    },

    /** 
     * Clamp a value between a minimum and maximum
     * @param {number} value - The value to clamp
     * @param {number} min - The minimum value
     * @param {number} max - The maximum value
     * @returns {number} The clamped value
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    /**
     * Sort an array using a key function, with optional reverse
     * @template T
     * @param {Array<T>} array - The array to sort
     * @param {(item: T) => number} key - Function that returns a numeric sort value
     * @param {boolean} [reverse=false] - optionally reverse the sort order
     * @returns {Array<T>} - The sorted array
     */
    sort(array, key, reverse = false) {
        return array.sort((a, b) => {
            const comparison = key(a) - key(b);
            return reverse ? -comparison : comparison;
        });
    },

    /** 
    * Shuffle an array in-place using an unbiased Fisher–Yates shuffle
    * @param {Array} array - The array to shuffle  
    */
    shuffle(array) {
        let currentIndex = array.length;
        while (currentIndex !== 0) {
            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }
    },

    // ==========================================================
    // Other Tools
    // ==========================================================

    /**
     * Get the current date and time as an ISO 8601 string (YYYY-MM-DDTHH:mm:ss.sssZ)
     * @returns {string} The current date and time in ISO 8601 format
     */
    date() {
        const date = new Date();
        const string = date.toISOString();
        return string;
    },

    /**
     * Wait for a given time, then resolve 'empty' Promise
     * - Returns an 'empty' Promise object allowing .then() chaining
     * @returns {Promise<void>}
     */
    sleep(ms = 1000) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /** 
     * Decorator to return a debounced wrapper of a given function
     * - Calling the wrapper starts a timeout
     * - Subsequent calls restart the timeout
     * - When the timeout ends the wrapped function is called
     * @param {Function} func - The function to be wrapped
     * @param {number} timeout - The debounce timeout in milliseconds
     * @returns {Function} A debounceed wrapper of the given function
     */
    debounced: (func, timeout = 1000) => {
        let timeoutID = null;
        function wrapper(...args) {
            window.clearTimeout(timeoutID);
            timeoutID = window.setTimeout(() => {
                func(...args);
            }, timeout);
        }
        return wrapper;
    },

    /** 
     * Decorator to return a bottlenecked wrapper of a given function
     * - Calling the wrapper the first time starts a timeout
     * - Subsequent calls are ignored and do not restart the timeout
     * - When the timeout ends the wrapped function is called
     * @param {Function} func - The function to be wrapped
     * @param {number} timeout - The bottleneck timeout in milliseconds
     * @returns {Function} A bottlenecked wrapper of the given function
     */
    bottlenecked: (func, timeout = 1000) => {
        let running = false;
        function wrapper(...args) {
            if (running) return;
            running = true;
            window.setTimeout(() => {
                running = false;
                func(...args);
            }, timeout);
        }
        return wrapper;
    },

    /**
     * Timed animation ticker that executes a function every animation frame, passing progress as a decimal
     * - Returns a Promise object allowing .then() chaining
     * @param {(progress: number)} callback - Callback that takes ticker progress (decimal 0 to 1)
     * @param {number} duration - The duration in milliseconds for the ticker to run for
     * @returns {Promise<boolean>} A promise that resolves true when the ticker is finished
     */
    animationTicker(callback, duration) {
        return new Promise((resolve) => {
            let start = performance.now();
            function tick() {
                let current = performance.now();
                let elapsed = current - start;
                let progress = Math.min(elapsed / duration, 1);
                callback(progress);
                if (progress < 1) {
                    requestAnimationFrame(tick);
                } else {
                    resolve(true);
                }
            }
            requestAnimationFrame(tick);
        });
    },

    // > ========================================================
    // > II: HTML and CSS Tools
    // > ========================================================

    /** 
     * Select all content within an HTML element
     * @param {HTMLElement} element - The element to select from
     */
    selectAll(element) {
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    },

    // =========================================================
    // Common CSS Class Toggles
    // =========================================================

    /**
     * Toggle .hidden class for an element
     * @param {HTMLElement} element - The element
     * @param {boolean} [force] - Force hidden on or off
     * @returns {null}
     */
    toggleHidden(element, hidden) {
        element.classList.toggle('hidden', hidden);
    },

    /** 
     * Toggle shown (removal of .hidden class) for an element
     * @param {HTMLElement} element - The element
     * @param {boolean} [force] - Force shown on or off
     * @returns {null}
     */
    toggleShown(element, shown) {
        let force = shown === undefined ? undefined : !shown
        element.classList.toggle('hidden', force);
    },

    /** 
     * Toggle the .highlighted class for an element
     * @param {HTMLElement} element - The element
     * @param {boolean} [force] - Force highlighted on or off
     * @returns {null}
     */
    toggleHighlighted(element, force) {
        element.classList.toggle('highlighted', force);
    },

    /** 
     * Toggle the .bordered class for an element
     * @param {HTMLElement} element - The element
     * @param {boolean} [force] - Force bordered on or off
     * @returns {null}
     */
    toggleBordered(element, force) {
        element.classList.toggle('bordered', force);
    },

    // > ========================================================
    // > III: Miscellaneous
    // > ========================================================

}

// ! ========================================================
// ! Exported experimental Object
// ! ========================================================

/**
 * A collection of experimental utility functions
 * - Untested
 * - Limited documentation
 * - Limited use cases
 * @namespace experimental
 */
export const experimental = {

    objectify(string) {
        return JSON.parse(string);
    },

    stringify(object, indent = 2) {
        return JSON.stringify(object, null, indent);
    },

    /** @param {Array} array @param {number} n @returns {Array} */
    sample(array, n) {
        // > Get a random sample of n elements from a given array
        const shuffled = array.slice();
        let i = array.length;
        while (i--) {
            let j = Math.floor(Math.random() * (i + 1));
            let temp = shuffled[i];
            shuffled[i] = shuffled[j];
            shuffled[j] = temp;
        }
        return shuffled.slice(0, n);
    },

    typestring(item) {
        console.log(Object.prototype.toString.call(item))
    },

    title(str) {
        return str.replace(/\w\S*/g, text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase());
    }

}