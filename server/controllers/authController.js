const { authenticateUser } = require('../middleware/authMiddleware');

const login = async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const token = await authenticateUser(username, password);
      res.cookie('authToken', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 1000 // 1 hour
      });
  
      res.status(200).json({ message: "Login successful" });
    } catch (error) {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  };
  
module.exports = { login };
