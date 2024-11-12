const { authenticateUser } = require('../middleware/authMiddleware');

const login = async (req, res) => {
    const { username, password, role } = req.body;
  
    try {
      const token = await authenticateUser(username, password, role); // Pass role to the authenticateUser function
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 1000 // 1 hour
      });
  
      res.status(200).json({ message: "Login successful" });
    } catch (error) {
      res.status(401).json({ message: 'Invalid username, password, or role' });
    }
  };
  

module.exports = { login };
