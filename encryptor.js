// < ========================================================
// < Exported Custom PBKDF2 Function (async)
// < ========================================================

/**
 * Derive cryptographic key using PBKDF2 from a given password and salt
 * @param {string} password - The password to derive the key from
 * @param {string} salt - The salt to use for key derivation
 * @returns {Promise<CryptoKey>} - The derived CryptoKey object
 */
export async function PBKDF2(password, salt) {

    // > Convert password and salt to int array
    const passwordIntArray = new TextEncoder().encode(password);
    const saltIntArray = new TextEncoder().encode(salt);

    // > Define importKey arguments
    var format = "raw";
    var algorithm = { name: "PBKDF2" };
    var extractable = false;
    var keyUsages = ["deriveKey"]

    // > Import key material to create a CryptoKey object
    const keyMaterial = await crypto.subtle.importKey(
        format,
        passwordIntArray,
        algorithm,
        extractable,
        keyUsages
    );

    // > Define deriveKey arguments
    var algorithm = {
        name: "PBKDF2",
        salt: saltIntArray,
        iterations: 100000,
        hash: "SHA-256"
    };
    var derivedKeyType = { name: "AES-GCM", length: 256 };
    var extractable = false;
    var keyUsages = ["encrypt", "decrypt"];

    // > Derive the key using the given arguments
    const cryptoKey = await crypto.subtle.deriveKey(
        algorithm,
        keyMaterial,
        derivedKeyType,
        extractable,
        keyUsages
    );

    return cryptoKey;

}

// < ========================================================
// < Exported Encrypt String Function (async)
// < ========================================================

/**
 * Encrypt string using AES, returning a Base64-encoded string
 * @param {string} text - The string to encrypt
 * @param {CryptoKey} key - The CryptoKey object used for encryption
 * @param {Uint8Array} iv - The initialisation vector to use for encryption
 * @returns {Promise<string>} - The Base64-encoded encrypted string
 */
export async function encryptString(text, key, iv) {

    // > Convert text to bytes
    const textBytes = new TextEncoder().encode(text);

    // > Define encrypt arguments
    var algorithm = { name: "AES-GCM", iv: iv };

    // > Encrypt to arrayBuffer using the given arguments
    const encryptedArrayBuffer = await crypto.subtle.encrypt(
        algorithm,
        key,
        textBytes
    );

    // > Convert the encrypted arrayBuffer to a Base64 string and return
    const encryptedString = arrayBufferToBase64(encryptedArrayBuffer);
    return encryptedString;

}

// < ========================================================
// < Exported Decrypt String Function (async)
// < ========================================================

/**
 * Decrypt a Base64-encoded encrypted string using AES
 * @param {string} encryptedString - Base64-encoded encrypted string to decrypt
 * @param {CryptoKey} key - The CryptoKey object used for decryption
 * @param {Uint8Array} iv - The initialisation vector used during encryption
 * @returns {Promise<string>} - The decrypted plaintext string
 */
export async function decryptString(encryptedString, key, iv) {

    // > Convert the Base64 encrypted string to bytes
    var binaryString = atob(encryptedString);
    const encryptedBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        encryptedBytes[i] = binaryString.charCodeAt(i);
    }

    // > Define decrypt arguments
    var algorithm = { name: "AES-GCM", iv: iv };

    // > Decrypt to array buffer using the given arguments
    const decryptedArrayBuffer = await crypto.subtle.decrypt(
        algorithm,
        key,
        encryptedBytes
    );

    // > Convert the decrypted array buffer back to a string and return
    const decryptedString = new TextDecoder().decode(decryptedArrayBuffer);
    return decryptedString;

}

// < ========================================================
// < Exported Utility Functions
// < ========================================================

/**
 * Converts an ArrayBuffer to a Base64-encoded string
 * @param {ArrayBuffer} arrayBuffer - The ArrayBuffer
 * @returns {string} - The Base64-encoded string
 */
export function arrayBufferToBase64(arrayBuffer) {
    var binaryString = '';
    const intArray = new Uint8Array(arrayBuffer);
    const len = intArray.byteLength;
    for (var i = 0; i < len; i++) {
        binaryString += String.fromCharCode(intArray[i]);
    }
    const base64String = window.btoa(binaryString)
    return base64String;
}

/**
 * Converts a Uint8Array to a Base64-encoded string
 * @param {Uint8Array} intArray - The Uint8Array
 * @returns {string} - The Base64-encoded string
 */
export function intArrayToBase64(intArray) {
    var arrayBuffer = intArray.buffer
    return arrayBufferToBase64(arrayBuffer);
}

/**
 * Converts a Base64-encoded string to a Uint8Array
 * @param {string} base64String - The Base64-encoded string
 * @returns {Uint8Array} - The decoded Uint8Arrays
 */
export function base64ToIntArray(base64String) {
    var binaryString = window.atob(base64String);
    var intArray = new Uint8Array(binaryString.length);
    for (var i = 0; i < binaryString.length; i++) {
        intArray[i] = binaryString.charCodeAt(i);
    }
    return intArray;
}

/**
 * Converts a Base64-encoded string to an ArrayBuffer
 * @param {string} base64String - The Base64-encoded string
 * @returns {ArrayBuffer} - The decoded ArrayBuffer
 */
export function base64ToArrayBuffer(base64String) {
    let intArray = base64ToIntArray(base64String);
    const arrayBuffer = intArray.buffer;
    return arrayBuffer;
}