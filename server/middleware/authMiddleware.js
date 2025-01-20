const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getUserByUsername } = require('../models/UserModel');

// Function to compare passwords
const verifyPassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch {
    throw new Error('Error verifying password');
  }
};

// Function to authenticate a user
const authenticateUser = async (username, password, roles) => {
  const user = await getUserByUsername(username);

  // Check if the user exists and verify the password
  if (user && await verifyPassword(password, user.password)) {
    // Ensure the user has the correct role
    if (user.roles === roles) {
      // Issue the token with the correct role
      return jwt.sign({ username: user.username, role: roles }, process.env.JWT_SECRET, { expiresIn: '1h' });
    } else {
      throw new Error('User does not have the correct role');
    }
  } else {
    throw new Error('Invalid credentials');
  }
};

// Function to verify a token and authenticate a user
const verifyToken = (req, res, next) => {
  const token = req.cookies.authToken;

  if (!token) {
    return res.status(403).json({ message: "Not authenticated" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { authenticateUser, verifyToken };
