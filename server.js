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

// Configure OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

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
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const util = require('util');
    const readFile = util.promisify(fs.readFile);
    
    // Read the file with proper encoding
    const fileBuffer = await readFile(req.file.path);
    const transcript = fileBuffer.toString('utf-8');
    
    // Extract Q&A pairs using OpenAI
    const qa_pairs = await extractQAPairs(transcript);
    
    return res.json({ transcript, qa_pairs });
  } catch (error) {
    console.error('Error processing transcript:', error);
    return res.status(500).json({ error: 'Failed to process transcript' });
  }
});

// 2. Get all case studies
app.get('/api/cases', authenticateToken, (req, res) => {
  return res.json(caseStudies);
});

// 3. Evaluate answers
app.post('/api/evaluate', authenticateToken, async (req, res) => {
  try {
    const { qa_pairs, case_study_key, level } = req.body;
    
    if (!qa_pairs || !case_study_key || !caseStudies[case_study_key]) {
      return res.status(400).json({ error: 'Missing required data' });
    }
    
    const case_study = caseStudies[case_study_key];
    const expert_solution = {
      process: case_study.process_answer,
      considerations: case_study.key_considerations_answer
    };
    
    // Evaluate the answers using OpenAI
    const evaluation_results = await evaluateAnswers(qa_pairs, expert_solution, level);
    
    return res.json({ evaluation_results });
  } catch (error) {
    console.error('Error evaluating answers:', error);
    return res.status(500).json({ error: 'Failed to evaluate answers' });
  }
});

// Helper functions
async function extractQAPairs(transcript) {
  try {
    // Preprocess transcript
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
    
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant that extracts Q&A pairs from interview transcripts. Maintain the original language of the transcript and preserve the exact wording. Return ONLY valid JSON without markdown formatting." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
    });
    
    // Get the content from OpenAI response
    let content = response.data.choices[0].message.content.trim();
    
    // Check if the response is wrapped in markdown code blocks
    if (content.startsWith('```')) {
      // Extract content between markdown code blocks
      const matches = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (matches && matches[1]) {
        content = matches[1].trim();
      } else {
        // If no matches found but starts with ```, remove all markdown syntax
        content = content.replace(/```json|```/g, '').trim();
      }
    }
    
    console.log("Processed content for parsing:", content.substring(0, 100) + "...");
    
    // Parse the cleaned JSON
    return JSON.parse(content);
  } catch (error) {
    console.error('Error extracting Q&A pairs:', error);
    throw error;
  }
}

async function evaluateAnswers(qa_pairs, expert_solution, level) {
  try {
    // Get expectations based on level
    const expectations = getLevelExpectations(level);
    
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
    
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a senior tech architect evaluating interview responses. Provide your evaluation in English. Output ONLY valid JSON as a list of objects without any markdown formatting or explanation." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
    });
    
    let content = response.data.choices[0].message.content.trim();
    
    // Clean up markdown format if it exists
    if (content.startsWith('```')) {
      // Remove markdown code blocks
      content = content.replace(/```(?:json)?\n([\s\S]*?)```/g, '$1').trim();
    }
    
    console.log("OpenAI response:", content.substring(0, 100) + "..."); // Debug log
    
    try {
      const results = JSON.parse(content);
      
      // Verify the result is an array
      if (!Array.isArray(results)) {
        console.error("Parsed result is not an array:", results);
        throw new Error("Expected array result from OpenAI");
      }
      
      // Add percentage scores
      results.forEach(result => {
        result.approach_score = mapApproachToPercentage(result.approach_evaluation);
        result.key_considerations_score = mapKeyConsiderationToPercentage(result.key_considerations_evaluation);
      });
      
      return results;
    } catch (parseError) {
      console.error("JSON parse error:", parseError.message);
      console.error("Raw content:", content);
      throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error evaluating answers:', error);
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 