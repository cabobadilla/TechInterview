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
# HackerRank-like Minimalist CSS Injection
# =============================
st.markdown(
    """
    <style>
    /* CSS Variables for Theme Support */
    :root {
        /* Light Theme (Default) */
        --background: #f8f9fa;
        --card-bg: #ffffff;
        --text-primary: #1e293b;
        --text-secondary: #475569;
        --text-heading: #0f172a;
        --border-color: #e2e8f0;
        --border-hover: #cbd5e1;
        --primary-color: #3b82f6;
        --primary-hover: #2563eb;
        --primary-light: #eff6ff;
        --success-color: #10b981;
        --success-bg: #f0fdf4;
        --warning-color: #f59e0b;
        --warning-bg: #fffbeb;
        --danger-color: #ef4444;
        --danger-bg: #fef2f2;
        --table-header: #f1f5f9;
        --table-stripe: #f8fafc;
        --shadow-color: rgba(0,0,0,0.05);
        --hover-shadow: rgba(0,0,0,0.08);
    }

    /* Dark Theme */
    [data-theme="dark"] {
        --background: #0f172a;
        --card-bg: #1e293b;
        --text-primary: #e2e8f0;
        --text-secondary: #cbd5e1;
        --text-heading: #f8fafc;
        --border-color: #334155;
        --border-hover: #475569;
        --primary-color: #60a5fa;
        --primary-hover: #3b82f6;
        --primary-light: #1e293b;
        --success-color: #34d399;
        --success-bg: #064e3b;
        --warning-color: #fbbf24;
        --warning-bg: #713f12;
        --danger-color: #f87171;
        --danger-bg: #7f1d1d;
        --table-header: #334155;
        --table-stripe: #1e293b;
        --shadow-color: rgba(0,0,0,0.2);
        --hover-shadow: rgba(0,0,0,0.3);
    }

    /* Base Elements & Typography */
    html, body, .stApp {
        background: var(--background) !important;
        font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif !important;
        color: var(--text-primary);
        line-height: 1.6;
        transition: all 0.3s ease;
    }

    .stApp {
        max-width: 1100px;
        margin: auto;
        padding: 2rem;
    }

    /* Typography Refinements */
    .stMarkdown h1 {
        font-size: 2.2rem;
        font-weight: 700;
        color: var(--text-heading);
        margin-bottom: 1.5rem;
        letter-spacing: -0.02em;
        line-height: 1.2;
    }

    .stMarkdown h2 {
        font-size: 1.7rem;
        font-weight: 600;
        color: var(--text-heading);
        margin: 1.8rem 0 1rem;
        letter-spacing: -0.01em;
    }

    .stMarkdown h3, .stMarkdown h4 {
        font-weight: 600;
        color: var(--text-primary);
        margin: 1.5rem 0 0.8rem;
    }

    .stMarkdown p, .stMarkdown li {
        font-size: 1rem;
        color: var(--text-secondary);
    }

    /* Card-based Components */
    .stTextInput, .stSelectbox, .stRadio, .stFileUploader, .stExpander, .stAlert, .stDataFrame, .stTable {
        background: var(--card-bg) !important;
        border-radius: 8px !important;
        border: 1px solid var(--border-color) !important;
        padding: 1rem !important;
        box-shadow: 0 1px 3px var(--shadow-color) !important;
        margin-bottom: 1.2rem;
        transition: all 0.2s ease;
    }

    .stTextInput:hover, .stSelectbox:hover, .stFileUploader:hover {
        border-color: var(--border-hover) !important;
        box-shadow: 0 3px 6px var(--hover-shadow) !important;
    }

    /* Button Styling */
    .stButton>button, .stDownloadButton>button {
        background: var(--primary-color) !important;
        color: #ffffff !important;
        border: none !important;
        border-radius: 6px !important;
        font-size: 0.95rem !important;
        font-weight: 500;
        padding: 0.6em 1.8em !important;
        box-shadow: 0 1px 2px var(--shadow-color);
        transition: all 0.2s ease;
        letter-spacing: 0.01em;
    }

    .stButton>button:hover, .stDownloadButton>button:hover {
        background: var(--primary-hover) !important;
        box-shadow: 0 4px 6px var(--hover-shadow);
        transform: translateY(-1px);
    }

    .stButton>button.secondary, .stDownloadButton>button.secondary {
        background: var(--card-bg) !important;
        color: var(--primary-color) !important;
        border: 1px solid var(--primary-color) !important;
    }

    .stButton>button.secondary:hover, .stDownloadButton>button.secondary:hover {
        background: var(--primary-light) !important;
        color: var(--primary-hover) !important;
    }

    /* Danger/Warning Button */
    .danger button {
        background: var(--danger-color) !important;
    }
    .danger button:hover {
        background: var(--danger-color) !important;
        opacity: 0.9;
    }

    /* Data Components */
    .stDataFrame, .stTable {
        border: 1px solid var(--border-color) !important;
    }

    .stDataFrame th {
        background: var(--table-header) !important;
        color: var(--text-primary) !important;
        font-weight: 600 !important;
        text-align: left !important;
        padding: 0.75rem 1rem !important;
    }

    .stDataFrame td {
        padding: 0.75rem 1rem !important;
        border-top: 1px solid var(--border-color) !important;
        color: var(--text-secondary) !important;
    }

    .stDataFrame tr:nth-child(even) {
        background: var(--table-stripe) !important;
    }

    /* Custom Status Tags */
    .status-tag {
        display: inline-flex;
        align-items: center;
        padding: 0.35em 0.8em;
        border-radius: 9999px;
        font-size: 0.85rem;
        font-weight: 500;
        line-height: 1;
        margin-right: 0.5em;
    }

    .status-high {
        background: var(--success-bg);
        color: var(--success-color);
        border: 1px solid var(--success-color);
    }

    .status-medium {
        background: var(--warning-bg);
        color: var(--warning-color);
        border: 1px solid var(--warning-color);
    }

    .status-low {
        background: var(--danger-bg);
        color: var(--danger-color);
        border: 1px solid var(--danger-color);
    }

    /* Progress Indicator */
    .progress-container {
        display: flex;
        justify-content: space-between;
        margin: 2rem 0;
        position: relative;
    }

    .progress-container::before {
        content: "";
        position: absolute;
        height: 2px;
        background: var(--border-color);
        width: 100%;
        top: 50%;
        transform: translateY(-50%);
        z-index: 1;
    }

    .progress-step {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: var(--card-bg);
        border: 2px solid var(--border-color);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        color: var(--text-secondary);
        position: relative;
        z-index: 2;
    }

    .progress-step.active {
        background: var(--primary-color);
        border-color: var(--primary-color);
        color: #ffffff;
    }

    .progress-step.completed {
        background: var(--success-color);
        border-color: var(--success-color);
        color: #ffffff;
    }

    /* File Uploader Enhancement */
    .stFileUploader>div>button {
        background: var(--background) !important;
        color: var(--text-secondary) !important;
        border: 1px dashed var(--border-color) !important;
        border-radius: 6px !important;
        padding: 1.2rem !important;
        width: 100%;
        transition: all 0.2s ease;
    }

    .stFileUploader>div>button:hover {
        background: var(--card-bg) !important;
        border-color: var(--border-hover) !important;
    }

    /* Alerts & Info Boxes */
    .info-box {
        padding: 1rem 1.2rem;
        border-radius: 8px;
        margin: 1rem 0;
        border-left: 4px solid;
    }

    .info-box.info {
        background: var(--primary-light);
        border-color: var(--primary-color);
        color: var(--primary-color);
    }

    .info-box.success {
        background: var(--success-bg);
        border-color: var(--success-color);
        color: var(--success-color);
    }

    .info-box.warning {
        background: var(--warning-bg);
        border-color: var(--warning-color);
        color: var(--warning-color);
    }

    .info-box.error {
        background: var(--danger-bg);
        border-color: var(--danger-color);
        color: var(--danger-color);
    }

    /* Expander Enhancement */
    .stExpander {
        border: 1px solid var(--border-color) !important;
    }

    .stExpander>div>div>div:first-child {
        background: var(--table-header) !important;
        padding: 0.8rem 1rem !important;
        border-radius: 8px 8px 0 0 !important;
        border-bottom: 1px solid var(--border-color) !important;
    }

    /* Keep accent and tag classes from original theme */
    .accent {
        color: var(--primary-color) !important;
        font-weight: 600;
        letter-spacing: 1px;
    }
    
    .stMarkdown .tag {
        display: inline-block;
        border: 1.5px solid var(--primary-color);
        color: var(--primary-color);
        border-radius: 16px;
        padding: 0.1em 0.8em;
        font-size: 0.95em;
        margin-bottom: 0.5em;
        margin-right: 0.5em;
        background: var(--card-bg);
        font-weight: 500;
        letter-spacing: 1px;
    }

    /* Dark Mode Toggle */
    .theme-toggle-container {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 1000;
        display: flex;
        align-items: center;
    }

    .theme-toggle {
        position: relative;
        width: 60px;
        height: 30px;
        border-radius: 15px;
        background: var(--border-color);
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .theme-toggle:before {
        content: "☀️";
        position: absolute;
        left: 8px;
        top: 5px;
        font-size: 14px;
    }

    .theme-toggle:after {
        content: "🌙";
        position: absolute;
        right: 8px;
        top: 5px;
        font-size: 14px;
    }

    .theme-toggle-thumb {
        position: absolute;
        top: 3px;
        left: 3px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #ffffff;
        transition: all 0.3s ease;
    }

    .theme-toggle[data-theme="dark"] .theme-toggle-thumb {
        transform: translateX(30px);
        background: #0f172a;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .stApp {
            padding: 1rem 0.8rem;
        }
        
        .stMarkdown h1 {
            font-size: 1.8rem;
        }
        
        .stMarkdown h2 {
            font-size: 1.4rem;
        }
        
        .stButton>button, .stDownloadButton>button {
            font-size: 0.9rem !important;
            padding: 0.5em 1.4em !important;
            width: 100%;
        }
        
        .progress-container {
            margin: 1.5rem 0;
        }
        
        .theme-toggle-container {
            top: 0.5rem;
            right: 0.5rem;
        }
    }
    </style>

    <!-- Dark Mode Toggle JavaScript -->
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        // Check for saved user preference
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);
        
        // Create toggle switch
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'theme-toggle-container';
        
        const toggle = document.createElement('div');
        toggle.className = 'theme-toggle';
        toggle.setAttribute('data-theme', savedTheme);
        
        const toggleThumb = document.createElement('div');
        toggleThumb.className = 'theme-toggle-thumb';
        
        toggle.appendChild(toggleThumb);
        toggleContainer.appendChild(toggle);
        document.body.appendChild(toggleContainer);
        
        // Toggle event
        toggle.addEventListener('click', function() {
            const currentTheme = toggle.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            applyTheme(newTheme);
            toggle.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
        
        function applyTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            if (theme === 'dark') {
                document.body.classList.add('dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
            }
        }
    });
    </script>
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
        # Use custom styled info boxes instead of default Streamlit alerts
        if level == "info":
            st.markdown(f'<div class="info-box info">{message}</div>', unsafe_allow_html=True)
        elif level == "warning":
            st.markdown(f'<div class="info-box warning">{message}</div>', unsafe_allow_html=True)
        elif level == "error":
            st.markdown(f'<div class="info-box error">{message}</div>', unsafe_allow_html=True)
        elif level == "success":
            st.markdown(f'<div class="info-box success">{message}</div>', unsafe_allow_html=True)
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
    
    # Add progress indicator
    st.markdown("""
    <div class="progress-container">
      <div class="progress-step active">1</div>
      <div class="progress-step">2</div>
    </div>
    """, unsafe_allow_html=True)
    
    st.subheader("Sube y procesa el transcript de la entrevista")
    # Reset button (always visible)
    col1, col2, col3 = st.columns([1, 1, 1])
    with col3:
        reset_pressed = st.button("Reiniciar / Comenzar de nuevo", key="reset_danger", use_container_width=True)
        if reset_pressed:
            st.markdown('<style>.stButton button#reset_danger {background-color: var(--danger-color) !important;}</style>', unsafe_allow_html=True)
    if reset_pressed:
        reset_all()
        safe_rerun()
    # File uploader (ONLY this in phase 1)
    uploaded_file = st.file_uploader("Sube el transcript de la entrevista", type=['txt'])
    # Process Transcript button
    if st.button("Procesar Transcript"):
        # Clear previous session state related to Q&A and evaluation
        for key in ["qa_pairs", "expert_solution", "evaluation_results", "selected_case_key"]:
            if key in st.session_state:
                del st.session_state[key]
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
    
    # Add progress indicator with first step completed
    st.markdown("""
    <div class="progress-container">
      <div class="progress-step completed">1</div>
      <div class="progress-step active">2</div>
    </div>
    """, unsafe_allow_html=True)
    
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
                    
                    # Format status tags for better visual appearance
                    def format_status(value, status_type):
                        if not value:
                            return ""
                        
                        if status_type == "approach":
                            css_class = "high" if value == "High" else "medium" if value == "Medium" else "low"
                        else:  # key considerations
                            css_class = "high" if value == "Correct" else "medium" if value == "Partially correct" else "low"
                            
                        return f'<span class="status-tag status-{css_class}">{value}</span>'
                    
                    # Create a copy of the DataFrame
                    df = pd.DataFrame(st.session_state.evaluation_results)
                    
                    # Add formatted columns for display
                    if "approach_evaluation" in df.columns:
                        df["approach_display"] = df["approach_evaluation"].apply(
                            lambda x: format_status(x, "approach")
                        )
                    
                    if "key_considerations_evaluation" in df.columns:
                        df["considerations_display"] = df["key_considerations_evaluation"].apply(
                            lambda x: format_status(x, "considerations")
                        )
                    
                    # Display the dataframe
                    st.dataframe(df, hide_index=True, use_container_width=True)
                    
                    # Provide download option
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