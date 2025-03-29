// < ========================================================
// < Exported tools Object
// < ========================================================

export const tools = {

    assert(condition, message = 'Assertion') {
        if (!condition) {
            throw new Error(`UserError: ${message}`);
        }
    },

    /**
     * Remove an item from an array
     * 
     * @param {Array<T>} array - The array to remove the item from
     * @param {T} item - The item to remove from the array
     * @returns {Array<T>} - The spliced array of deleted elements
     * @template T
     */
    remove(array, item) {
        const index = array.indexOf(item);
        if (index !== -1) {
            return array.splice(index, 1);
        }
        throw new Error(`UserError: item not in array`)
    },

    selectAll(element) {
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    },

    /** 
     * Toggle .hidden class for an element
     * @param {HTMLElement} element
     */
    toggleHidden(element, force) {
        element.classList.toggle('hidden', force);
    },

    /** 
     * Toggle .highlighted class for an element
     * @param {HTMLElement} element
     */
    toggleHighlighted(element, force) {
        element.classList.toggle('highlighted', force);
    },

    /** 
     * Toggle .bordered class for an element
     * @param {HTMLElement} element
     */
    toggleBordered(element, force) {
        element.classList.toggle('bordered', force);
    },

    /** 
     * debounced
     * @param {CallableFunction} callback - Function
     * @param {number} timeout - Time in ms
     */
    debounced: (callback, timeout) => {
        let timeoutID = null;
        return (...args) => {
            window.clearTimeout(timeoutID);
            timeoutID = window.setTimeout(() => {
                callback(...args);
            }, timeout);
        };
    }

}