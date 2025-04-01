// < ========================================================
// < Imports
// < ========================================================

import { tools } from "./tools.js";
import {
    PBKDF2,
    encryptString,
    decryptString,
    base64ToArrayBuffer,
    arrayBufferToBase64
} from "./encryptor.js";

// < ========================================================
// < Exported Save Manager Class
// < ========================================================

export class SaveManager {

    /** @type {CryptoKey} */
    static cryptoKey;

    static storageKey = 'notepad-encrypyted-2025-04-01';
    static separator = ',';
    static initialised = false;
    static savingNow = false;
    static savingSoon = false;
    static delay = 3000;

    static async init() {
        let password = prompt("Password: ");
        let salt = prompt("Salt: ");
        this.cryptoKey = await PBKDF2(password, salt);
        this.initialised = true;
    }

    /** 
     * Implement custom asynchronous save function here
     * @param {object} data
     * @returns {Promise<void>}
     */
    static async _save(data) {
        const dataString = JSON.stringify(data);
        const ivArrayBuffer = crypto.getRandomValues(new Uint8Array(12));
        const encryptedBase64 = await encryptString(dataString, this.cryptoKey, ivArrayBuffer);
        const ivBase64 = arrayBufferToBase64(ivArrayBuffer);
        const storageBase64 = encryptedBase64 + this.separator + ivBase64;
        localStorage.setItem(SaveManager.storageKey, storageBase64);
        console.log(`SaveManager saved all data to localStorage`);
    }

    /** 
     * Implement custom asynchronous load function here
     * @returns {Promise<object>}
     */
    static async _load2() {
        const storageBase64 = localStorage.getItem(SaveManager.storageKey);
        const [encryptedBase64, ivBase64] = storageBase64.split(this.separator);
        const ivArrayBuffer = base64ToArrayBuffer(ivBase64);
        console.log(encryptedBase64, ivBase64);
        console.log(this.cryptoKey);
        const dataString = await decryptString(encryptedBase64, this.cryptoKey, ivArrayBuffer);
        console.log(dataString);
        const data = JSON.parse(dataString);
        console.log(`SaveManager loaded all data from localStorage`);
        return data;
    }

    static async _load() {
        try {

            const storageBase64 = localStorage.getItem(SaveManager.storageKey);
            if (!storageBase64) {
                console.error(`No data found in localStorage for ${this.storageKey}`);
                return;
            }

            const [encryptedBase64, ivBase64] = storageBase64.split(this.separator);
            if (!encryptedBase64 || !ivBase64) {
                console.error(`Invalid data format in localStorage for ${this.storageKey}`);
                return;
            }

            // > Convert Base64 IV to ArrayBuffer
            const ivArrayBuffer = base64ToArrayBuffer(ivBase64);
            // console.error(encryptedBase64, ivBase64);
            // console.log(this.cryptoKey);

            // > Decrypt the data and parse it
            const dataString = await decryptString(encryptedBase64, this.cryptoKey, ivArrayBuffer);
            // console.log(dataString);

            const data = JSON.parse(dataString);
            console.log("SaveManager loaded all data from localStorage");

            return data;

        } catch (error) {
            console.error("Failed to load data:", error);
            return null; // or handle error as needed
        }
    }

    /** 
     * Initiate an immediate save if none is in progress
     * @param {object} data
     * @returns {Promise<void>}
     */
    static async saveNow(data) {
        if (this.savingNow) return;
        this.savingNow = true;
        try {
            await this._save(data);
            tools.dispatch('saved');
        }
        finally {
            this.savingNow = false;
        }
    }

    /** 
     * Schedule a save after a delay unless one is queued or in progress
     * @returns {void}
     */
    static saveSoon() {
        if (this.savingSoon || this.savingNow) return;
        this.savingSoon = true;
        setTimeout(() => {
            this.savingSoon = false;
            this.saveNow();
        }, this.delay);
    }

}