const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Configuration, OpenAIApi } = require('openai');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Initialize Express app
const app = express();

// Add request timeout middleware
app.use((req, res, next) => {
  // Set timeout for all requests (5 minutes for transcript processing)
  req.setTimeout(300000);
  res.setTimeout(300000);
  next();
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://techanalyzer.onrender.com', /\.render\.com$/] 
    : 'http://localhost:3000',
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

// Enhanced OpenAI initialization with debugging
console.log('=== OPENAI INITIALIZATION ===');
console.log('Environment:', process.env.NODE_ENV);
console.log('OpenAI API Key present:', !!process.env.OPENAI_API_KEY);
console.log('OpenAI API Key length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);

// Check for simplified mode
const SIMPLIFIED_MODE = process.env.SIMPLIFIED_MODE === 'true';
console.log('Simplified mode enabled:', SIMPLIFIED_MODE);

if (SIMPLIFIED_MODE) {
  console.log('Inicializando OpenAI API en modo simplificado');
} else {
  console.log('Inicializando OpenAI API en modo completo');
}

// Fallback mode configuration
let USE_FALLBACK_MODE = !process.env.OPENAI_API_KEY || process.env.USE_FALLBACK === 'true';
console.log('Fallback mode enabled:', USE_FALLBACK_MODE);

// Evaluation fallback mode (can be separate from extraction fallback)
const USE_EVALUATION_FALLBACK = process.env.USE_EVALUATION_FALLBACK === 'true';
console.log('Evaluation fallback mode enabled:', USE_EVALUATION_FALLBACK);

// Configure OpenAI with better error handling
let openai;
if (!USE_FALLBACK_MODE) {
  try {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY
    });
    openai = new OpenAIApi(configuration);
    console.log('OpenAI initialized successfully');
  } catch (error) {
    console.error('CRITICAL: Failed to initialize OpenAI:', error);
    console.log('Switching to fallback mode');
    USE_FALLBACK_MODE = true;
  }
} else {
  console.log('Initializing in fallback mode (no OpenAI)');
}

// Test OpenAI connection on startup in production
if (process.env.NODE_ENV === 'production' && !USE_FALLBACK_MODE) {
  console.log('Testing OpenAI connection...');
  (async () => {
    try {
      const testResponse = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Test connection" }],
        max_tokens: 5
      });
      console.log('OpenAI connection test successful');
    } catch (error) {
      console.error('CRITICAL: OpenAI connection test failed:', error);
      console.error('OpenAI Error details:', error.response?.data || error.message);
    }
  })();
} else {
  console.log('Skipping OpenAI connection test');
}

console.log('===============================');

// Load case studies from JSON file
const caseStudies = require('./case_studies.json');

// Authentication middleware
const authenticateToken = (req, res, next) => {
  // For preflight OPTIONS requests, just return OK
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    // Verify token with secret
    const user = jwt.verify(token, process.env.JWT_SECRET || 'your-default-secret-key');
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// AUTH ROUTES
// Google OAuth login
app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    // In a real implementation, we would verify the Google token
    // For this example, we'll mock the verification
    
    // Mock user data (in real implementation, this would come from Google)
    const userData = {
      id: '12345',
      email: 'user@example.com',
      name: 'Test User',
      picture: 'https://example.com/profile.jpg'
    };
    
    // Create JWT token
    const jwtToken = jwt.sign(
      userData,
      process.env.JWT_SECRET || 'your-default-secret-key',
      { expiresIn: '24h' }
    );
    
    return res.json({
      token: jwtToken,
      user: userData
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

// Verify token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  // The authenticateToken middleware already verified the token
  // and added the user data to req.user
  return res.json({ user: req.user });
});

// PROTECTED API ROUTES
// 1. Upload and process transcript
app.post('/api/transcript', authenticateToken, upload.single('transcript'), async (req, res) => {
  console.log('=== TRANSCRIPT PROCESSING START ===');
  console.log('Request received at:', new Date().toISOString());
  console.log('File info:', req.file ? {
    originalname: req.file.originalname,
    filename: req.file.filename,
    size: req.file.size,
    path: req.file.path
  } : 'No file');
  
  try {
    if (!req.file) {
      console.log('ERROR: No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Step 1: Starting file read...');
    const util = require('util');
    const readFile = util.promisify(fs.readFile);
    
    console.log('Step 2: Reading file buffer...');
    // Read the file with proper encoding
    const fileBuffer = await readFile(req.file.path);
    console.log('Step 3: Converting buffer to string, size:', fileBuffer.length);
    const transcript = fileBuffer.toString('utf-8');
    console.log('Step 4: Transcript length:', transcript.length, 'Preview:', transcript.substring(0, 200));
    
    console.log('Step 5: Calling extractQAPairs...');
    // Extract Q&A pairs using OpenAI
    const qa_pairs = await extractQAPairs(transcript);
    console.log('Step 6: extractQAPairs completed successfully, pairs count:', qa_pairs ? qa_pairs.length : 'null');
    
    console.log('Step 7: Sending response...');
    console.log('Response data preview:', {
      transcriptLength: transcript.length,
      qaPairsCount: qa_pairs.length,
      firstQuestionPreview: qa_pairs[0]?.question?.substring(0, 50) + '...'
    });
    
    const responseData = { transcript, qa_pairs };
    console.log('Step 8: Response object created, sending JSON...');
    
    const result = res.json(responseData);
    console.log('Step 9: res.json() called, result:', typeof result);
    console.log('=== TRANSCRIPT PROCESSING SUCCESS ===');
    return result;
  } catch (error) {
    console.error('=== TRANSCRIPT PROCESSING ERROR ===');
    console.error('Error at:', new Date().toISOString());
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    console.error('====================================');
    return res.status(500).json({ error: 'Failed to process transcript' });
  }
});

// 2. Get all case studies
app.get('/api/cases', authenticateToken, (req, res) => {
  return res.json(caseStudies);
});

// 3. Evaluate answers
app.post('/api/evaluate', authenticateToken, async (req, res) => {
  console.log('=== EVALUATION PROCESSING START ===');
  console.log('Request received at:', new Date().toISOString());
  console.log('Request body structure:', {
    hasQaPairs: !!req.body.qa_pairs,
    qaPairsCount: req.body.qa_pairs ? req.body.qa_pairs.length : 0,
    caseStudyKey: req.body.case_study_key,
    level: req.body.level
  });
  
  try {
    const { qa_pairs, case_study_key, level } = req.body;
    
    console.log('Step 1: Validating input data...');
    if (!qa_pairs || !case_study_key || !caseStudies[case_study_key]) {
      console.log('ERROR: Missing required data');
      console.log('Validation details:', {
        hasQaPairs: !!qa_pairs,
        hasCaseStudyKey: !!case_study_key,
        caseStudyExists: !!caseStudies[case_study_key]
      });
      return res.status(400).json({ error: 'Missing required data' });
    }
    
    console.log('Step 2: Input validation passed');
    console.log('Step 3: Preparing expert solution...');
    const case_study = caseStudies[case_study_key];
    const expert_solution = {
      process: case_study.process_answer,
      considerations: case_study.key_considerations_answer
    };
    console.log('Step 4: Expert solution prepared');
    
    console.log('Step 5: Calling evaluateAnswers...');
    // Evaluate the answers using OpenAI
    const evaluation_results = await evaluateAnswers(qa_pairs, expert_solution, level);
    console.log('Step 6: evaluateAnswers completed successfully, results count:', evaluation_results ? evaluation_results.length : 'null');
    
    console.log('Step 7: Sending evaluation response...');
    console.log('Response data preview:', {
      resultsCount: evaluation_results.length,
      firstResultPreview: evaluation_results[0] ? {
        hasQuestion: !!evaluation_results[0].question,
        hasApproachEval: !!evaluation_results[0].approach_evaluation,
        hasConsiderationsEval: !!evaluation_results[0].key_considerations_evaluation,
        hasScores: !!(evaluation_results[0].approach_score && evaluation_results[0].key_considerations_score)
      } : 'No first result'
    });
    
    const responseData = { evaluation_results };
    console.log('Step 8: Response object created, sending JSON...');
    
    const result = res.json(responseData);
    console.log('Step 9: res.json() called, result:', typeof result);
    console.log('=== EVALUATION PROCESSING SUCCESS ===');
    return result;
  } catch (error) {
    console.error('=== EVALUATION PROCESSING ERROR ===');
    console.error('Error at:', new Date().toISOString());
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    console.error('====================================');
    return res.status(500).json({ error: 'Failed to evaluate answers' });
  }
});

// Helper functions
async function extractQAPairs(transcript) {
  console.log('>>> extractQAPairs START <<<');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Input transcript length:', transcript.length);
  console.log('Fallback mode:', USE_FALLBACK_MODE);
  
  try {
    if (USE_FALLBACK_MODE) {
      console.log('Using FALLBACK mode - generating mock Q&A pairs');
      
      // Create mock Q&A pairs for debugging
      const mockQAPairs = [
        {
          question: "¿Cómo es posible freimear o definir un marco de trabajo y de proceso para migrar aplicaciones a la nube?",
          answer: "Para definir un marco de migración a la nube es importante seguir varios pasos..."
        },
        {
          question: "¿Qué consideraciones técnicas son importantes en este proceso?",
          answer: "Las consideraciones técnicas incluyen seguridad, escalabilidad, costos..."
        }
      ];
      
      console.log('Generated mock Q&A pairs:', mockQAPairs.length);
      console.log('>>> extractQAPairs SUCCESS (FALLBACK) <<<');
      return mockQAPairs;
    }
    
    console.log('Step A: Starting transcript preprocessing...');
    // Preprocess transcript
    const processedTranscript = transcript
      .replace(/\s+/g, ' ')
      .replace(/([^A]):/g, '\n$1:')
      .replace(/([^C]):/g, '\n$1:')
      .replace(/\n\s*\n/g, '\n')
      .trim();
    
    console.log('Step B: Preprocessing completed');
    console.log('Processed transcript length:', processedTranscript.length);
    console.log('Processed preview (first 300 chars):', processedTranscript.substring(0, 300));
    
    console.log('Step C: Building OpenAI prompt...');
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
    
    console.log('Step D: Prompt built, length:', prompt.length);
    console.log('Step E: About to call OpenAI API...');
    console.log('OpenAI config check - API Key exists:', !!process.env.OPENAI_API_KEY);
    console.log('OpenAI config check - API Key length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
    
    // Add timeout and more detailed logging for OpenAI call
    const startTime = Date.now();
    console.log('Step F: Making OpenAI API call at:', new Date().toISOString());
    
    const response = await Promise.race([
      openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant that extracts Q&A pairs from interview transcripts. Maintain the original language of the transcript and preserve the exact wording. Return ONLY valid JSON without markdown formatting." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI API call timeout after 60 seconds')), 60000)
      )
    ]);
    
    const apiCallDuration = Date.now() - startTime;
    console.log('Step G: OpenAI API call completed in', apiCallDuration, 'ms');
    console.log('Step H: Processing OpenAI response...');
    console.log('Response status:', response.status);
    console.log('Response data structure:', {
      hasChoices: !!response.data.choices,
      choicesLength: response.data.choices ? response.data.choices.length : 0,
      firstChoiceExists: response.data.choices && response.data.choices[0],
      hasMessage: response.data.choices && response.data.choices[0] && response.data.choices[0].message,
      hasContent: response.data.choices && response.data.choices[0] && response.data.choices[0].message && response.data.choices[0].message.content
    });
    
    // Get the content from OpenAI response
    let content = response.data.choices[0].message.content.trim();
    console.log('Step I: Raw content length:', content.length);
    console.log('Step J: Raw content preview (first 200 chars):', content.substring(0, 200));
    
    // Check if the response is wrapped in markdown code blocks
    if (content.startsWith('```')) {
      console.log('Step K: Removing markdown formatting...');
      // Extract content between markdown code blocks
      const matches = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (matches && matches[1]) {
        content = matches[1].trim();
        console.log('Step L: Markdown removed via regex match');
      } else {
        // If no matches found but starts with ```, remove all markdown syntax
        content = content.replace(/```json|```/g, '').trim();
        console.log('Step L: Markdown removed via simple replace');
      }
    } else {
      console.log('Step K: No markdown formatting detected');
    }
    
    console.log("Step M: Processed content for parsing:", content.substring(0, 100) + "...");
    console.log('Step N: About to parse JSON...');
    
    // Parse the cleaned JSON
    const result = JSON.parse(content);
    console.log('Step O: JSON parsing successful');
    console.log('Step P: Result type:', typeof result);
    console.log('Step Q: Result is array:', Array.isArray(result));
    console.log('Step R: Result length:', result.length);
    console.log('>>> extractQAPairs SUCCESS <<<');
    
    return result;
  } catch (error) {
    console.error('>>> extractQAPairs ERROR <<<');
    console.error('Error timestamp:', new Date().toISOString());
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Additional error context
    if (error.response) {
      console.error('OpenAI API error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    console.error('>>> extractQAPairs ERROR END <<<');
    throw error;
  }
}

async function evaluateAnswers(qa_pairs, expert_solution, level) {
  console.log('>>> evaluateAnswers START <<<');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Input QA pairs count:', qa_pairs.length);
  console.log('Level:', level);
  console.log('Fallback mode:', USE_FALLBACK_MODE);
  
  try {
    if (USE_FALLBACK_MODE || USE_EVALUATION_FALLBACK) {
      console.log('Using FALLBACK mode - generating mock evaluation results');
      
      // Create mock evaluation results for debugging
      const mockResults = qa_pairs.map((pair, index) => ({
        question: pair.question,
        expert_answer: "Mock expert answer for testing purposes",
        candidate_answer: pair.answer,
        approach_evaluation: index % 2 === 0 ? "High" : "Medium",
        key_considerations_evaluation: index % 3 === 0 ? "Correct" : "Partially Correct",
        feedback: "This is a mock evaluation for debugging purposes. The candidate's approach shows understanding of the topic.",
        approach_score: index % 2 === 0 ? 100 : 66,
        key_considerations_score: index % 3 === 0 ? 100 : 66
      }));
      
      console.log('Generated mock evaluation results:', mockResults.length);
      console.log('>>> evaluateAnswers SUCCESS (FALLBACK) <<<');
      return mockResults;
    }
    
    console.log('Step A: Getting level expectations...');
    // Get expectations based on level
    const expectations = getLevelExpectations(level);
    console.log('Step B: Expectations retrieved for level:', level);
    
    console.log('Step C: Building evaluation prompt...');
    const prompt = `As a senior tech architect evaluating a peer, analyze the following Q&A pairs from an architecture interview.
    The candidate is applying for a ${level} position.
    
    Evaluation rubric:
    ${expectations}
    
    For each answer, evaluate:
    1. Level of Completeness (High/Medium/Low)
    2. Level of Accuracy (Correct/Partially Correct/Incorrect)
    
    Expert solution to compare against:
    ${JSON.stringify(expert_solution, null, 2)}
    
    Be more lenient for L1, and stricter for L4. Calibrate your expectations accordingly.
    
    Q&A Pairs:
    ${JSON.stringify(qa_pairs, null, 2)}
    
    IMPORTANT: Return ONLY a plain JSON array without any markdown formatting, code blocks, or explanations. The response must be a valid JSON array of objects with the following structure:
    [
        {
            "question": "original question",
            "expert_answer": "summary of relevant expert solution",
            "candidate_answer": "original answer",
            "approach_evaluation": "High/Medium/Low",
            "key_considerations_evaluation": "Correct/Partially Correct/Incorrect",
            "feedback": "brief explanation of the evaluation"
        }
    ]`;
    
    console.log('Step D: Prompt built, length:', prompt.length);
    console.log('Step E: About to call OpenAI API for evaluation...');
    
    // Add timeout and more detailed logging for OpenAI call
    const startTime = Date.now();
    console.log('Step F: Making OpenAI evaluation API call at:', new Date().toISOString());
    
    const response = await Promise.race([
      openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a senior tech architect evaluating interview responses. Provide your evaluation in English. Output ONLY valid JSON as a list of objects without any markdown formatting or explanation." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI evaluation API call timeout after 90 seconds')), 90000)
      )
    ]);
    
    const apiCallDuration = Date.now() - startTime;
    console.log('Step G: OpenAI evaluation API call completed in', apiCallDuration, 'ms');
    console.log('Step H: Processing OpenAI evaluation response...');
    console.log('Response status:', response.status);
    console.log('Response data structure:', {
      hasChoices: !!response.data.choices,
      choicesLength: response.data.choices ? response.data.choices.length : 0,
      firstChoiceExists: response.data.choices && response.data.choices[0],
      hasMessage: response.data.choices && response.data.choices[0] && response.data.choices[0].message,
      hasContent: response.data.choices && response.data.choices[0] && response.data.choices[0].message && response.data.choices[0].message.content
    });
    
    // Get the content from OpenAI response
    let content = response.data.choices[0].message.content.trim();
    console.log('Step I: Raw evaluation content length:', content.length);
    console.log('Step J: Raw evaluation content preview (first 200 chars):', content.substring(0, 200));
    
    // Clean up markdown format if it exists
    if (content.startsWith('```')) {
      console.log('Step K: Removing markdown formatting from evaluation...');
      // Remove markdown code blocks
      content = content.replace(/```(?:json)?\n([\s\S]*?)```/g, '$1').trim();
      console.log('Step L: Markdown removed from evaluation');
    } else {
      console.log('Step K: No markdown formatting detected in evaluation');
    }
    
    console.log("Step M: Processed evaluation content for parsing:", content.substring(0, 100) + "...");
    console.log('Step N: About to parse evaluation JSON...');
    
    try {
      const results = JSON.parse(content);
      console.log('Step O: Evaluation JSON parsing successful');
      console.log('Step P: Evaluation result type:', typeof results);
      console.log('Step Q: Evaluation result is array:', Array.isArray(results));
      console.log('Step R: Evaluation result length:', results.length);
      
      // Verify the result is an array
      if (!Array.isArray(results)) {
        console.error("Parsed evaluation result is not an array:", results);
        throw new Error("Expected array result from OpenAI evaluation");
      }
      
      console.log('Step S: Adding percentage scores to evaluation results...');
      // Add percentage scores
      results.forEach((result, index) => {
        result.approach_score = mapApproachToPercentage(result.approach_evaluation);
        result.key_considerations_score = mapKeyConsiderationToPercentage(result.key_considerations_evaluation);
        console.log(`Step S.${index + 1}: Added scores for result ${index + 1}`);
      });
      
      console.log('Step T: All percentage scores added successfully');
      console.log('>>> evaluateAnswers SUCCESS <<<');
      return results;
    } catch (parseError) {
      console.error('>>> evaluateAnswers JSON PARSE ERROR <<<');
      console.error("JSON parse error:", parseError.message);
      console.error("Raw content:", content);
      console.error('>>> evaluateAnswers JSON PARSE ERROR END <<<');
      throw new Error(`Failed to parse OpenAI evaluation response: ${parseError.message}`);
    }
  } catch (error) {
    console.error('>>> evaluateAnswers ERROR <<<');
    console.error('Error timestamp:', new Date().toISOString());
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Additional error context
    if (error.response) {
      console.error('OpenAI evaluation API error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    console.error('>>> evaluateAnswers ERROR END <<<');
    throw error;
  }
}

function getLevelExpectations(level) {
  switch (level) {
    case "L1":
      return "L1 (Junior): Answers may be basic, incomplete, or lack structure. Some inaccuracies are acceptable. Focus on basic understanding.";
    case "L2":
      return "L2 (Intermediate): Answers should show some structure and understanding. Some missing details or minor inaccuracies are acceptable.";
    case "L3":
      return "L3 (Senior): Answers should be mostly complete, structured, and accurate. Minor gaps are acceptable, but most key points should be covered.";
    case "L4":
      return "L4 (Expert): Answers should be highly complete, well-structured, and highly accurate. Expect depth, clarity, and minimal inaccuracies.";
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

// Add debugging endpoint
app.get('/api/debug/status', (req, res) => {
  const status = {
    server_type: 'LEGACY_SERVER',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    fallbackMode: USE_FALLBACK_MODE,
    simplifiedMode: SIMPLIFIED_MODE,
    openaiAvailable: !!openai,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version
  };
  
  console.log('DEBUG STATUS REQUEST:', status);
  res.json(status);
});

// Server identification endpoint
app.get('/api/server-info', (req, res) => {
  res.json({
    server: 'LEGACY_SERVER',
    version: '1.0.0',
    features: ['mock_auth', 'file_storage', 'openai'],
    status: 'active'
  });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Make sure uploads directory exists
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
  }
  
  // Make sure the path to the build directory is correct
  const buildPath = path.join(__dirname, 'client', 'build');
  console.log('Serving static files from:', buildPath);
  
  // Static files
  app.use(express.static(buildPath));
  
  // Handle all other routes by serving index.html
  app.get('*', (req, res) => {
    if (req.url.startsWith('/api')) {
      // If it's an API request but wasn't caught by previous routes, it's a 404
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    const indexPath = path.join(buildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('index.html not found. Build may not be complete.');
    }
  });
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serving static files from: ${path.join(__dirname, 'client', 'build')}`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  
  if (process.env.NODE_ENV === 'production') {
    if (SIMPLIFIED_MODE) {
      console.log('Modo: Producción - respuestas instantáneas');
    } else {
      console.log('Modo: Producción - OpenAI completo');
    }
  }
  
  if (USE_FALLBACK_MODE) {
    console.log('⚠️  AVISO: Ejecutándose en modo fallback (sin OpenAI)');
  }
}); 