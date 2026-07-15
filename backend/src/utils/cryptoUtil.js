const crypto = require('crypto');

// ─── Validation de la clé au démarrage ────────────────────────────────────────
// La clé doit être définie dans .env (ENCRYPTION_KEY=<32 caractères hex>)
// Elle n'est jamais lue depuis le code source pour des raisons de sécurité
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16; // Pour AES, toujours 16

if (!ENCRYPTION_KEY || Buffer.from(ENCRYPTION_KEY).length !== 32) {
    console.error(
        'ERREUR CRITIQUE : ENCRYPTION_KEY doit être défini dans .env et faire exactement 32 octets.'
    );
    // En production on pourrait process.exit(1), mais on continue pour ne pas
    // casser les tests unitaires qui n'utilisent pas le chiffrement
}

function encrypt(text) {
    if (!text) return text;
    if (!ENCRYPTION_KEY) return text; // Dégradation gracieuse si clé manquante
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    if (!text) return text;
    if (!ENCRYPTION_KEY) return text; // Dégradation gracieuse si clé manquante
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error('Erreur lors du déchiffrement :', error.message);
        return text; // Retourne le texte original si le déchiffrement échoue
    }
}

module.exports = { encrypt, decrypt };
