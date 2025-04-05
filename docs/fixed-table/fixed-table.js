// < ========================================================
// < Exported FixedTable Class
// < ========================================================

/**
 * Construct wrapper instance for HTML `table` element
 * - FixedTable uses `table-layout: fixed` and should not overflow
 * - Alter column widths via `table.setColumnWidth`
 * - Uses `.fixed-table` styling from `fixed-table.css`
 */
export class FixedTable {

    /** @type {string} */
    className = 'fixed-table';

    /** @type {string[]} */
    headers;

    /** @type {HTMLDivElement} */
    element;

    /** @type {HTMLTableElement} */
    table;

    /** @type {HTMLTableColElement} */
    colgroup;

    /** @type {HTMLTableSectionElement} */
    head;

    /** @type {HTMLTableRowElement} */
    headRow;

    /** @type {HTMLTableSectionElement} */
    body;

    /** @type {HTMLTableSectionElement} */
    foot;

    /** @type {HTMLTableColElement[]} */
    columns;

    /** @type {HTMLTableRowElement[]} */
    rows;

    /** 
     * Create FixedTable instance as a wrapper for HTML table element
     * - For the table instance, `table.element` is a div with class `fixed-table`
     * - The `table.element` is not automatically added to the DOM
     * - The table uses `table-layout: fixed` and should not overflow
     * - Alter column widths via `table.setColumnWidth`
     * @param {string[]} headers - String list of headers for the table
     */
    constructor(headers) {
        this.headers = headers;
        this.element = document.createElement('div');
        this.table = document.createElement('table');
        this.colgroup = document.createElement('colgroup');
        this.head = document.createElement('thead');
        this.headRow = document.createElement("tr");
        this.body = document.createElement('tbody');
        this.foot = document.createElement('tfoot');
        this.init();
    }

    /** 
     * Initialise the elements of the FixedTable instance
     * - Add elements to table with correct structuring
     */
    init() {
        this.head.appendChild(this.headRow);
        this.table.appendChild(this.head);
        this.table.appendChild(this.body);
        this.table.appendChild(this.foot);
        this.table.prepend(this.colgroup);
        this.element.appendChild(this.table);
        this.headers.forEach(header => {

            // > Add cell to the head row
            let cell = document.createElement('th');
            cell.textContent = header;
            this.headRow.appendChild(cell);

            // > Add column to the column group
            let column = document.createElement('col');
            this.colgroup.append(column);

        });
        this.element.className = this.className;
        this.columns = this.colgroup.querySelectorAll('col');
    }

    /**
     * Get row elements in the table, including head and foot
     * @return {HTMLTableRowElement[]} The row elements of the table
     */
    get rows() {
        return Array.from(this.table.rows);
    }

    /**
     * Add a row element to the table body
     * @param {HTMLTableRowElement} rowElement - The row element to add
     * @param {boolean} [first=false] - If true, inserts row at the start
     */
    _addRow(rowElement, first = false) {
        if (first) {
            this.body.prepend(rowElement);
        } else {
            this.body.appendChild(rowElement);
        }
    }

    /**
     * Add a table row from an array of strings and return the row
     * @param {string[]} strings - Strings as content for row cells
     * @param {boolean} [first=false] - If true, inserts row at the start
     * @return {HTMLTableRowElement} - The created row element
     */
    addRowFromStrings(strings, first = false) {

        // > Ensure array length matches table columns
        if (strings.length !== this.columns.length) {
            console.error('String array length must match number of columns');
            return;
        }

        // > Create and add table row from strings
        let row = document.createElement("tr");
        for (let string of strings) {
            const cell = document.createElement("td");
            cell.textContent = String(string);
            row.appendChild(cell);
        }
        this._addRow(row, first);

        return row;

    }

    /**
     * Add a table row from an array of elements and return the row
     * @param {HTMLElement[]} elements - Elements as content for row cells
     * @param {boolean} [first=false] - If true, inserts row at the start
     * @return {HTMLTableRowElement} - The created row element
     */
    addRowFromElements(elements, first = false) {

        // > Ensure array length matches table columns
        if (elements.length !== this.columns.length) {
            console.error('Element array length must match number of columns');
            return;
        }

        // > Create and add table row from elements
        let row = document.createElement("tr");
        for (let element of elements) {
            const cell = document.createElement("td");
            cell.appendChild(element);
            row.appendChild(cell);
        }
        this._addRow(row, first);
        return row;

    }

    /** 
     * Get column element from a given column index
     * @param {number} columnIndex - The index of the column
     * @returns {HTMLTableColElement} The column element
     */
    getColumn(columnIndex) {
        return this.columns[columnIndex];
    }

    /** 
     * Toggle the .highlighted class for a column
     * @param {number} columnIndex - The index of the column
     * @param {boolean} [force] - Force highlighted on or off
     */
    toggleColumnHighlighted(columnIndex, force) {
        let column = this.getColumn(columnIndex);
        column.classList.toggle('highlighted', force);
    }

    /** 
     * Toggle the .collapsed class for a column, hiding or showing it
     * @param {number} columnIndex - The index of the column
     * @param {boolean} [force] - Force collapsed on or off
     */
    toggleColumnCollapsed(columnIndex, force) {
        let column = this.getColumn(columnIndex);
        column.classList.toggle('collapsed', force);
    }

    /** 
     * Set the width of a column for a given column index
     * - When total column widths != 100% browser calculates distribution
     * @param {number} columnIndex - The index of the column
     * @param {string} value - Value for CSS width, including suffix
     */
    setColumnWidth(columnIndex, value) {
        let column = this.getColumn(columnIndex);
        column.style.width = value;
    }

}