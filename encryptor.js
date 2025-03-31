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

    // > Convert the Base64 encrypted string to bytes
    const binaryString = atob(encryptedString);
    const encryptedBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        encryptedBytes[i] = binaryString.charCodeAt(i);
    }

    // > Define decrypt arguments
    var algorithm = { name: "AES-GCM", iv: iv };

    // > Decrypt bytes using the given arguments
    const decryptedBytes = await crypto.subtle.decrypt(
        algorithm,
        key,
        encryptedBytes
    );

    // > Convert the decrypted bytes back to a string and return
    const decodedText = new TextDecoder().decode(decryptedBytes);
    return decodedText;

}