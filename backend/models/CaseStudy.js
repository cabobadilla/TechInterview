const { query } = require('../database/config');

class CaseStudy {
  constructor(data) {
    this.id = data.id;
    this.key = data.key;
    this.type = data.type;
    this.name = data.name;
    this.objective = data.objective;
    this.process_answer = Array.isArray(data.process_answer) ? data.process_answer : JSON.parse(data.process_answer || '[]');
    this.key_considerations_answer = Array.isArray(data.key_considerations_answer) ? data.key_considerations_answer : JSON.parse(data.key_considerations_answer || '[]');
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.is_active = data.is_active;
  }

  // Get all case studies
  static async findAll() {
    try {
      console.log('🔍 Fetching all case studies from database...');
      const result = await query(
        'SELECT * FROM case_studies ORDER BY created_at ASC'
      );
      
      console.log(`✅ Found ${result.rows.length} case studies in database`);
      return result.rows.map(row => new CaseStudy(row));
    } catch (error) {
      console.error('❌ Error fetching case studies:', error);
      throw error;
    }
  }

  // Find case study by key
  static async findByKey(key) {
    try {
      console.log(`🔍 Fetching case study with key: ${key}`);
      const result = await query(
        'SELECT * FROM case_studies WHERE key = $1',
        [key]
      );
      
      if (result.rows.length === 0) {
        console.log(`❌ Case study not found: ${key}`);
        return null;
      }
      
      console.log(`✅ Found case study: ${key}`);
      return new CaseStudy(result.rows[0]);
    } catch (error) {
      console.error('❌ Error fetching case study by key:', error);
      throw error;
    }
  }

  // Find case study by ID
  static async findById(id) {
    try {
      const result = await query(
        'SELECT * FROM case_studies WHERE id = $1',
        [id]
      );
      return result.rows.length > 0 ? new CaseStudy(result.rows[0]) : null;
    } catch (error) {
      console.error('Error finding case study by ID:', error);
      throw error;
    }
  }

  // Create new case study
  static async create(data) {
    try {
      console.log(`📝 Creating case study: ${data.key}`);
      const result = await query(
        `INSERT INTO case_studies (key, type, name, objective, process_answer, key_considerations_answer)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          data.key,
          data.type,
          data.name,
          data.objective,
          JSON.stringify(data.process_answer),
          JSON.stringify(data.key_considerations_answer)
        ]
      );
      
      console.log(`✅ Case study created: ${data.key}`);
      return new CaseStudy(result.rows[0]);
    } catch (error) {
      console.error('❌ Error creating case study:', error);
      throw error;
    }
  }

  // Update existing case study
  static async update(key, data) {
    try {
      console.log(`📝 Updating case study: ${key}`);
      const result = await query(
        `UPDATE case_studies 
         SET type = $2, name = $3, objective = $4, process_answer = $5, key_considerations_answer = $6
         WHERE key = $1
         RETURNING *`,
        [
          key,
          data.type,
          data.name,
          data.objective,
          JSON.stringify(data.process_answer),
          JSON.stringify(data.key_considerations_answer)
        ]
      );
      
      if (result.rows.length === 0) {
        console.log(`❌ Case study not found for update: ${key}`);
        return null;
      }
      
      console.log(`✅ Case study updated: ${key}`);
      return new CaseStudy(result.rows[0]);
    } catch (error) {
      console.error('❌ Error updating case study:', error);
      throw error;
    }
  }

  // Delete case study
  static async delete(key) {
    try {
      console.log(`🗑️ Deleting case study: ${key}`);
      const result = await query(
        'DELETE FROM case_studies WHERE key = $1 RETURNING *',
        [key]
      );
      
      if (result.rows.length === 0) {
        console.log(`❌ Case study not found for deletion: ${key}`);
        return false;
      }
      
      console.log(`✅ Case study deleted: ${key}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting case study:', error);
      throw error;
    }
  }

  // Deactivate case study (soft delete)
  async deactivate() {
    try {
      const result = await query(
        'UPDATE case_studies SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [this.id]
      );
      if (result.rows.length > 0) {
        this.is_active = false;
        this.updated_at = result.rows[0].updated_at;
      }
      return this;
    } catch (error) {
      console.error('Error deactivating case study:', error);
      throw error;
    }
  }

  // Get case study statistics
  async getStatistics() {
    try {
      const result = await query(
        `SELECT 
          COUNT(e.id) as total_evaluations,
          AVG(e.overall_score) as average_score,
          COUNT(DISTINCT e.user_id) as unique_users,
          MAX(e.created_at) as last_evaluation_date
         FROM case_studies cs
         LEFT JOIN evaluations e ON cs.id = e.case_study_id
         WHERE cs.id = $1
         GROUP BY cs.id`,
        [this.id]
      );

      return result.rows.length > 0 ? {
        total_evaluations: parseInt(result.rows[0].total_evaluations) || 0,
        average_score: parseFloat(result.rows[0].average_score) || 0,
        unique_users: parseInt(result.rows[0].unique_users) || 0,
        last_evaluation_date: result.rows[0].last_evaluation_date
      } : {
        total_evaluations: 0,
        average_score: 0,
        unique_users: 0,
        last_evaluation_date: null
      };
    } catch (error) {
      console.error('Error getting case study statistics:', error);
      throw error;
    }
  }

  // Convert to JSON format (compatible with frontend)
  toJSON() {
    return {
      id: this.id,
      key: this.key,
      type: this.type,
      name: this.name,
      objective: this.objective,
      process_answer: this.process_answer,
      key_considerations_answer: this.key_considerations_answer,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Convert to frontend format (same as original JSON structure)
  toFrontendFormat() {
    return {
      type: this.type,
      name: this.name,
      objective: this.objective,
      process_answer: this.process_answer,
      key_considerations_answer: this.key_considerations_answer
    };
  }

  // Convert all case studies to frontend format
  static async getAllForFrontend() {
    try {
      const caseStudies = await CaseStudy.findAll();
      const result = {};
      
      caseStudies.forEach(caseStudy => {
        result[caseStudy.key] = caseStudy.toFrontendFormat();
      });
      
      console.log(`✅ Converted ${caseStudies.length} case studies to frontend format`);
      return result;
    } catch (error) {
      console.error('❌ Error converting case studies to frontend format:', error);
      throw error;
    }
  }
}

module.exports = CaseStudy; 