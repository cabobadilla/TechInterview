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
# Streamlit Page Configuration (MUST BE FIRST)
# =============================
st.set_page_config(
    page_title="Tech Architecture Interview Analyzer",
    page_icon="🧩",
    layout="wide"
)

# =============================
# Google-like Minimalist CSS Injection
# =============================
st.markdown(
    """
    <style>
    html, body, .stApp {
        background: #fff !important;
        font-family: 'Roboto', 'Google Sans', Arial, sans-serif !important;
        color: #202124;
        margin: 0;
        padding: 0;
    }
    .stApp {
        max-width: 800px;
        margin: auto;
        padding: 2rem 1rem;
    }
    .stButton>button, .stDownloadButton>button {
        background: #1a73e8 !important;
        color: #fff !important;
        border: none !important;
        border-radius: 24px !important;
        font-size: 1em !important;
        font-weight: 500;
        padding: 0.7em 2em !important;
        margin-bottom: 0.5em;
        box-shadow: 0 1px 2px rgba(60,64,67,.08), 0 1.5px 6px 1.5px rgba(60,64,67,.08);
        transition: background 0.2s;
    }
    .stButton>button:hover, .stDownloadButton>button:hover {
        background: #1765c1 !important;
        color: #fff !important;
    }
    .stRadio>div>label, .stSelectbox>div>div {
        font-family: 'Roboto', 'Google Sans', Arial, sans-serif !important;
        color: #202124 !important;
    }
    .stDataFrame, .stTable {
        background: #fff !important;
        border: 1px solid #e0e0e0 !important;
        border-radius: 16px !important;
        font-family: 'Roboto', 'Google Sans', Arial, sans-serif !important;
        color: #202124 !important;
        box-shadow: 0 1px 2px rgba(60,64,67,.08);
    }
    .stExpanderHeader {
        font-family: 'Roboto', 'Google Sans', Arial, sans-serif !important;
        color: #202124 !important;
    }
    .stMarkdown h1, .stMarkdown h2, .stMarkdown h3, .stMarkdown h4 {
        color: #202124 !important;
        font-family: 'Roboto', 'Google Sans', Arial, sans-serif !important;
        font-weight: 400;
        text-shadow: none;
    }
    .stAlert {
        background: #f8f9fa !important;
        border: 1px solid #e0e0e0 !important;
        color: #202124 !important;
        border-radius: 16px !important;
    }
    .stFileUploader, .stSelectbox, .stRadio, .stTextInput, .stExpander {
        border-radius: 16px !important;
        box-shadow: 0 1px 2px rgba(60,64,67,.08);
    }
    @media (max-width: 600px) {
        .stApp {
            padding: 0.5rem 0.2rem;
        }
        .stDataFrame, .stTable {
            font-size: 0.97em !important;
        }
        .stButton>button, .stDownloadButton>button {
            font-size: 0.97em !important;
            padding: 0.5em 1.2em !important;
        }
    }
    </style>
    """,
    unsafe_allow_html=True
)

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

def get_feature_flag(flag_name: str) -> bool:
    """Get a boolean feature flag from Streamlit secrets."""
    try:
        return st.secrets["feature_flags"][flag_name].lower() == "on"
    except Exception:
        return False

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
def safe_rerun():
    """Safely rerun the Streamlit app if supported."""
    try:
        st.experimental_rerun()
    except AttributeError:
        pass  # Rerun not supported in this Streamlit version

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
    """Show the first phase of the process: upload and process transcript only."""
    st.title("🧩 Tech Architecture Interview Analyzer - Fase 1")
    st.subheader("Sube y procesa el transcript de la entrevista")
    # Reset button (always visible)
    reset_pressed = st.button("Reiniciar / Comenzar de nuevo")
    if reset_pressed:
        reset_all()
        safe_rerun()
    # File uploader (ONLY this in phase 1)
    uploaded_file = st.file_uploader("Sube el transcript de la entrevista", type=['txt'])
    # Process Transcript button
    if st.button("Procesar Transcript"):
        if not uploaded_file:
            app_log("Por favor sube un archivo de transcript.", "error")
            return
        # Read transcript with encoding detection
        transcript = read_file_content(uploaded_file)
        if not transcript:
            app_log("No se pudo leer el archivo. Asegúrate de que sea un archivo de texto válido.", "error")
            return
        # Show the processed transcript for verification
        with st.expander("Ver transcript procesado"):
            st.text(preprocess_transcript(transcript))
        # Extract Q&A
        with st.spinner("Extrayendo preguntas y respuestas del transcript..."):
            qa_pairs = extract_qa_from_transcript(transcript)
        if qa_pairs:
            # Store data in session state
            st.session_state.transcript = transcript
            st.session_state.qa_pairs = qa_pairs
            st.session_state.current_step = 2
            # Show Q&A table
            st.markdown("**Preguntas y respuestas extraídas:**")
            df_qa = pd.DataFrame(qa_pairs)
            st.dataframe(df_qa, hide_index=True, use_container_width=True)
            # Show success message and button to proceed
            app_log("¡Transcript procesado exitosamente!", "success")
            st.button("Ir a Fase 2", on_click=lambda: setattr(st.session_state, 'current_step', 2))

def show_step_2():
    """Show the second phase: select case, show expert solution from file, and (optionally) generate expert solution."""
    st.title("🧩 Tech Architecture Interview Analyzer - Fase 2")
    st.subheader("Selecciona el caso y revisa la solución experta")
    reset_pressed = st.button("Reiniciar / Comenzar de nuevo")
    if reset_pressed:
        reset_all()
        safe_rerun()
    # Load case studies
    case_studies = load_case_studies()
    case_keys = list(case_studies.keys())
    case_names = [case_studies[k]["name"] for k in case_keys]
    # Case study selection
    selected_idx = st.selectbox(
        "Select Case Study",
        options=range(len(case_names)),
        format_func=lambda i: case_names[i] if case_names else "No case studies available"
    )
    selected_case_key = case_keys[selected_idx] if case_keys else None
    selected_case = case_studies[selected_case_key] if selected_case_key else None
    # Show objective
    if selected_case:
        st.markdown(f"**Objective:** {selected_case['objective']}")
        # Show process and key considerations as a table
        process = selected_case.get("process_answer", [])
        considerations = selected_case.get("key_considerations_answer", [])
        if process and considerations:
            st.markdown("**Expert Solution (Process & Key Considerations):**")
            df_expert = pd.DataFrame({
                "Process Task": process,
                "Key Consideration": considerations
            })
            st.dataframe(df_expert, hide_index=True, use_container_width=True)
            st.session_state.expert_solution = [
                {"process_task": p, "key_consideration": c}
                for p, c in zip(process, considerations)
            ]
    # Feature flag for Generate Expert Solution button
    if get_feature_flag("show_generate_expert"):
        if st.button("Generate Expert Solution (GPT)"):
            if not selected_case:
                app_log("Please select a case study.", "error")
                return
            # Prompt expert solution from GPT
            with st.spinner("Generating expert solution..."):
                expert_solution = generate_expert_solution(selected_case['objective'])
            if expert_solution:
                st.session_state.expert_solution = expert_solution
                st.session_state.selected_case_key = selected_case_key
                app_log("Expert solution generated!", "success")
                safe_rerun()
    # Button to evaluate candidate answers
    if 'expert_solution' in st.session_state and st.session_state.expert_solution:
        if st.button("Evaluate Candidate Answers"):
            # Check for candidate Q&A pairs
            qa_pairs = st.session_state.get('qa_pairs', [])
            if not qa_pairs or len(qa_pairs) == 0:
                app_log("No candidate Q&A pairs found. Please upload and process a transcript in Fase 1.", "warning")
                with st.expander("Ver Q&A Pairs (JSON)"):
                    st.code("qa_pairs: " + str(qa_pairs))
            else:
                # Debug: Show Q&A pairs and expert solution
                app_log("Evaluating with the following Q&A pairs and expert solution:", "info")
                with st.expander("Ver Q&A Pairs (JSON)"):
                    st.code(json.dumps(qa_pairs, indent=2))
                with st.expander("Ver Solución Experta (JSON)"):
                    st.code(json.dumps(st.session_state.expert_solution, indent=2))
                with st.spinner("Evaluating candidate answers..."):
                    evaluation_results = evaluate_candidate_vs_expert(
                        qa_pairs,
                        st.session_state.expert_solution
                    )
                    # Add percentage columns
                    for row in evaluation_results:
                        row["approach_score"] = map_approach_to_percentage(row.get("approach_evaluation", ""))
                        row["key_considerations_score"] = map_key_consideration_to_percentage(row.get("key_considerations_evaluation", ""))
                    st.session_state.evaluation_results = evaluation_results
                if st.session_state.evaluation_results:
                    st.markdown("**Evaluation Results:**")
                    df = pd.DataFrame(st.session_state.evaluation_results)
                    st.dataframe(df, hide_index=True, use_container_width=True)
                    csv = df.to_csv(index=False)
                    st.download_button(
                        label="Download Results as CSV",
                        data=csv,
                        file_name="interview_evaluation.csv",
                        mime="text/csv"
                    )
    if st.button("Volver a Fase 1"):
        st.session_state.current_step = 1
        safe_rerun()

def generate_expert_solution(objective: str) -> list:
    """Generate expert process steps and key considerations for the case using GPT."""
    openai.api_key = st.secrets["OPENAI_API_KEY"]
    prompt = f"""
You are an expert IT architect. For the following case objective, list the process required to execute the challenge, including 3-4 main steps and key considerations to tackle the main challenge. 
Output ONLY a JSON array of objects with 'process_task' and 'key_consideration' fields. 
Do not include any commentary, explanation, or markdown. If unsure, return at least one example.

Objective: {objective}

Example:
[
  {{"process_task": "Assess current infrastructure", "key_consideration": "Identify legacy dependencies"}},
  {{"process_task": "Plan migration phases", "key_consideration": "Minimize downtime"}}
]
"""
    messages = [
        {"role": "system", "content": "You are an expert IT architect."},
        {"role": "user", "content": prompt}
    ]
    try:
        response = make_openai_request(messages)
        content = response.choices[0].message.content.strip()
        st.markdown("**Raw GPT Output (Expert Solution):**")
        st.code(content, language="json")
        if not content:
            app_log("OpenAI returned an empty response for expert solution.", "error")
            return []
        try:
            return json.loads(content)
        except Exception as e:
            app_log(f"Failed to parse JSON for expert solution. Here is the raw output for debugging:", "error")
            st.code(content, language="json")
            return []
    except Exception as e:
        app_log(f"Failed to generate expert solution: {str(e)}", "error")
        return []

def evaluate_candidate_vs_expert(qa_pairs, expert_solution):
    """Evaluate candidate answers against expert solution using the new rubric."""
    openai.api_key = st.secrets["OPENAI_API_KEY"]
    prompt = f"""You are an expert IT architect. For each candidate answer, compare it to the expert process and key considerations below. For each question, output a JSON object with these fields:
- question
- expert_answer (summary of process and key considerations)
- candidate_answer
- approach_evaluation (High/Medium/Low)
- key_considerations_evaluation (Correct/Partially correct/Incorrect)

Do not include any commentary, explanation, or markdown. Always return a JSON array of such objects, even if you are unsure. Do not return an empty array unless there are no questions.

Expert process and considerations:
{json.dumps(expert_solution, indent=2)}

Q&A pairs:
{json.dumps(qa_pairs, indent=2)}
"""
    messages = [
        {"role": "system", "content": "You are an expert IT architect evaluating candidate answers. Output ONLY a valid JSON array as described, with NO commentary, NO explanation, and NO markdown."},
        {"role": "user", "content": prompt}
    ]
    try:
        response = make_openai_request(messages)
        content = response.choices[0].message.content.strip()
        with st.expander("Ver Salida GPT (JSON)"):
            st.code(content, language="json")
        if not content:
            app_log("OpenAI returned an empty response.", "error")
            return []
        try:
            parsed = json.loads(content)
            if isinstance(parsed, list) and len(parsed) > 0:
                return parsed
            else:
                app_log("GPT did not return a valid evaluation array.", "error")
                return []
        except Exception as e:
            app_log(f"Failed to parse JSON. Here is the raw output for debugging:", "error")
            with st.expander("Ver Salida GPT (JSON)"):
                st.code(content, language="json")
            return []
    except Exception as e:
        app_log(f"Failed to evaluate candidate answers: {str(e)}", "error")
        return []

def map_approach_to_percentage(value: str) -> int:
    mapping = {"High": 100, "Medium": 66, "Low": 33}
    return mapping.get(value.strip().capitalize(), 0)

def map_key_consideration_to_percentage(value: str) -> int:
    mapping = {"Correct": 100, "Partially correct": 66, "Incorrect": 0}
    return mapping.get(value.strip().capitalize(), 0)

# =============================
# Main App Entry Point
# =============================
def main():
    # Show the appropriate phase based on session state
    if st.session_state.current_step == 1:
        show_step_1()
    else:
        show_step_2()

if __name__ == "__main__":
    main() 