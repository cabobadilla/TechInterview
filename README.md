# Tech Architecture Interview Analyzer

A Streamlit application that analyzes tech architecture interview transcripts using GPT-3.5 to evaluate candidate responses based on a structured rubric.

## Features

- Upload and analyze interview transcripts
- Extract Q&A pairs using GPT-3.5
- Evaluate answers based on completeness and accuracy
- Support for different architecture levels (L2-L4)
- Multiple case study templates
- Export results to CSV

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   - Create a `.streamlit/secrets.toml` file with your OpenAI API key:
     ```toml
     OPENAI_API_KEY = "your-api-key-here"
     ```
   - Optionally, add your case studies to the secrets file:
     ```toml
     [case_studies]
     "Case Study Name" = { description = "Case study description", key_considerations = ["consideration1", "consideration2"] }
     ```

4. Run the application:
   ```bash
   streamlit run app.py
   ```

## Deployment on Streamlit Cloud

1. Push your code to a GitHub repository
2. Go to [Streamlit Cloud](https://streamlit.io/cloud)
3. Create a new app and connect your repository
4. Add your secrets in the Streamlit Cloud dashboard:
   - OPENAI_API_KEY
   - case_studies (optional)

## Usage

1. Upload an interview transcript (text file)
2. Select the relevant case study
3. Choose the architecture level (L2-L4)
4. View the evaluation results in the table
5. Download results as CSV if needed

## Evaluation Rubric

### Completeness Levels
- High: Clear process with objectives, stages, and key elements
- Medium: Clear ideas with some structure
- Low: Only isolated ideas or proposals

### Accuracy Levels
- Correct: Accurate and detailed
- Partially Correct: Some depth but incomplete
- Incorrect: Inaccurate or unsatisfactory 