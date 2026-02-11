import bcrypt from 'bcrypt';


const encryptPassword = async(pwd="") =>{
    const saltRounds = 8;
    
    return new Promise( (resolve, reject) =>{

        //const salt = bcrypt.genSaltSync(saltRounds);
        //const hash = bcrypt.hashSync(myPlaintextPassword, salt);

        bcrypt.hash(pwd, saltRounds, function(err, hash) {
            if(err){
                reject(err);
            }
            resolve(hash);
        });
    });
}

/**
 * Compares a plaintext password with a hashed password to check for a match.
 *
 * @param {string} plaintextPwd - The plaintext password to be compared.
 * @param {string} hashedPwd - The hashed password to compare against.
 * @returns {Promise<boolean>} A promise that resolves to true if the passwords match, otherwise false.
 */
const comparePassword = async(plaintextPwd, hashedPwd) =>{
    return new Promise( (resolve, reject) =>{
        bcrypt.compare(plaintextPwd, hashedPwd, function(err, result) {
            if(err){
                reject(err);
            }
            resolve(result);
        });
    });
    
}

export {encryptPassword, comparePassword}
