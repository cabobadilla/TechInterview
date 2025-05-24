const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
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

// API Routes
// 1. Upload and process transcript
app.post('/api/transcript', upload.single('transcript'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fs = require('fs');
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
app.get('/api/cases', (req, res) => {
  return res.json(caseStudies);
});

// 3. Evaluate answers
app.post('/api/evaluate', async (req, res) => {
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
    The transcript is in Spanish, please maintain the original language in the output.
    
    Transcript:
    ${processedTranscript}
    
    Example format:
    [
        {
            "question": "¿Podrías describir una estrategia de migración a cloud?",
            "answer": "Claro. Para desarrollar una estrategia de migración efectiva..."
        }
    ]`;
    
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant that extracts Q&A pairs from interview transcripts. Maintain the original language of the transcript and preserve the exact wording." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
    });
    
    return JSON.parse(response.data.choices[0].message.content);
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
    
    Output ONLY valid JSON as a list of objects with the following structure:
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
        { role: "system", content: "You are a senior tech architect evaluating interview responses. The responses are in Spanish, but provide your evaluation in English. Output ONLY valid JSON as a list of objects." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
    });
    
    const results = JSON.parse(response.data.choices[0].message.content);
    
    // Add percentage scores
    results.forEach(result => {
      result.approach_score = mapApproachToPercentage(result.approach_evaluation);
      result.key_considerations_score = mapKeyConsiderationToPercentage(result.key_considerations_evaluation);
    });
    
    return results;
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
  // Asegurarse que la ruta al directorio build es correcta
  const buildPath = path.join(__dirname, 'client', 'build');
  console.log('Serving static files from:', buildPath);
  
  // Verificar si el directorio existe
  if (fs.existsSync(buildPath)) {
    console.log('Build directory exists');
    // Listar archivos en el directorio build para debugging
    const files = fs.readdirSync(buildPath);
    console.log('Files in build directory:', files);
  } else {
    console.log('Build directory does not exist');
  }
  
  app.use(express.static(buildPath));
  
  app.get('*', (req, res) => {
    const indexPath = path.join(buildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('index.html not found. Build may not be complete.');
    }
  });
}

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 