const { query } = require('../database/config');

class CaseStudy {
  constructor(data) {
    this.id = data.id;
    this.key = data.key;
    this.name = data.name;
    this.objective = data.objective;
    this.process_answer = data.process_answer;
    this.key_considerations_answer = data.key_considerations_answer;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.is_active = data.is_active;
  }

  // Find all active case studies
  static async findAll() {
    try {
      const result = await query(
        'SELECT * FROM case_studies WHERE is_active = true ORDER BY name'
      );
      return result.rows.map(row => new CaseStudy(row));
    } catch (error) {
      console.error('Error finding all case studies:', error);
      throw error;
    }
  }

  // Find case study by key
  static async findByKey(key) {
    try {
      const result = await query(
        'SELECT * FROM case_studies WHERE key = $1 AND is_active = true',
        [key]
      );
      return result.rows.length > 0 ? new CaseStudy(result.rows[0]) : null;
    } catch (error) {
      console.error('Error finding case study by key:', error);
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
      const result = await query(
        `INSERT INTO case_studies (key, name, objective, process_answer, key_considerations_answer)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          data.key,
          data.name,
          data.objective,
          JSON.stringify(data.process_answer),
          JSON.stringify(data.key_considerations_answer)
        ]
      );
      return new CaseStudy(result.rows[0]);
    } catch (error) {
      console.error('Error creating case study:', error);
      throw error;
    }
  }

  // Update case study
  async update(updates) {
    try {
      const setClause = [];
      const values = [];
      let paramIndex = 1;

      if (updates.name) {
        setClause.push(`name = $${paramIndex++}`);
        values.push(updates.name);
      }
      if (updates.objective) {
        setClause.push(`objective = $${paramIndex++}`);
        values.push(updates.objective);
      }
      if (updates.process_answer) {
        setClause.push(`process_answer = $${paramIndex++}`);
        values.push(JSON.stringify(updates.process_answer));
      }
      if (updates.key_considerations_answer) {
        setClause.push(`key_considerations_answer = $${paramIndex++}`);
        values.push(JSON.stringify(updates.key_considerations_answer));
      }

      if (setClause.length === 0) {
        return this;
      }

      values.push(this.id);
      const result = await query(
        `UPDATE case_studies SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      if (result.rows.length > 0) {
        Object.assign(this, result.rows[0]);
      }
      return this;
    } catch (error) {
      console.error('Error updating case study:', error);
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

  // Get process answer as array
  getProcessAnswer() {
    try {
      return typeof this.process_answer === 'string' 
        ? JSON.parse(this.process_answer) 
        : this.process_answer;
    } catch (error) {
      console.error('Error parsing process answer:', error);
      return [];
    }
  }

  // Get key considerations as array
  getKeyConsiderationsAnswer() {
    try {
      return typeof this.key_considerations_answer === 'string' 
        ? JSON.parse(this.key_considerations_answer) 
        : this.key_considerations_answer;
    } catch (error) {
      console.error('Error parsing key considerations answer:', error);
      return [];
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      key: this.key,
      name: this.name,
      objective: this.objective,
      process_answer: this.getProcessAnswer(),
      key_considerations_answer: this.getKeyConsiderationsAnswer(),
      created_at: this.created_at,
      updated_at: this.updated_at,
      is_active: this.is_active
    };
  }

  // Convert to legacy format (for backward compatibility)
  toLegacyFormat() {
    return {
      [this.key]: {
        name: this.name,
        objective: this.objective,
        process_answer: this.getProcessAnswer(),
        key_considerations_answer: this.getKeyConsiderationsAnswer()
      }
    };
  }

  // Convert all case studies to legacy format
  static async getAllInLegacyFormat() {
    try {
      const caseStudies = await CaseStudy.findAll();
      const legacyFormat = {};
      
      caseStudies.forEach(caseStudy => {
        legacyFormat[caseStudy.key] = {
          name: caseStudy.name,
          objective: caseStudy.objective,
          process_answer: caseStudy.getProcessAnswer(),
          key_considerations_answer: caseStudy.getKeyConsiderationsAnswer()
        };
      });
      
      return legacyFormat;
    } catch (error) {
      console.error('Error getting case studies in legacy format:', error);
      throw error;
    }
  }
}

module.exports = CaseStudy; 