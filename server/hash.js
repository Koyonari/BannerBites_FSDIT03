const bcrypt = require('bcrypt'); // Ensure password hashing and verification
const SALT_ROUNDS = 10; // Number of salt rounds to increase hash complexity

const password = "pass123";

// Function to hash a password
const hashPassword = async (password) => {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    throw new Error('Error hashing password');
  }
};

// Using async to wait for hashPassword function to complete
(async () => {
  const hashedPassword = await hashPassword(password);
  console.log(hashedPassword);
})();
