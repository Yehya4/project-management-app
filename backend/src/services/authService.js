const db = require('../config/db');
const bcrypt = require('bcrypt');

class AuthService {
    login(email, password) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM users WHERE email = ?';
            db.query(query, [email], async (err, results) => {
                if (err) {
                    return reject(err);
                }
                
                if (results.length > 0) {
                    const user = results[0];
                    let isMatch = false;
                    
                    if (user.password && (user.password.startsWith('$2b$') || user.password.startsWith('$2a$'))) {
                        isMatch = await bcrypt.compare(password, user.password);
                    } else {
                        isMatch = (password === user.password);
                    }
                    
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
