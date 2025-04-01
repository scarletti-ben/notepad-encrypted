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

    // > Convert password and salt to bytes
    const passwordBytes = new TextEncoder().encode(password);
    const saltBytes = new TextEncoder().encode(salt);

    // > Define importKey arguments
    var format = "raw";
    var algorithm = { name: "PBKDF2" };
    var extractable = false;
    var keyUsages = ["deriveKey"]

    // > Import key material using PBKDF2 to create a CryptoKey object
    const keyMaterial = await crypto.subtle.importKey(
        format,
        passwordBytes,
        algorithm,
        extractable,
        keyUsages
    );

    // > Define deriveKey arguments
    var algorithm = {
        name: "PBKDF2",
        salt: saltBytes,
        iterations: 100000,
        hash: "SHA-256"
    };
    var derivedKeyType = { name: "AES-GCM", length: 256 };
    var extractable = false;
    var keyUsages = ["encrypt", "decrypt"];

    // > Derive the key using the given arguments
    const derivedKey = await crypto.subtle.deriveKey(
        algorithm,
        keyMaterial,
        derivedKeyType,
        extractable,
        keyUsages
    );

    return derivedKey;

}

// < ========================================================
// < Exported Encrypt String Function (async)
// < ========================================================

/**
 * Encrypt string using AES-GCM, returning a Base64-encoded string
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

    // > Encrypt bytes using the given arguments
    const encryptedBytes = await crypto.subtle.encrypt(
        algorithm,
        key,
        textBytes
    );

    // > Convert the encrypted bytes to a Base64 string and return
    const encryptedString = btoa(String.fromCharCode(...new Uint8Array(encryptedBytes)));
    return encryptedString;

}

// < ========================================================
// < Exported Decrypt String Function (async)
// < ========================================================

/**
 * Decrypt a Base64-encoded encrypted string using AES-GCM
 * @param {string} encryptedString - Base64-encoded encrypted string to decrypt
 * @param {CryptoKey} key - The CryptoKey object used for decryption
 * @param {Uint8Array} iv - The initialisation vector used during encryption
 * @returns {Promise<string>} - The decrypted plaintext string
 */
export async function decryptString(encryptedString, key, iv) {

    // console.warn("in decryptor")

    // console.log(encryptedString, key, iv);

    // > Convert the Base64 encrypted string to bytes
    const binaryString = atob(encryptedString);
    const encryptedBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        encryptedBytes[i] = binaryString.charCodeAt(i);
    }

    // console.warn(encryptedBytes);

    // > Define decrypt arguments
    var algorithm = { name: "AES-GCM", iv: iv };

    // > Decrypt bytes using the given arguments
    const decryptedBytes = await crypto.subtle.decrypt(
        algorithm,
        key,
        encryptedBytes
    );

    // console.log(decryptedBytes);

    // > Convert the decrypted bytes back to a string and return
    const decodedText = new TextDecoder().decode(decryptedBytes);
    return decodedText;

}

// < ========================================================
// < Utility Functions
// < ========================================================

/**
 * Converts an ArrayBuffer to a Base64-encoded string
 * @param {ArrayBuffer} buffer - The ArrayBuffer
 * @returns {string} - The Base64-encoded string
 */
export function arrayBufferToBase64(buffer) {
    var binaryString = '';
    var intArray = new Uint8Array(buffer);
    var len = intArray.byteLength;
    for (var i = 0; i < len; i++) {
        binaryString += String.fromCharCode(intArray[i]);
    }
    return window.btoa(binaryString);
}

/**
 * Converts a Uint8Array to a Base64-encoded string
 * @param {Uint8Array} intArray - The Uint8Array
 * @returns {string} - The Base64-encoded string
 */
export function intArrayToBase64(intArray) {
    var buffer = intArray.buffer
    return arrayBufferToBase64(buffer);
}

/**
 * Converts a Base64-encoded string to a Uint8Array
 * @param {string} base64 - The Base64-encoded string
 * @returns {ArrayBuffer} - The decoded Uint8Arrays
 */
export function base64ToIntArray(base64) {
    var binaryString = window.atob(base64);
    var intArray = new Uint8Array(binaryString.length);
    for (var i = 0; i < binaryString.length; i++) {
        intArray[i] = binaryString.charCodeAt(i);
    }
    return intArray;
}

/**
 * Converts a Base64-encoded string to an ArrayBuffer
 * @param {string} base64 - The Base64-encoded string
 * @returns {ArrayBuffer} - The decoded ArrayBuffer
 */
export function base64ToArrayBuffer(base64) {
    let intArray = base64ToIntArray(base64);
    return intArray.buffer;
}

// ! ========================================================
// ! Testing
// ! ========================================================

async function main(params) {

    // >
    const data = {
        'notes': ['note']
    }
    const separator = ','
    console.log(JSON.stringify(data, null, 2));

    // >
    let password = prompt("Password: ");
    let salt = prompt("Salt: ");
    let cryptoKey = await PBKDF2(password, salt);

    // >
    const dataString = JSON.stringify(data);
    const ivArrayBuffer = crypto.getRandomValues(new Uint8Array(12));
    const encryptedBase64 = await encryptString(dataString, cryptoKey, ivArrayBuffer);
    const ivBase64 = arrayBufferToBase64(ivArrayBuffer);
    const storageBase64 = encryptedBase64 + separator + ivBase64;

    // >
    const [_encryptedBase64, _ivBase64] = storageBase64.split(separator);
    const _ivArrayBuffer = base64ToArrayBuffer(_ivBase64);
    const _dataString = await decryptString(_encryptedBase64, cryptoKey, _ivArrayBuffer);
    const _data = JSON.parse(_dataString);
    console.log(JSON.stringify(_data, null, 2));

}

await main();