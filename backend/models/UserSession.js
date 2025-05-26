const { query } = require('../database/config');
const { v4: uuidv4 } = require('uuid');

class UserSession {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.session_token = data.session_token;
    this.expires_at = data.expires_at;
    this.created_at = data.created_at;
    this.is_active = data.is_active;
  }

  // Create new session
  static async create(userId, expirationHours = 24) {
    try {
      const sessionToken = uuidv4() + '-' + Date.now();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expirationHours);

      const result = await query(
        `INSERT INTO user_sessions (user_id, session_token, expires_at)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [userId, sessionToken, expiresAt]
      );

      return new UserSession(result.rows[0]);
    } catch (error) {
      console.error('Error creating user session:', error);
      throw error;
    }
  }

  // Find session by ID
  static async findById(sessionId) {
    try {
      const result = await query(
        `SELECT * FROM user_sessions 
         WHERE id = $1 
         AND is_active = true 
         AND expires_at > CURRENT_TIMESTAMP`,
        [sessionId]
      );
      return result.rows.length > 0 ? new UserSession(result.rows[0]) : null;
    } catch (error) {
      console.error('Error finding session by ID:', error);
      throw error;
    }
  }

  // Find session by token
  static async findByToken(sessionToken) {
    try {
      const result = await query(
        `SELECT * FROM user_sessions 
         WHERE session_token = $1 
         AND is_active = true 
         AND expires_at > CURRENT_TIMESTAMP`,
        [sessionToken]
      );
      return result.rows.length > 0 ? new UserSession(result.rows[0]) : null;
    } catch (error) {
      console.error('Error finding session by token:', error);
      throw error;
    }
  }

  // Find active sessions for user
  static async findActiveByUserId(userId) {
    try {
      const result = await query(
        `SELECT * FROM user_sessions 
         WHERE user_id = $1 
         AND is_active = true 
         AND expires_at > CURRENT_TIMESTAMP
         ORDER BY created_at DESC`,
        [userId]
      );
      return result.rows.map(row => new UserSession(row));
    } catch (error) {
      console.error('Error finding active sessions for user:', error);
      throw error;
    }
  }

  // Invalidate session
  async invalidate() {
    try {
      const result = await query(
        'UPDATE user_sessions SET is_active = false WHERE id = $1 RETURNING *',
        [this.id]
      );
      if (result.rows.length > 0) {
        this.is_active = false;
      }
      return this;
    } catch (error) {
      console.error('Error invalidating session:', error);
      throw error;
    }
  }

  // Invalidate all sessions for user
  static async invalidateAllForUser(userId) {
    try {
      await query(
        'UPDATE user_sessions SET is_active = false WHERE user_id = $1',
        [userId]
      );
      return true;
    } catch (error) {
      console.error('Error invalidating all sessions for user:', error);
      throw error;
    }
  }

  // Extend session expiration
  async extend(hours = 24) {
    try {
      const newExpiresAt = new Date();
      newExpiresAt.setHours(newExpiresAt.getHours() + hours);

      const result = await query(
        'UPDATE user_sessions SET expires_at = $1 WHERE id = $2 RETURNING *',
        [newExpiresAt, this.id]
      );

      if (result.rows.length > 0) {
        this.expires_at = result.rows[0].expires_at;
      }
      return this;
    } catch (error) {
      console.error('Error extending session:', error);
      throw error;
    }
  }

  // Clean up expired sessions (static method for maintenance)
  static async cleanupExpired() {
    try {
      const result = await query(
        'DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP OR is_active = false'
      );
      console.log(`🧹 Cleaned up ${result.rowCount} expired sessions`);
      return result.rowCount;
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      throw error;
    }
  }

  // Check if session is valid
  isValid() {
    return this.is_active && new Date(this.expires_at) > new Date();
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      expires_at: this.expires_at,
      created_at: this.created_at,
      is_active: this.is_active
      // Note: session_token is intentionally excluded for security
    };
  }
}

module.exports = UserSession; 