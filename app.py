import streamlit as st
import openai=0.28
import json
import pandas as pd
from typing import List, Dict, Tuple

# Set page config
st.set_page_config(
    page_title="Tech Architecture Interview Analyzer",
    page_icon="🏢",
    layout="wide"
)

# Initialize session state
if 'evaluation_results' not in st.session_state:
    st.session_state.evaluation_results = None

def load_case_studies() -> Dict:
    """Load case studies from Streamlit secrets or local file."""
    try:
        # Try to load from Streamlit secrets first
        return st.secrets["case_studies"]
    except:
        # Fallback to local file
        try:
            with open("case_studies.json", "r") as f:
                return json.load(f)
        except:
            st.error("No case studies found. Please ensure case_studies.json exists or is configured in Streamlit secrets.")
            return {}

def read_file_content(uploaded_file) -> str:
    """Read file content with encoding detection."""
    try:
        # First try UTF-8
        return uploaded_file.getvalue().decode('utf-8')
    except UnicodeDecodeError:
        try:
            # Try with latin-1 (which can read any byte sequence)
            return uploaded_file.getvalue().decode('latin-1')
        except Exception as e:
            st.error(f"Error reading file: {str(e)}")
            return ""

def extract_qa_from_transcript(transcript: str) -> List[Dict]:
    """Extract Q&A pairs from transcript using GPT-3.5."""
    openai.api_key = st.secrets["OPENAI_API_KEY"]
    
    prompt = f"""From the transcript below, extract a list of questions asked by the interviewer and the candidate's corresponding answers.
    Format the response as a JSON array of objects with 'question' and 'answer' fields.
    
    Transcript:
    {transcript}
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that extracts Q&A pairs from interview transcripts."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3
    )
    
    try:
        return json.loads(response.choices[0].message.content)
    except:
        st.error("Failed to parse Q&A from transcript. Please check the transcript format.")
        return []

def evaluate_answers(qa_pairs: List[Dict], case_study: str, level: str) -> List[Dict]:
    """Evaluate answers using GPT-3.5 based on rubric."""
    openai.api_key = st.secrets["OPENAI_API_KEY"]
    
    prompt = f"""As a senior tech architect evaluating a peer, analyze the following Q&A pairs from an architecture interview.
    The candidate is applying for a {level} position.
    The case study being discussed is: {case_study}
    
    For each answer, evaluate:
    1. Level of Completeness (High/Medium/Low)
    2. Level of Accuracy (Correct/Partially Correct/Incorrect)
    
    Provide your evaluation in JSON format with the following structure:
    [
        {{
            "question": "original question",
            "answer": "original answer",
            "completeness": "High/Medium/Low",
            "accuracy": "Correct/Partially Correct/Incorrect",
            "feedback": "brief explanation of the evaluation"
        }}
    ]
    
    Q&A Pairs:
    {json.dumps(qa_pairs, indent=2)}
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a senior tech architect evaluating interview responses."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3
    )
    
    try:
        return json.loads(response.choices[0].message.content)
    except:
        st.error("Failed to evaluate answers. Please try again.")
        return []

def main():
    st.title("🏢 Tech Architecture Interview Analyzer")
    
    # Load case studies
    case_studies = load_case_studies()
    
    # File uploader
    uploaded_file = st.file_uploader("Upload Interview Transcript", type=['txt'])
    
    # Case study selection
    case_study = st.selectbox(
        "Select Case Study",
        options=list(case_studies.keys()) if case_studies else ["No case studies available"]
    )
    
    # Architecture level selection
    level = st.radio(
        "Select Architecture Level",
        options=["L2", "L3", "L4"],
        horizontal=True
    )
    
    if uploaded_file and case_study and level:
        # Read transcript with encoding detection
        transcript = read_file_content(uploaded_file)
        
        if not transcript:
            st.error("Could not read the file. Please ensure it's a valid text file.")
            return
        
        # Extract Q&A
        with st.spinner("Extracting Q&A from transcript..."):
            qa_pairs = extract_qa_from_transcript(transcript)
        
        if qa_pairs:
            # Evaluate answers
            with st.spinner("Evaluating answers..."):
                evaluation_results = evaluate_answers(qa_pairs, case_study, level)
                st.session_state.evaluation_results = evaluation_results
            
            # Display results
            if st.session_state.evaluation_results:
                df = pd.DataFrame(st.session_state.evaluation_results)
                st.dataframe(
                    df,
                    column_config={
                        "question": "Question",
                        "answer": "Answer",
                        "completeness": "Completeness",
                        "accuracy": "Accuracy",
                        "feedback": "Feedback"
                    },
                    hide_index=True,
                    use_container_width=True
                )
                
                # Download button for results
                csv = df.to_csv(index=False)
                st.download_button(
                    label="Download Results as CSV",
                    data=csv,
                    file_name="interview_evaluation.csv",
                    mime="text/csv"
                )

if __name__ == "__main__":
    main() 