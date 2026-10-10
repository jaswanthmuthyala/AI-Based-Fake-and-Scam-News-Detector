# AI-Based Fake News & Scam Detector

## 1. Project Title
**AI-Based Fake News & Scam Detector**

## 2. Project Overview
With the rapid increase in digital communication, users are constantly exposed to phishing messages, fraudulent job offers, medical hoaxes, and deceptive links. This project is a comprehensive web application designed to help users assess the safety of digital content. By analyzing text structure, vocabulary, and URL structures, the detector assigns a trust score and highlights specific risk indicators, empowering users to make informed decisions before interacting with potentially dangerous content.

## 3. Objectives
- **Protect Users:** Automatically identify and flag phishing attempts, financial scams, and fake news.
- **Educate:** Provide transparent explanations and findings for *why* a message or link was flagged, rather than just returning a generic warning.
- **Context-Aware Analysis:** Reduce false positives on harmless content (like college announcements or legitimate job ads) while aggressively catching credential theft and manipulation tactics.
- **Data Privacy:** Allow users to privately maintain a secure history of their scanned items.

## 4. Key Features
- **Message Scanner:** Analyzes emails, SMS, and chat messages for phishing, credential theft (OTPs/Passwords), fraudulent job offers, and artificial urgency.
- **News Article Scanner:** Detects medical misinformation, clickbait, and unsupported claims, while accurately distinguishing them from legitimate reporting and debunking articles.
- **Suspicious URL Detection:** Parses links to identify deceptive authority (fake `@` domains), missing HTTPS, IP-based hosts, and suspicious credential-harvesting query parameters.
- **Voice Input:** Built-in Web Speech API integration allowing users to dictate messages directly into the scanner.
- **Trust Score & Risk Classification:** Outputs a calculated Trust Score (0-100) mapped to a clear Verdict (`Safe`, `Suspicious`, or `Dangerous`).
- **User Authentication:** Secure email/password registration and login system with JWT-based session management.
- **Private Scan History & Dashboard:** Authenticated users can view their past scans in a dedicated dashboard.
- **PDF Reports:** One-click generation of professional PDF reports summarizing the scan findings.
- **Dark/Light Mode:** Full UI theme toggling for accessibility.

## 5. Technology Stack
**Frontend:**
- React.js (Vite)
- Tailwind CSS (Styling)
- Context API (State Management)
- Web Speech API (Voice-to-Text)

**Backend:**
- FastAPI (Python 3)
- Uvicorn (ASGI Server)
- Scikit-learn (Machine Learning Engine)
- PyJWT & Passlib (Authentication & Security)

**Database:**
- SQLite (via SQLAlchemy ORM)

## 6. System Architecture
The application uses a modern decoupled architecture:
1. **Client (React/Vite):** Provides a responsive Single Page Application (SPA). It captures user inputs, manages authentication state (HTTP-only cookies/JWT), and dynamically renders the analysis.
2. **REST API (FastAPI):** Exposes endpoints for authentication, history tracking, and content analysis. 
3. **Detection Engine (Python):** When a request hits the analysis endpoint, the text is routed through three parallel pipelines: a Machine Learning model, a deterministic Rule Engine, and a URL parser.
4. **Database (SQLite):** Persists user credentials securely (hashed) and logs historical scan results.

## 7. How the Detection Works
The detection algorithm uses a **Hybrid Fusion Engine** to maximize accuracy and minimize false positives:
- **Rule-Based Engine (Regex & Heuristics):** Context-aware rules evaluate the text for explicit threats (e.g., OTP requests, financial guarantees, medical hoaxes). It utilizes negative lookbehinds to gracefully ignore educational warnings (e.g., *"We will never ask for your password"*).
- **Machine Learning Classifier:** A TF-IDF vectorizer paired with a Logistic Regression model trained on `starter_dataset.csv` generates a statistical risk probability based on vocabulary patterns.
- **Link Analyzer:** Uses `urllib.parse` to extract structural anomalies such as deceptive routing (`fake.com@evil.com`), reserved domains, and suspicious query parameters (`?otp=required`).
- **Fusion Logic:** The scores are mathematically weighted. If no explicit deterministic threats are found, the system intelligently caps the ML influence to prevent harmless messages (like college event announcements) from generating false positives.

*Limitation Note: The engine relies on structural text/URL heuristics and offline ML models. It does not perform live web-scraping or ping live threat-intelligence databases (e.g., external fact-checking services).*

## 8. Installation and Setup

### Prerequisites
- Node.js (v16+)
- Python (3.9+)

### Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv .venv
   ```
3. Activate the virtual environment:
   - Windows: `.\.venv\Scripts\activate`
   - Mac/Linux: `source .venv/bin/activate`
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. *(Optional)* Retrain the ML model if required:
   ```bash
   python train_model.py
   ```

### Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node modules:
   ```bash
   npm install
   ```

## 9. How to Run
You will need two separate terminal windows running simultaneously.

**Terminal 1: Start the Backend**
```bash
cd backend
.\.venv\Scripts\activate
$env:FRONTEND_ORIGIN="http://localhost:5173"
uvicorn app.main:app --port 8000 --reload
```
*(On Mac/Linux, use `export FRONTEND_ORIGIN="http://localhost:5173"`)*

**Terminal 2: Start the Frontend**
```bash
cd frontend
$env:VITE_API_BASE_URL="http://localhost:8000"
npm run dev
```
*(On Mac/Linux, use `export VITE_API_BASE_URL="http://localhost:8000"`)*

The application will now be live at **http://localhost:5173**.

## 10. How to Use
1. **Sign Up / Log In:** Create an account to save your scan history.
2. **Select Mode:** Choose between **Message**, **News Article**, or **Link** on the Home Page.
3. **Input Content:** Type, paste, or use the Microphone button to dictate your text.
4. **Analyze:** Click the Scan button. 
5. **Interpret Results:** The dashboard will display a Trust Score (0-100), a Verdict, and an itemized breakdown of any detected risk factors (Findings).
6. **Export:** Click the "Download PDF" button to save the analysis report offline.

## 11. Project Structure
```text
fake-news-scam-detector/
│
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── core/             # Security and config settings
│   │   ├── models/           # SQLAlchemy DB schemas
│   │   ├── routers/          # API endpoint routes (auth, analyze, history)
│   │   └── services/         # Core logic (rules.py, ml.py, links.py, fusion.py, llm.py)
│   ├── data/                 # Training datasets (starter_dataset.csv)
│   ├── models/               # Serialized ML models (.joblib)
│   ├── tests/                # Pytest unit and regression tests
│   ├── app.db                # SQLite Database
│   └── requirements.txt      # Python dependencies
│
└── frontend/                 # React & Vite Application
    ├── public/               # Static assets
    ├── src/
    │   ├── components/       # Reusable UI components (Navbar, Button, Layout)
    │   ├── context/          # React Context (AuthContext)
    │   ├── pages/            # Application views (Home, Login, Result, Dashboard)
    │   └── services/         # Axios/Fetch API configurations (api.js)
    └── package.json          # Node.js dependencies
```

## 12. Testing
The project includes a robust, automated regression testing suite for the backend analysis engine to ensure consistent accuracy. 

To run the tests:
```bash
cd backend
.\.venv\Scripts\activate
$env:PYTHONPATH="."
pytest tests
```
**Test Coverage:**
The suite includes over 50 unit tests explicitly validating:
- Phishing & OTP Credential Theft extraction.
- Contextual False-Positive mitigation (e.g., guaranteeing college announcements and legitimate job applications remain safe).
- Structural URL hacking (Deceptive `@` domains, reserved IP loops).
- Medical hoax contextual debunking rules.
- Authentication & JWT session persistence.

## 13. Limitations and Future Enhancements
### Current Limitations
- **No Live Reputation Checks:** The Link Scanner analyzes the *structure* of a URL, but it does not query live threat intelligence databases (like VirusTotal) to see if a domain was recently registered or blacklisted.
- **No External Fact-Checking:** The News Scanner checks for structural linguistic anomalies (clickbait, miracle cures, lack of citations) but cannot independently query the live internet to verify if a factual claim is true.

### Future Enhancements
- Integration with Google Fact Check API or VirusTotal API for real-time validation.
- Deployment of a more advanced Transformer-based NLP model (e.g., BERT) to replace the TF-IDF logic for deeper semantic understanding.
- Web-scraping capabilities to automatically pull text directly from an inputted URL for cross-analysis.

## 14. Conclusion
The AI-Based Fake News & Scam Detector represents a powerful, multi-layered approach to digital safety. By fusing machine learning with strict deterministic heuristic engines, it successfully distinguishes between harmless every-day communications and genuinely malicious manipulation tactics. The project serves as both a protective tool and an educational platform for digital literacy.
