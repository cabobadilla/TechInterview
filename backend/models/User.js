const { query, transaction } = require('../database/config');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

class User {
  constructor(data) {
    this.id = data.id;
    this.google_id = data.google_id;
    this.email = data.email;
    this.name = data.name;
    this.picture_url = data.picture_url;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.last_login = data.last_login;
  }

  // Find user by Google ID
  static async findByGoogleId(googleId) {
    try {
      const result = await query(
        'SELECT * FROM users WHERE google_id = $1',
        [googleId]
      );
      return result.rows.length > 0 ? new User(result.rows[0]) : null;
    } catch (error) {
      console.error('Error finding user by Google ID:', error);
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const result = await query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      return result.rows.length > 0 ? new User(result.rows[0]) : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const result = await query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      return result.rows.length > 0 ? new User(result.rows[0]) : null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // Create new user from Google OAuth
  static async createFromGoogle(googleProfile) {
    try {
      const result = await query(
        `INSERT INTO users (google_id, email, name, picture_url, last_login)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          googleProfile.sub || googleProfile.id,
          googleProfile.email,
          googleProfile.name,
          googleProfile.picture
        ]
      );
      return new User(result.rows[0]);
    } catch (error) {
      console.error('Error creating user from Google:', error);
      throw error;
    }
  }

  // Update last login
  async updateLastLogin() {
    try {
      const result = await query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [this.id]
      );
      if (result.rows.length > 0) {
        this.last_login = result.rows[0].last_login;
      }
      return this;
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(updates) {
    try {
      const setClause = [];
      const values = [];
      let paramIndex = 1;

      if (updates.name) {
        setClause.push(`name = $${paramIndex++}`);
        values.push(updates.name);
      }
      if (updates.picture_url) {
        setClause.push(`picture_url = $${paramIndex++}`);
        values.push(updates.picture_url);
      }

      if (setClause.length === 0) {
        return this;
      }

      values.push(this.id);
      const result = await query(
        `UPDATE users SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      if (result.rows.length > 0) {
        Object.assign(this, result.rows[0]);
      }
      return this;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Get user statistics
  async getStatistics() {
    try {
      const result = await query(
        `SELECT 
          COUNT(DISTINCT t.id) as total_transcripts,
          COUNT(DISTINCT e.id) as total_evaluations,
          AVG(e.overall_score) as average_score,
          MAX(e.created_at) as last_evaluation_date
         FROM users u
         LEFT JOIN transcripts t ON u.id = t.user_id
         LEFT JOIN evaluations e ON u.id = e.user_id
         WHERE u.id = $1
         GROUP BY u.id`,
        [this.id]
      );

      return result.rows.length > 0 ? {
        total_transcripts: parseInt(result.rows[0].total_transcripts) || 0,
        total_evaluations: parseInt(result.rows[0].total_evaluations) || 0,
        average_score: parseFloat(result.rows[0].average_score) || 0,
        last_evaluation_date: result.rows[0].last_evaluation_date
      } : {
        total_transcripts: 0,
        total_evaluations: 0,
        average_score: 0,
        last_evaluation_date: null
      };
    } catch (error) {
      console.error('Error getting user statistics:', error);
      throw error;
    }
  }

  // Convert to JSON (remove sensitive data)
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      picture_url: this.picture_url,
      created_at: this.created_at,
      last_login: this.last_login
    };
  }
}

module.exports = User; 