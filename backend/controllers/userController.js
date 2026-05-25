const pool = require("../config/db");

exports.getAllUsers = async (req, res) => {
  // ... your listing query logic
};

// Ensure this matches the exact spelling 'updateProfile'
exports.updateProfile = async (req, res) => {
  try {
    const {
      id,
      name: username,
      email,
      number: phone_number,
      birthday,
      bio,
    } = req.body;

    if (!id) return res.status(400).json({ error: "User ID required" });

    const query = `
      UPDATE users 
      SET username = COALESCE($1, username),
          email = COALESCE($2, email),
          phone_number = COALESCE($3, phone_number),
          birthday = COALESCE($4, birthday),
          bio = COALESCE($5, bio)
      WHERE id = $6
      RETURNING id, username, email, phone_number, birthday, bio;
    `;

    const values = [username, email, phone_number, birthday, bio, id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res
      .status(200)
      .json({ message: "Profile updated successfully", user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to save profile changes" });
  }
};
