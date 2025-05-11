# =============================
# Imports and Dependencies
# =============================
import streamlit as st
import openai
import json
import pandas as pd
from typing import List, Dict, Tuple
import time
from tenacity import retry, stop_after_attempt, wait_exponential
import chardet
import re

# =============================
# Feature Flags and Logging
# =============================
def get_log_level() -> str:
    """Get log level from Streamlit secrets (feature flag)."""
    try:
        return st.secrets["feature_flags"]["log_level"].lower()
    except Exception:
        return "off"  # Default to off if not set

def app_log(message: str, level: str = "info"):
    """Log messages to the user based on the log level feature flag."""
    log_level = get_log_level()
    if log_level == "off":
        return
    if log_level == "on":
        if level == "info":
            st.info(message)
        elif level == "warning":
            st.warning(message)
        elif level == "error":
            st.error(message)
        elif level == "success":
            st.success(message)
        else:
            st.write(message)

# =============================
# Streamlit Page Configuration
# =============================
st.set_page_config(
    page_title="Tech Architecture Interview Analyzer",
    page_icon="🏢",
    layout="wide"
)

# =============================
# Session State Initialization
# =============================
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

# =============================
# Utility Functions
# =============================
def reset_all():
    """Reset all session state variables to start over."""
    for key in [
        'transcript', 'qa_pairs', 'evaluation_results',
        'current_step', 'selected_case_study', 'selected_level']:
        if key in st.session_state:
            del st.session_state[key]
    st.session_state.current_step = 1

# -----------------------------
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
            app_log("No case studies found. Please ensure case_studies.json exists or is configured in Streamlit secrets.", "error")
            return {}

# -----------------------------
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
        app_log(f"Error reading file: {str(e)}", "error")
        return ""

# -----------------------------
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

# -----------------------------
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
        app_log("Rate limit reached. Waiting before retrying...", "warning")
        time.sleep(2)  # Wait before retry
        raise  # Re-raise to trigger retry
    except Exception as e:
        app_log(f"Error calling OpenAI API: {str(e)}", "error")
        raise

# -----------------------------
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

# =============================
# Core Processing Functions
# =============================
def extract_qa_from_transcript(transcript: str) -> List[Dict]:
    """Extract Q&A pairs from transcript using GPT-3.5."""
    openai.api_key = st.secrets["OPENAI_API_KEY"]
    # Preprocess the transcript
    processed_transcript = preprocess_transcript(transcript)
    # Prompt for Q&A extraction
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
        app_log(f"Failed to parse Q&A from transcript: {str(e)}", "error")
        return []

# -----------------------------
def evaluate_answers(qa_pairs: List[Dict], case_study: str, level: str) -> List[Dict]:
    """Evaluate answers using GPT-3.5 based on rubric and proficiency level."""
    openai.api_key = st.secrets["OPENAI_API_KEY"]
    expectations = get_level_expectations(level)
    # Compose the evaluation prompt
    prompt = f"""As a senior tech architect evaluating a peer, analyze the following Q&A pairs from an architecture interview.
    The candidate is applying for a {level} position.
    The case study being discussed is: {case_study}
    
    Evaluation rubric:
    {expectations}
    
    For each answer, evaluate:
    1. Level of Completeness (High/Medium/Low)
    2. Level of Accuracy (Correct/Partially Correct/Incorrect)
    
    Be more lenient for L1, and stricter for L4. Calibrate your expectations accordingly.
    
    IMPORTANT: Output ONLY valid JSON as a list of objects, with NO commentary, NO explanation, and NO markdown. Do not include any text before or after the JSON. The JSON must be parseable by Python's json.loads().
    
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
        {"role": "system", "content": "You are a senior tech architect evaluating interview responses. The responses are in Spanish, but provide your evaluation in English. Output ONLY valid JSON as a list of objects, with NO commentary, NO explanation, and NO markdown. The JSON must be parseable by Python's json.loads()."},
        {"role": "user", "content": prompt}
    ]
    try:
        response = make_openai_request(messages)
        content = response.choices[0].message.content.strip()
        try:
            return json.loads(content)
        except Exception as e:
            app_log(f"Failed to parse JSON. Here is the raw output for debugging:", "error")
            st.code(content, language="json")
            raise e
    except Exception as e:
        app_log(f"Failed to evaluate answers: {str(e)}", "error")
        return []

# =============================
# Streamlit UI Functions
# =============================
def show_step_1():
    """Show the first step of the process: upload, select, and process transcript."""
    st.title("🏢 Tech Architecture Interview Analyzer - Step 1")
    st.subheader("Upload and Process Transcript")
    # Reset button (always visible)
    reset_pressed = st.button("Reset / Start Again")
    if reset_pressed:
        reset_all()
        st.experimental_rerun()
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
    # Process Transcript button
    if st.button("Process Transcript"):
        if not uploaded_file:
            app_log("Please upload a transcript file.", "error")
            return
        # Read transcript with encoding detection
        transcript = read_file_content(uploaded_file)
        if not transcript:
            app_log("Could not read the file. Please ensure it's a valid text file.", "error")
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
            app_log("Transcript processed successfully!", "success")
            st.button("Proceed to Evaluation", on_click=lambda: setattr(st.session_state, 'current_step', 2))

def show_step_2():
    """Show the second step of the process: evaluate and display results."""
    st.title("🏢 Tech Architecture Interview Analyzer - Step 2")
    st.subheader("Evaluate Responses")
    # Reset button (always visible)
    reset_pressed = st.button("Reset / Start Again")
    if reset_pressed:
        reset_all()
        st.experimental_rerun()
    # Evaluate Responses button
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

# =============================
# Main App Entry Point
# =============================
def main():
    # Show the appropriate step based on session state
    if st.session_state.current_step == 1:
        show_step_1()
    else:
        show_step_2()

if __name__ == "__main__":
    main() 