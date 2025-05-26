const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

// Database and models
const { initializeDatabase } = require('./database/config');
const User = require('./models/User');
const UserSession = require('./models/UserSession');
const Transcript = require('./models/Transcript');
const CaseStudy = require('./models/CaseStudy');
const Evaluation = require('./models/Evaluation');

// Services
const AuthService = require('./services/AuthService');

// Initialize Express app
const app = express();

// Add request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000);
  next();
});

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    console.log('🌐 CORS Origin check:', origin);
    
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [
          process.env.FRONTEND_URL || 'https://tech-interview-analyzer-frontend.onrender.com',
          'https://techanalyzer.onrender.com',
          'https://tech-interview-frontend.onrender.com',
          'https://tech-interview-analyzer.onrender.com',
          'https://techinterview.onrender.com'
        ] 
      : ['http://localhost:3000', 'http://localhost:3001'];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ CORS: No origin header, allowing request');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list or matches render.com pattern
    const isAllowed = allowedOrigins.includes(origin) || /\.render\.com$/.test(origin);
    
    if (isAllowed) {
      console.log('✅ CORS: Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS: Origin blocked:', origin);
      console.log('📋 Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Enhanced OpenAI initialization
console.log('=== STATEFUL SERVER INITIALIZATION ===');
console.log('Environment:', process.env.NODE_ENV);
console.log('Database URL present:', !!process.env.DATABASE_URL);
console.log('OpenAI API Key present:', !!process.env.OPENAI_API_KEY);
console.log('Google Client ID present:', !!process.env.GOOGLE_CLIENT_ID);
console.log('Encryption Key present:', !!process.env.ENCRYPTION_KEY);

// Fallback mode configuration
let USE_FALLBACK_MODE = !process.env.OPENAI_API_KEY || process.env.USE_FALLBACK === 'true';
const USE_EVALUATION_FALLBACK = process.env.USE_EVALUATION_FALLBACK === 'true';
const SIMPLIFIED_MODE = process.env.SIMPLIFIED_MODE === 'true';

console.log('Fallback mode enabled:', USE_FALLBACK_MODE);
console.log('Evaluation fallback mode enabled:', USE_EVALUATION_FALLBACK);
console.log('Simplified mode enabled:', SIMPLIFIED_MODE);

// Configure OpenAI
let openai;
if (!USE_FALLBACK_MODE) {
  try {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY
    });
    openai = new OpenAIApi(configuration);
    console.log('✅ OpenAI initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize OpenAI:', error);
    USE_FALLBACK_MODE = true;
  }
}

// Initialize database with retry logic
async function initializeDatabaseWithRetry(maxRetries = 5, delay = 10000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`🔄 Database initialization attempt ${i + 1}/${maxRetries}`);
      const dbInitialized = await initializeDatabase();
      if (dbInitialized) {
        console.log('✅ Database initialized successfully');
        
        // Schedule session cleanup every hour
        setInterval(async () => {
          try {
            await AuthService.cleanupExpiredSessions();
          } catch (error) {
            console.error('Session cleanup error:', error);
          }
        }, 60 * 60 * 1000); // 1 hour
        
        return true;
      }
    } catch (error) {
      console.error(`❌ Database initialization attempt ${i + 1} failed:`, error.message);
      if (i < maxRetries - 1) {
        console.log(`⏳ Waiting ${delay/1000} seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error('❌ Database initialization failed after all attempts');
  return false;
}

// Initialize database
initializeDatabaseWithRetry().catch(error => {
  console.error('❌ Critical database initialization error:', error);
  // Don't exit the process, let the server start anyway for debugging
});

console.log('==========================================');

// Basic root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Tech Interview Analyzer Backend API',
    server: 'STATEFUL_SERVER_NEW',
    version: '2.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// AUTH ROUTES
// Google OAuth login
app.post('/api/auth/google', async (req, res) => {
  try {
    console.log('🔐 Google OAuth login attempt');
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Google token required' });
    }
    
    const authResult = await AuthService.loginWithGoogle(token);
    
    return res.json(authResult);
  } catch (error) {
    console.error('❌ Google auth error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed',
      details: error.message 
    });
  }
});

// Verify token
app.get('/api/auth/verify', AuthService.authenticateToken(), async (req, res) => {
  try {
    // Get user statistics
    const stats = await req.user.getStatistics();
    
    return res.json({ 
      user: req.user,
      session: req.session,
      statistics: stats
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({ error: 'Failed to verify token' });
  }
});

// Refresh token
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }
    
    const refreshResult = await AuthService.refreshToken(token);
    return res.json(refreshResult);
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(401).json({ error: 'Failed to refresh token' });
  }
});

// Logout
app.post('/api/auth/logout', AuthService.authenticateToken(), async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    await AuthService.logout(token);
    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Failed to logout' });
  }
});

// PROTECTED API ROUTES
// 1. Upload and process transcript
app.post('/api/transcript', AuthService.authenticateToken(), upload.single('transcript'), async (req, res) => {
  console.log('=== TRANSCRIPT PROCESSING START ===');
  console.log('User:', req.user.email);
  console.log('File:', req.file ? req.file.originalname : 'No file');
  
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read file content
    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    console.log('📄 File read successfully, size:', fileContent.length);
    
    // Extract Q&A pairs using OpenAI
    console.log('🤖 Extracting Q&A pairs...');
    const qaPairs = await extractQAPairs(fileContent);
    console.log('✅ Q&A pairs extracted:', qaPairs.length);
    
    const processingDuration = Date.now() - startTime;
    
    // Save transcript to database (encrypted)
    console.log('💾 Saving transcript to database...');
    const transcript = await Transcript.create(
      req.user.id,
      req.file.originalname,
      fileContent,
      qaPairs,
      processingDuration
    );
    
    console.log('✅ Transcript saved with ID:', transcript.id);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    console.log('=== TRANSCRIPT PROCESSING SUCCESS ===');
    
    return res.json({
      transcript_id: transcript.id,
      transcript: fileContent,
      qa_pairs: qaPairs,
      processing_duration_ms: processingDuration
    });
  } catch (error) {
    console.error('=== TRANSCRIPT PROCESSING ERROR ===');
    console.error('Error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(500).json({ error: 'Failed to process transcript' });
  }
});

// 2. Get all case studies
app.get('/api/cases', AuthService.authenticateToken(), async (req, res) => {
  try {
    console.log('📚 Fetching case studies for user:', req.user.email);
    
    // Get case studies in legacy format for backward compatibility
    const caseStudies = await CaseStudy.getAllInLegacyFormat();
    
    return res.json(caseStudies);
  } catch (error) {
    console.error('Error fetching case studies:', error);
    return res.status(500).json({ error: 'Failed to fetch case studies' });
  }
});

// 3. Evaluate answers
app.post('/api/evaluate', AuthService.authenticateToken(), async (req, res) => {
  console.log('=== EVALUATION PROCESSING START ===');
  console.log('User:', req.user.email);
  
  const startTime = Date.now();
  
  try {
    const { qa_pairs, case_study_key, level, transcript_id } = req.body;
    
    if (!qa_pairs || !case_study_key || !level) {
      return res.status(400).json({ error: 'Missing required data' });
    }
    
    // Get case study from database
    const caseStudy = await CaseStudy.findByKey(case_study_key);
    if (!caseStudy) {
      return res.status(404).json({ error: 'Case study not found' });
    }
    
    console.log('📚 Case study found:', caseStudy.name);
    
    // Prepare expert solution
    const expertSolution = {
      process: caseStudy.getProcessAnswer(),
      considerations: caseStudy.getKeyConsiderationsAnswer()
    };
    
    // Evaluate the answers using OpenAI
    console.log('🤖 Evaluating answers...');
    const evaluationResults = await evaluateAnswers(qa_pairs, expertSolution, level);
    console.log('✅ Evaluation completed:', evaluationResults.length, 'questions');
    
    const processingDuration = Date.now() - startTime;
    
    // Save evaluation to database
    console.log('💾 Saving evaluation to database...');
    const evaluation = await Evaluation.create(
      {
        user_id: req.user.id,
        transcript_id: transcript_id,
        case_study_id: caseStudy.id,
        expected_level: level,
        evaluation_results: evaluationResults,
        processing_duration_ms: processingDuration,
        openai_model_used: 'gpt-3.5-turbo'
      },
      evaluationResults
    );
    
    console.log('✅ Evaluation saved with ID:', evaluation.id);
    console.log('=== EVALUATION PROCESSING SUCCESS ===');
    
    return res.json({ 
      evaluation_id: evaluation.id,
      evaluation_results: evaluationResults,
      processing_duration_ms: processingDuration
    });
  } catch (error) {
    console.error('=== EVALUATION PROCESSING ERROR ===');
    console.error('Error:', error);
    return res.status(500).json({ error: 'Failed to evaluate answers' });
  }
});

// 4. Get user's evaluation history
app.get('/api/evaluations', AuthService.authenticateToken(), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    console.log('📊 Fetching evaluations for user:', req.user.email);
    
    const evaluations = await Evaluation.findByUserId(req.user.id, limit, offset);
    const statistics = await Evaluation.getUserStatistics(req.user.id);
    
    return res.json({
      evaluations: evaluations.map(e => e.toJSON()),
      statistics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: statistics.overall.total_evaluations
      }
    });
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    return res.status(500).json({ error: 'Failed to fetch evaluations' });
  }
});

// 5. Get specific evaluation details
app.get('/api/evaluations/:id', AuthService.authenticateToken(), async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);
    
    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }
    
    // Check if user owns this evaluation
    if (evaluation.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const detailedEvaluation = await evaluation.toDetailedJSON();
    return res.json(detailedEvaluation);
  } catch (error) {
    console.error('Error fetching evaluation details:', error);
    return res.status(500).json({ error: 'Failed to fetch evaluation details' });
  }
});

// 6. Get user's transcripts
app.get('/api/transcripts', AuthService.authenticateToken(), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    console.log('📄 Fetching transcripts for user:', req.user.email);
    
    const transcripts = await Transcript.findByUserId(req.user.id, limit, offset);
    
    return res.json({
      transcripts: transcripts.map(t => t.toJSON()),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transcripts:', error);
    return res.status(500).json({ error: 'Failed to fetch transcripts' });
  }
});

// 7. Get specific transcript with evaluations
app.get('/api/transcripts/:id', AuthService.authenticateToken(), async (req, res) => {
  try {
    const transcript = await Transcript.findById(req.params.id);
    
    if (!transcript) {
      return res.status(404).json({ error: 'Transcript not found' });
    }
    
    // Check if user owns this transcript
    if (transcript.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const transcriptWithEvaluations = await transcript.getWithEvaluations();
    return res.json(transcriptWithEvaluations.toJSONWithContent());
  } catch (error) {
    console.error('Error fetching transcript details:', error);
    return res.status(500).json({ error: 'Failed to fetch transcript details' });
  }
});

// Helper functions (same as before but with enhanced logging)
async function extractQAPairs(transcript) {
  console.log('>>> extractQAPairs START <<<');
  
  try {
    if (USE_FALLBACK_MODE) {
      console.log('🔄 Using FALLBACK mode for Q&A extraction');
      return [
        {
          question: "¿Cómo es posible freimear o definir un marco de trabajo y de proceso para migrar aplicaciones a la nube?",
          answer: "Para definir un marco de migración a la nube es importante seguir varios pasos..."
        },
        {
          question: "¿Qué consideraciones técnicas son importantes en este proceso?",
          answer: "Las consideraciones técnicas incluyen seguridad, escalabilidad, costos..."
        }
      ];
    }
    
    // Process transcript
    const processedTranscript = transcript
      .replace(/\s+/g, ' ')
      .replace(/([^A]):/g, '\n$1:')
      .replace(/([^C]):/g, '\n$1:')
      .replace(/\n\s*\n/g, '\n')
      .trim();
    
    const prompt = `From the transcript below, extract a list of questions asked by the interviewer (marked with A:) and the candidate's corresponding answers (marked with C:).
    Format the response as a JSON array of objects with 'question' and 'answer' fields.
    The transcript might be in Spanish or English, please maintain the original language in the output.
    
    Transcript:
    ${processedTranscript}
    
    Example format:
    [
        {
            "question": "Could you describe a cloud migration strategy?",
            "answer": "Of course. To develop an effective migration strategy..."
        }
    ]`;
    
    const response = await Promise.race([
      openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant that extracts Q&A pairs from interview transcripts. Return ONLY valid JSON without markdown formatting." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI API timeout')), 60000)
      )
    ]);
    
    let content = response.data.choices[0].message.content.trim();
    
    // Clean markdown if present
    if (content.startsWith('```')) {
      content = content.replace(/```(?:json)?\n([\s\S]*?)```/g, '$1').trim();
    }
    
    const result = JSON.parse(content);
    console.log('✅ Q&A extraction successful:', result.length, 'pairs');
    return result;
  } catch (error) {
    console.error('❌ Q&A extraction failed:', error);
    throw error;
  }
}

async function evaluateAnswers(qaPairs, expertSolution, level) {
  console.log('>>> evaluateAnswers START <<<');
  
  try {
    if (USE_FALLBACK_MODE || USE_EVALUATION_FALLBACK) {
      console.log('🔄 Using FALLBACK mode for evaluation');
      return qaPairs.map((pair, index) => ({
        question: pair.question,
        expert_answer: "Mock expert answer for testing purposes",
        candidate_answer: pair.answer,
        approach_evaluation: index % 2 === 0 ? "High" : "Medium",
        key_considerations_evaluation: index % 3 === 0 ? "Correct" : "Partially Correct",
        feedback: "This is a mock evaluation for debugging purposes.",
        approach_score: index % 2 === 0 ? 100 : 66,
        key_considerations_score: index % 3 === 0 ? 100 : 66
      }));
    }
    
    const expectations = getLevelExpectations(level);
    
    const prompt = `As a senior tech architect evaluating a peer, analyze the following Q&A pairs from an architecture interview.
    The candidate is applying for a ${level} position.
    
    Evaluation rubric:
    ${expectations}
    
    For each answer, evaluate:
    1. Level of Completeness (High/Medium/Low)
    2. Level of Accuracy (Correct/Partially Correct/Incorrect)
    
    Expert solution to compare against:
    ${JSON.stringify(expertSolution, null, 2)}
    
    Q&A Pairs:
    ${JSON.stringify(qaPairs, null, 2)}
    
    IMPORTANT: Return ONLY a plain JSON array without any markdown formatting. Each object should have:
    - question: original question
    - expert_answer: summary of relevant expert solution
    - candidate_answer: original answer
    - approach_evaluation: High/Medium/Low
    - key_considerations_evaluation: Correct/Partially Correct/Incorrect
    - feedback: brief explanation`;
    
    const response = await Promise.race([
      openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a senior tech architect. Output ONLY valid JSON without markdown." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI evaluation timeout')), 90000)
      )
    ]);
    
    let content = response.data.choices[0].message.content.trim();
    
    // Clean markdown if present
    if (content.startsWith('```')) {
      content = content.replace(/```(?:json)?\n([\s\S]*?)```/g, '$1').trim();
    }
    
    const results = JSON.parse(content);
    
    // Add percentage scores
    results.forEach(result => {
      result.approach_score = mapApproachToPercentage(result.approach_evaluation);
      result.key_considerations_score = mapKeyConsiderationToPercentage(result.key_considerations_evaluation);
    });
    
    console.log('✅ Evaluation successful:', results.length, 'questions');
    return results;
  } catch (error) {
    console.error('❌ Evaluation failed:', error);
    throw error;
  }
}

function getLevelExpectations(level) {
  switch (level) {
    case "L1":
      return "L1 (Junior): Answers may be basic, incomplete, or lack structure. Some inaccuracies are acceptable.";
    case "L2":
      return "L2 (Intermediate): Answers should show some structure and understanding. Some missing details are acceptable.";
    case "L3":
      return "L3 (Senior): Answers should be mostly complete, structured, and accurate. Minor gaps are acceptable.";
    case "L4":
      return "L4 (Expert): Answers should be highly complete, well-structured, and highly accurate.";
    default:
      return "";
  }
}

function mapApproachToPercentage(value) {
  const mapping = { "High": 100, "Medium": 66, "Low": 33 };
  return mapping[value] || 0;
}

function mapKeyConsiderationToPercentage(value) {
  const mapping = { "Correct": 100, "Partially Correct": 66, "Incorrect": 0 };
  return mapping[value] || 0;
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    let dbStatus = 'unknown';
    try {
      const { query } = require('./database/config');
      await query('SELECT NOW()');
      dbStatus = 'connected';
    } catch (error) {
      dbStatus = 'disconnected';
    }
    
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    };
    
    res.status(200).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Debug endpoint
app.get('/api/debug/status', async (req, res) => {
  try {
    // Test database connection
    let dbStatus = 'unknown';
    let dbError = null;
    try {
      const { query } = require('./database/config');
      await query('SELECT NOW()');
      dbStatus = 'connected';
    } catch (error) {
      dbStatus = 'disconnected';
      dbError = error.message;
    }
    
    const status = {
      server_type: 'STATEFUL_SERVER_NEW',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database_connected: dbStatus === 'connected',
      database_error: dbError,
      fallback_mode: USE_FALLBACK_MODE,
      evaluation_fallback: USE_EVALUATION_FALLBACK,
      simplified_mode: SIMPLIFIED_MODE,
      openai_available: !!openai,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      node_version: process.version,
      google_oauth_configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      database_url_configured: !!process.env.DATABASE_URL,
      jwt_secret_configured: !!process.env.JWT_SECRET,
      encryption_key_configured: !!process.env.ENCRYPTION_KEY,
      port: process.env.PORT || 5000
    };
    
    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Server identification endpoint
app.get('/api/server-info', (req, res) => {
  res.json({
    server: 'STATEFUL_SERVER_NEW',
    version: '2.0.0',
    features: ['google_oauth', 'postgresql', 'encryption', 'sessions'],
    status: 'active'
  });
});

// Ensure uploads directory exists
try {
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
    console.log('✅ Created uploads directory');
  }
} catch (error) {
  console.error('⚠️  Could not create uploads directory:', error.message);
}

// Start server
const PORT = process.env.PORT || 5000;

try {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Stateful server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  Database: PostgreSQL`);
    console.log(`🔐 Authentication: Google OAuth + Sessions`);
    console.log(`🔒 Encryption: AES-256-GCM`);
    console.log(`🌐 Server listening on 0.0.0.0:${PORT}`);
    
    if (USE_FALLBACK_MODE) {
      console.log('⚠️  Running in fallback mode (no OpenAI)');
    }
    
    console.log('✅ Server started successfully');
  });

  server.on('error', (error) => {
    console.error('❌ Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`);
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🔄 SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('🔄 SIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
} 