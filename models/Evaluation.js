const { query, transaction } = require('../database/config');

class Evaluation {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.transcript_id = data.transcript_id;
    this.case_study_id = data.case_study_id;
    this.expected_level = data.expected_level;
    this.evaluation_results = data.evaluation_results;
    this.overall_approach_score = data.overall_approach_score;
    this.overall_considerations_score = data.overall_considerations_score;
    this.overall_score = data.overall_score;
    this.processing_duration_ms = data.processing_duration_ms;
    this.openai_model_used = data.openai_model_used;
    this.evaluation_prompt_tokens = data.evaluation_prompt_tokens;
    this.evaluation_completion_tokens = data.evaluation_completion_tokens;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create new evaluation with questions
  static async create(evaluationData, questionsData) {
    try {
      return await transaction(async (client) => {
        // Calculate overall scores
        const approachScores = questionsData.map(q => q.approach_score);
        const considerationScores = questionsData.map(q => q.key_considerations_score);
        
        const overallApproachScore = Math.round(
          approachScores.reduce((sum, score) => sum + score, 0) / approachScores.length
        );
        const overallConsiderationsScore = Math.round(
          considerationScores.reduce((sum, score) => sum + score, 0) / considerationScores.length
        );
        const overallScore = Math.round((overallApproachScore + overallConsiderationsScore) / 2);

        // Insert evaluation
        const evaluationResult = await client.query(
          `INSERT INTO evaluations 
           (user_id, transcript_id, case_study_id, expected_level, evaluation_results, 
            overall_approach_score, overall_considerations_score, overall_score, 
            processing_duration_ms, openai_model_used, evaluation_prompt_tokens, evaluation_completion_tokens)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING *`,
          [
            evaluationData.user_id,
            evaluationData.transcript_id,
            evaluationData.case_study_id,
            evaluationData.expected_level,
            JSON.stringify(evaluationData.evaluation_results),
            overallApproachScore,
            overallConsiderationsScore,
            overallScore,
            evaluationData.processing_duration_ms,
            evaluationData.openai_model_used || 'gpt-3.5-turbo',
            evaluationData.evaluation_prompt_tokens,
            evaluationData.evaluation_completion_tokens
          ]
        );

        const evaluation = new Evaluation(evaluationResult.rows[0]);

        // Insert evaluation questions
        for (let i = 0; i < questionsData.length; i++) {
          const question = questionsData[i];
          await client.query(
            `INSERT INTO evaluation_questions 
             (evaluation_id, question_index, question, candidate_answer, expert_answer,
              approach_evaluation, approach_score, key_considerations_evaluation, 
              key_considerations_score, feedback)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              evaluation.id,
              i,
              question.question,
              question.candidate_answer,
              question.expert_answer || '',
              question.approach_evaluation,
              question.approach_score,
              question.key_considerations_evaluation,
              question.key_considerations_score,
              question.feedback
            ]
          );
        }

        return evaluation;
      });
    } catch (error) {
      console.error('Error creating evaluation:', error);
      throw error;
    }
  }

  // Find evaluation by ID with questions
  static async findById(id) {
    try {
      const result = await query(
        `SELECT e.*, 
          cs.name as case_study_name, cs.key as case_study_key,
          t.original_filename, t.qa_pairs_count,
          u.name as user_name, u.email as user_email
         FROM evaluations e
         JOIN case_studies cs ON e.case_study_id = cs.id
         JOIN transcripts t ON e.transcript_id = t.id
         JOIN users u ON e.user_id = u.id
         WHERE e.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const evaluation = new Evaluation(result.rows[0]);
      evaluation.case_study_name = result.rows[0].case_study_name;
      evaluation.case_study_key = result.rows[0].case_study_key;
      evaluation.original_filename = result.rows[0].original_filename;
      evaluation.qa_pairs_count = result.rows[0].qa_pairs_count;
      evaluation.user_name = result.rows[0].user_name;
      evaluation.user_email = result.rows[0].user_email;

      // Get evaluation questions
      const questionsResult = await query(
        `SELECT * FROM evaluation_questions 
         WHERE evaluation_id = $1 
         ORDER BY question_index`,
        [id]
      );

      evaluation.questions = questionsResult.rows;
      return evaluation;
    } catch (error) {
      console.error('Error finding evaluation by ID:', error);
      throw error;
    }
  }

  // Find evaluations by user ID
  static async findByUserId(userId, limit = 50, offset = 0) {
    try {
      const result = await query(
        `SELECT e.*, 
          cs.name as case_study_name, cs.key as case_study_key,
          t.original_filename, t.qa_pairs_count
         FROM evaluations e
         JOIN case_studies cs ON e.case_study_id = cs.id
         JOIN transcripts t ON e.transcript_id = t.id
         WHERE e.user_id = $1
         ORDER BY e.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return result.rows.map(row => {
        const evaluation = new Evaluation(row);
        evaluation.case_study_name = row.case_study_name;
        evaluation.case_study_key = row.case_study_key;
        evaluation.original_filename = row.original_filename;
        evaluation.qa_pairs_count = row.qa_pairs_count;
        return evaluation;
      });
    } catch (error) {
      console.error('Error finding evaluations by user ID:', error);
      throw error;
    }
  }

  // Find evaluations by transcript ID
  static async findByTranscriptId(transcriptId) {
    try {
      const result = await query(
        `SELECT e.*, 
          cs.name as case_study_name, cs.key as case_study_key
         FROM evaluations e
         JOIN case_studies cs ON e.case_study_id = cs.id
         WHERE e.transcript_id = $1
         ORDER BY e.created_at DESC`,
        [transcriptId]
      );

      return result.rows.map(row => {
        const evaluation = new Evaluation(row);
        evaluation.case_study_name = row.case_study_name;
        evaluation.case_study_key = row.case_study_key;
        return evaluation;
      });
    } catch (error) {
      console.error('Error finding evaluations by transcript ID:', error);
      throw error;
    }
  }

  // Get user evaluation statistics
  static async getUserStatistics(userId) {
    try {
      const result = await query(
        `SELECT 
          COUNT(*) as total_evaluations,
          AVG(overall_score) as average_score,
          MAX(overall_score) as best_score,
          MIN(overall_score) as worst_score,
          COUNT(DISTINCT case_study_id) as unique_case_studies,
          COUNT(DISTINCT transcript_id) as unique_transcripts,
          expected_level,
          COUNT(*) as level_count
         FROM evaluations 
         WHERE user_id = $1
         GROUP BY expected_level
         ORDER BY expected_level`,
        [userId]
      );

      const overallResult = await query(
        `SELECT 
          COUNT(*) as total_evaluations,
          AVG(overall_score) as average_score,
          MAX(overall_score) as best_score,
          MIN(overall_score) as worst_score,
          COUNT(DISTINCT case_study_id) as unique_case_studies,
          COUNT(DISTINCT transcript_id) as unique_transcripts
         FROM evaluations 
         WHERE user_id = $1`,
        [userId]
      );

      return {
        overall: overallResult.rows[0] || {
          total_evaluations: 0,
          average_score: 0,
          best_score: 0,
          worst_score: 0,
          unique_case_studies: 0,
          unique_transcripts: 0
        },
        by_level: result.rows
      };
    } catch (error) {
      console.error('Error getting user evaluation statistics:', error);
      throw error;
    }
  }

  // Get evaluation results (parsed from JSON)
  getEvaluationResults() {
    try {
      return typeof this.evaluation_results === 'string' 
        ? JSON.parse(this.evaluation_results) 
        : this.evaluation_results;
    } catch (error) {
      console.error('Error parsing evaluation results:', error);
      return [];
    }
  }

  // Get questions with detailed information
  async getQuestions() {
    try {
      const result = await query(
        `SELECT * FROM evaluation_questions 
         WHERE evaluation_id = $1 
         ORDER BY question_index`,
        [this.id]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting evaluation questions:', error);
      throw error;
    }
  }

  // Delete evaluation and related data
  async delete() {
    try {
      await transaction(async (client) => {
        // Delete evaluation questions first
        await client.query(
          'DELETE FROM evaluation_questions WHERE evaluation_id = $1',
          [this.id]
        );
        
        // Delete evaluation
        await client.query(
          'DELETE FROM evaluations WHERE id = $1',
          [this.id]
        );
      });
      return true;
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      throw error;
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      transcript_id: this.transcript_id,
      case_study_id: this.case_study_id,
      expected_level: this.expected_level,
      evaluation_results: this.getEvaluationResults(),
      overall_approach_score: this.overall_approach_score,
      overall_considerations_score: this.overall_considerations_score,
      overall_score: this.overall_score,
      processing_duration_ms: this.processing_duration_ms,
      openai_model_used: this.openai_model_used,
      evaluation_prompt_tokens: this.evaluation_prompt_tokens,
      evaluation_completion_tokens: this.evaluation_completion_tokens,
      created_at: this.created_at,
      updated_at: this.updated_at,
      // Additional fields if loaded
      case_study_name: this.case_study_name,
      case_study_key: this.case_study_key,
      original_filename: this.original_filename,
      qa_pairs_count: this.qa_pairs_count,
      user_name: this.user_name,
      user_email: this.user_email,
      questions: this.questions
    };
  }

  // Convert to detailed JSON with all related data
  async toDetailedJSON() {
    const questions = await this.getQuestions();
    return {
      ...this.toJSON(),
      questions
    };
  }
}

module.exports = Evaluation; 