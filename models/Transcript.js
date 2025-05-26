const { query, transaction } = require('../database/config');
const crypto = require('crypto');

class Transcript {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.original_filename = data.original_filename;
    this.encrypted_content = data.encrypted_content;
    this.content_hash = data.content_hash;
    this.file_size = data.file_size;
    this.qa_pairs = data.qa_pairs;
    this.qa_pairs_count = data.qa_pairs_count;
    this.processing_duration_ms = data.processing_duration_ms;
    this.created_at = data.created_at;
  }

  // Encryption/Decryption utilities
  static getEncryptionKey() {
    const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    return crypto.createHash('sha256').update(key).digest();
  }

  static encryptContent(content) {
    try {
      const algorithm = 'aes-256-gcm';
      const key = Transcript.getEncryptionKey();
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipher(algorithm, key);
      cipher.setAAD(Buffer.from('transcript-data'));
      
      let encrypted = cipher.update(content, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Combine IV, authTag, and encrypted content
      const result = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
      return result;
    } catch (error) {
      console.error('Error encrypting content:', error);
      throw new Error('Failed to encrypt content');
    }
  }

  static decryptContent(encryptedData) {
    try {
      const algorithm = 'aes-256-gcm';
      const key = Transcript.getEncryptionKey();
      
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const decipher = crypto.createDecipher(algorithm, key);
      decipher.setAAD(Buffer.from('transcript-data'));
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Error decrypting content:', error);
      throw new Error('Failed to decrypt content');
    }
  }

  static generateContentHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  // Create new transcript
  static async create(userId, filename, content, qaPairs, processingDuration = null) {
    try {
      const encryptedContent = Transcript.encryptContent(content);
      const contentHash = Transcript.generateContentHash(content);
      const fileSize = Buffer.byteLength(content, 'utf8');

      const result = await query(
        `INSERT INTO transcripts 
         (user_id, original_filename, encrypted_content, content_hash, file_size, qa_pairs, qa_pairs_count, processing_duration_ms)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          userId,
          filename,
          encryptedContent,
          contentHash,
          fileSize,
          JSON.stringify(qaPairs),
          qaPairs.length,
          processingDuration
        ]
      );

      return new Transcript(result.rows[0]);
    } catch (error) {
      console.error('Error creating transcript:', error);
      throw error;
    }
  }

  // Find transcript by ID
  static async findById(id) {
    try {
      const result = await query(
        'SELECT * FROM transcripts WHERE id = $1',
        [id]
      );
      return result.rows.length > 0 ? new Transcript(result.rows[0]) : null;
    } catch (error) {
      console.error('Error finding transcript by ID:', error);
      throw error;
    }
  }

  // Find transcripts by user ID
  static async findByUserId(userId, limit = 50, offset = 0) {
    try {
      const result = await query(
        `SELECT * FROM transcripts 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      return result.rows.map(row => new Transcript(row));
    } catch (error) {
      console.error('Error finding transcripts by user ID:', error);
      throw error;
    }
  }

  // Get transcript content (decrypted)
  getDecryptedContent() {
    try {
      return Transcript.decryptContent(this.encrypted_content);
    } catch (error) {
      console.error('Error decrypting transcript content:', error);
      throw error;
    }
  }

  // Verify content integrity
  verifyIntegrity() {
    try {
      const decryptedContent = this.getDecryptedContent();
      const currentHash = Transcript.generateContentHash(decryptedContent);
      return currentHash === this.content_hash;
    } catch (error) {
      console.error('Error verifying transcript integrity:', error);
      return false;
    }
  }

  // Get QA pairs (parsed from JSON)
  getQAPairs() {
    try {
      return typeof this.qa_pairs === 'string' ? JSON.parse(this.qa_pairs) : this.qa_pairs;
    } catch (error) {
      console.error('Error parsing QA pairs:', error);
      return [];
    }
  }

  // Get transcript with evaluations
  async getWithEvaluations() {
    try {
      const result = await query(
        `SELECT 
          t.*,
          e.id as evaluation_id,
          e.expected_level,
          e.overall_score,
          e.created_at as evaluation_date,
          cs.name as case_study_name
         FROM transcripts t
         LEFT JOIN evaluations e ON t.id = e.transcript_id
         LEFT JOIN case_studies cs ON e.case_study_id = cs.id
         WHERE t.id = $1
         ORDER BY e.created_at DESC`,
        [this.id]
      );

      const transcript = result.rows.length > 0 ? new Transcript(result.rows[0]) : null;
      if (transcript) {
        transcript.evaluations = result.rows
          .filter(row => row.evaluation_id)
          .map(row => ({
            id: row.evaluation_id,
            expected_level: row.expected_level,
            overall_score: row.overall_score,
            evaluation_date: row.evaluation_date,
            case_study_name: row.case_study_name
          }));
      }
      return transcript;
    } catch (error) {
      console.error('Error getting transcript with evaluations:', error);
      throw error;
    }
  }

  // Delete transcript and related data
  async delete() {
    try {
      await transaction(async (client) => {
        // Delete evaluation questions first
        await client.query(
          'DELETE FROM evaluation_questions WHERE evaluation_id IN (SELECT id FROM evaluations WHERE transcript_id = $1)',
          [this.id]
        );
        
        // Delete evaluations
        await client.query(
          'DELETE FROM evaluations WHERE transcript_id = $1',
          [this.id]
        );
        
        // Delete transcript
        await client.query(
          'DELETE FROM transcripts WHERE id = $1',
          [this.id]
        );
      });
      return true;
    } catch (error) {
      console.error('Error deleting transcript:', error);
      throw error;
    }
  }

  // Convert to JSON (exclude encrypted content for security)
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      original_filename: this.original_filename,
      content_hash: this.content_hash,
      file_size: this.file_size,
      qa_pairs: this.getQAPairs(),
      qa_pairs_count: this.qa_pairs_count,
      processing_duration_ms: this.processing_duration_ms,
      created_at: this.created_at
      // encrypted_content is intentionally excluded
    };
  }

  // Convert to JSON with content (for authorized access)
  toJSONWithContent() {
    return {
      ...this.toJSON(),
      content: this.getDecryptedContent()
    };
  }
}

module.exports = Transcript; 