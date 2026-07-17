const db = require('../config/db');
const bcrypt = require('bcrypt');

class AuthService {
    login(email, password) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT id, matricule, nom, prenom, fonction, telephone, emailPersonnelle, email, role, password FROM users WHERE email = ? AND archived = 0';
            db.query(query, [email], async (err, results) => {
                if (err) {
                    return reject(err);
                }

                if (results.length > 0) {
                    const user = results[0];

                    const isBcrypt = user.password &&
                        (user.password.startsWith('$2b$') || user.password.startsWith('$2a$'));

                    if (!isBcrypt) {
                        console.error(`ALERTE SÉCURITÉ : L'utilisateur ${email} a un mot de passe non hashé en base.`);
                        return resolve(null);
                    }

                    const isMatch = await bcrypt.compare(password, user.password);

                    if (isMatch) {
                        resolve({
                            id: user.id,
                            matricule: user.matricule,
                            nom: user.nom,
                            prenom: user.prenom,
                            fonction: user.fonction,
                            telephone: user.telephone,
                            emailPersonnelle: user.emailPersonnelle,
                            email: user.email,
                            role: user.role
                        });
                    } else {
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            });
        });
    }
}

module.exports = new AuthService();
