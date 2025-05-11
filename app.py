import streamlit as st
import openai
import json
import pandas as pd
from typing import List, Dict, Tuple
import time
from tenacity import retry, stop_after_attempt, wait_exponential
import chardet
import re

# Set page config
st.set_page_config(
    page_title="Tech Architecture Interview Analyzer",
    page_icon="🏢",
    layout="wide"
)

# Initialize session state variables
if 'transcript' not in st.session_state:
    st.session_state.transcript = None
if 'qa_pairs' not in st.session_state:
    st.session_state.qa_pairs = None
if 'evaluation_results' not in st.session_state:
    st.session_state.evaluation_results = None
if 'current_step' not in st.session_state:
    st.session_state.current_step = 1
if 'selected_case_study' not in st.session_state:
    st.session_state.selected_case_study = None
if 'selected_level' not in st.session_state:
    st.session_state.selected_level = None

def reset_all():
    """Reset all session state variables to start over."""
    for key in [
        'transcript', 'qa_pairs', 'evaluation_results',
        'current_step', 'selected_case_study', 'selected_level']:
        if key in st.session_state:
            del st.session_state[key]
    st.session_state.current_step = 1
    st.experimental_rerun()

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
    """Read file content with automatic encoding detection."""
    try:
        # Read the raw bytes
        raw_data = uploaded_file.getvalue()
        
        # Detect the encoding
        result = chardet.detect(raw_data)
        encoding = result['encoding']
        
        # Try to decode with detected encoding
        try:
            return raw_data.decode(encoding)
        except UnicodeDecodeError:
            # If detected encoding fails, try common encodings
            for enc in ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']:
                try:
                    return raw_data.decode(enc)
                except UnicodeDecodeError:
                    continue
            
            # If all else fails, use latin-1 which can read any byte sequence
            return raw_data.decode('latin-1')
            
    except Exception as e:
        st.error(f"Error reading file: {str(e)}")
        return ""

def preprocess_transcript(transcript: str) -> str:
    """Preprocess the transcript to better handle the A: and C: format."""
    # Replace multiple spaces with single space
    transcript = re.sub(r'\s+', ' ', transcript)
    
    # Add newlines before A: and C: markers if they don't exist
    transcript = re.sub(r'([^A]):', r'\n\1:', transcript)
    transcript = re.sub(r'([^C]):', r'\n\1:', transcript)
    
    # Clean up any double newlines
    transcript = re.sub(r'\n\s*\n', '\n', transcript)
    
    return transcript.strip()

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def make_openai_request(messages: List[Dict], temperature: float = 0.3) -> Dict:
    """Make OpenAI API request with retry logic."""
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=temperature
        )
        return response
    except openai.error.RateLimitError:
        st.warning("Rate limit reached. Waiting before retrying...")
        time.sleep(2)  # Wait before retry
        raise  # Re-raise to trigger retry
    except Exception as e:
        st.error(f"Error calling OpenAI API: {str(e)}")
        raise

def extract_qa_from_transcript(transcript: str) -> List[Dict]:
    """Extract Q&A pairs from transcript using GPT-3.5."""
    openai.api_key = st.secrets["OPENAI_API_KEY"]
    
    # Preprocess the transcript
    processed_transcript = preprocess_transcript(transcript)
    
    prompt = f"""From the transcript below, extract a list of questions asked by the interviewer (marked with A:) and the candidate's corresponding answers (marked with C:).
    Format the response as a JSON array of objects with 'question' and 'answer' fields.
    The transcript is in Spanish, please maintain the original language in the output.
    
    Transcript:
    {processed_transcript}
    
    Example format:
    [
        {{
            "question": "¿Podrías describir una estrategia de migración a cloud?",
            "answer": "Claro. Para desarrollar una estrategia de migración efectiva..."
        }}
    ]
    """
    
    messages = [
        {"role": "system", "content": "You are a helpful assistant that extracts Q&A pairs from interview transcripts. Maintain the original language of the transcript and preserve the exact wording."},
        {"role": "user", "content": prompt}
    ]
    
    try:
        response = make_openai_request(messages)
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        st.error(f"Failed to parse Q&A from transcript: {str(e)}")
        return []

def get_level_expectations(level: str) -> str:
    """Return expectations for each proficiency level."""
    if level == "L1":
        return (
            "L1 (Junior): Answers may be basic, incomplete, or lack structure. "
            "Some inaccuracies are acceptable. Focus on basic understanding."
        )
    elif level == "L2":
        return (
            "L2 (Intermediate): Answers should show some structure and understanding. "
            "Some missing details or minor inaccuracies are acceptable."
        )
    elif level == "L3":
        return (
            "L3 (Senior): Answers should be mostly complete, structured, and accurate. "
            "Minor gaps are acceptable, but most key points should be covered."
        )
    elif level == "L4":
        return (
            "L4 (Expert): Answers should be highly complete, well-structured, and highly accurate. "
            "Expect depth, clarity, and minimal inaccuracies."
        )
    else:
        return ""

def evaluate_answers(qa_pairs: List[Dict], case_study: str, level: str) -> List[Dict]:
    """Evaluate answers using GPT-3.5 based on rubric."""
    openai.api_key = st.secrets["OPENAI_API_KEY"]
    
    expectations = get_level_expectations(level)
    
    prompt = f"""As a senior tech architect evaluating a peer, analyze the following Q&A pairs from an architecture interview.
    The candidate is applying for a {level} position.
    The case study being discussed is: {case_study}
    
    Evaluation rubric:
    {expectations}
    
    For each answer, evaluate:
    1. Level of Completeness (High/Medium/Low)
    2. Level of Accuracy (Correct/Partially Correct/Incorrect)
    
    Be more lenient for L1, and stricter for L4. Calibrate your expectations accordingly.
    
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
    
    messages = [
        {"role": "system", "content": "You are a senior tech architect evaluating interview responses. The responses are in Spanish, but provide your evaluation in English."},
        {"role": "user", "content": prompt}
    ]
    
    try:
        response = make_openai_request(messages)
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        st.error(f"Failed to evaluate answers: {str(e)}")
        return []

def show_step_1():
    """Show the first step of the process."""
    st.title("🏢 Tech Architecture Interview Analyzer - Step 1")
    st.subheader("Upload and Process Transcript")
    
    # Reset button (always visible)
    st.button("Reset / Start Again", on_click=reset_all)
    
    # Load case studies
    case_studies = load_case_studies()
    
    # File uploader
    uploaded_file = st.file_uploader("Upload Interview Transcript", type=['txt'])
    
    # Case study selection
    case_study = st.selectbox(
        "Select Case Study",
        options=list(case_studies.keys()) if case_studies else ["No case studies available"]
    )
    
    # Architecture level selection (L1-L4)
    level = st.radio(
        "Select Architecture Level",
        options=["L1", "L2", "L3", "L4"],
        horizontal=True
    )
    
    if st.button("Process Transcript"):
        if not uploaded_file:
            st.error("Please upload a transcript file.")
            return
        
        # Read transcript with encoding detection
        transcript = read_file_content(uploaded_file)
        
        if not transcript:
            st.error("Could not read the file. Please ensure it's a valid text file.")
            return
        
        # Show the processed transcript for verification
        with st.expander("View Processed Transcript"):
            st.text(preprocess_transcript(transcript))
        
        # Extract Q&A
        with st.spinner("Extracting Q&A from transcript..."):
            qa_pairs = extract_qa_from_transcript(transcript)
        
        if qa_pairs:
            # Store data in session state
            st.session_state.transcript = transcript
            st.session_state.qa_pairs = qa_pairs
            st.session_state.selected_case_study = case_study
            st.session_state.selected_level = level
            st.session_state.current_step = 2
            
            # Show Q&A table
            st.markdown("**Extracted Questions and Answers:**")
            df_qa = pd.DataFrame(qa_pairs)
            st.dataframe(df_qa, hide_index=True, use_container_width=True)
            
            # Show success message and button to proceed
            st.success("Transcript processed successfully!")
            st.button("Proceed to Evaluation", on_click=lambda: setattr(st.session_state, 'current_step', 2))

def show_step_2():
    """Show the second step of the process."""
    st.title("🏢 Tech Architecture Interview Analyzer - Step 2")
    st.subheader("Evaluate Responses")
    
    # Reset button (always visible)
    st.button("Reset / Start Again", on_click=reset_all)
    
    if st.button("Evaluate Responses"):
        with st.spinner("Evaluating answers..."):
            evaluation_results = evaluate_answers(
                st.session_state.qa_pairs,
                st.session_state.selected_case_study,
                st.session_state.selected_level
            )
            st.session_state.evaluation_results = evaluation_results
        
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
    
    # Add button to go back to step 1
    if st.button("Back to Step 1"):
        st.session_state.current_step = 1
        st.experimental_rerun()

def main():
    # Show the appropriate step
    if st.session_state.current_step == 1:
        show_step_1()
    else:
        show_step_2()

if __name__ == "__main__":
    main() 