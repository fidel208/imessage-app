const pool = require("../config/db");

// 1. Send Message (Direct chat or image upload)
exports.sendMessage = async (req, res) => {
  try {
    const { sender_id, receiver_id, message_text, image_url } = req.body;
    const query = `
      INSERT INTO messages (sender_id, receiver_id, message_text, image_url)
      VALUES ($1, $2, $3, $4) RETURNING *;
    `;
    const result = await pool.query(query, [
      sender_id,
      receiver_id,
      message_text || "",
      image_url || null,
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to dispatch message packet" });
  }
};

// 2. Get Chat History
exports.getChatHistory = async (req, res) => {
  try {
    const { sender_id, receiver_id } = req.query;
    if (!sender_id || !receiver_id) {
      return res
        .status(400)
        .json({ error: "Sender and Receiver IDs required" });
    }
    const query = `
      SELECT * FROM messages 
      WHERE (sender_id = $1 AND receiver_id = $2) 
         OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC;
    `;
    const result = await pool.query(query, [sender_id, receiver_id]);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve conversation logs" });
  }
};

// 3. Create a new Group Chat
exports.createGroup = async (req, res) => {
  try {
    const { group_name, created_by, user_ids } = req.body;
    const groupResult = await pool.query(
      `INSERT INTO groups (group_name, created_by) VALUES ($1, $2) RETURNING *;`,
      [group_name, created_by],
    );
    const groupId = groupResult.rows[0].id;

    const allMembers = [created_by, ...user_ids];
    for (let userId of allMembers) {
      await pool.query(
        `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
        [groupId, userId],
      );
    }
    res
      .status(201)
      .json({
        message: "Group created successfully",
        group: groupResult.rows[0],
      });
  } catch (err) {
    res.status(500).json({ error: "Group creation failure" });
  }
};

// 4. Send a Message into a Group
exports.sendGroupMessage = async (req, res) => {
  try {
    const { group_id, sender_id, message_text, image_url } = req.body;
    const query = `
      INSERT INTO group_messages (group_id, sender_id, message_text, image_url)
      VALUES ($1, $2, $3, $4) RETURNING *;
    `;
    const result = await pool.query(query, [
      group_id,
      sender_id,
      message_text || "",
      image_url || null,
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to dispatch group packet" });
  }
};

// 5. Get Group Chat History
exports.getGroupHistory = async (req, res) => {
  try {
    const { group_id } = req.query;
    const query = `
      SELECT gm.*, u.username FROM group_messages gm
      JOIN users u ON gm.sender_id = u.id
      WHERE gm.group_id = $1 ORDER BY gm.created_at ASC;
    `;
    const result = await pool.query(query, [group_id]);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to load group history log tracks" });
  }
};

// 6. Get List of Groups a user belongs to
exports.getUserGroups = async (req, res) => {
  try {
    const { user_id } = req.query;
    const query = `
      SELECT g.* FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = $1;
    `;
    const result = await pool.query(query, [user_id]);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to pull matching group entities" });
  }
};
