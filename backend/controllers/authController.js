const pool = require("../config/db");
const bcrypt = require("bcryptjs");

exports.signup = async (req, res) => {
  try {
    const {
      "signup-name": username,
      number: phone_number,
      email,
      password,
    } = req.body;

    if (!username || !phone_number || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const query = `
      INSERT INTO users (username, phone_number, email, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email;
    `;

    const values = [username, phone_number, email, passwordHash];
    const result = await pool.query(query, values);

    res
      .status(201)
      .json({ message: "User registered successfully", user: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res
        .status(400)
        .json({ error: "Username, email, or phone number already exists" });
    }
    res.status(500).json({ error: "Server error during registration" });
  }
};

exports.login = async (req, res) => {
  try {
    const { "login-name": username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    const query = `SELECT * FROM users WHERE username = $1;`;
    const result = await pool.query(query, [username]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    res.status(200).json({
      message: "Login successful",
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error during login" });
  }
};
