# Vehicle Damage & Insurance Analyzer

AI-assisted vehicle damage assessment using Digital Image Processing, Machine Learning / Computer Vision, Natural Language Processing and modern responsive web development.

## Project overview

This is an academic/software-engineering prototype. A user uploads a vehicle image and describes an accident. The system returns a preliminary assessment covering visible damage, impact area, severity, accident-description analysis, image/text consistency and an approximate educational repair range.

**Important:** This is not a legally binding insurance decision, professional inspection or final repair quotation.

## Features

- Responsive single-page interface with `index.html` as the entry point
- JPG/PNG/WEBP upload validation up to 8 MB
- Image preview, replace/remove and reset/new-assessment flows
- Server-side OpenAI vision integration
- Configurable `OPENAI_MODEL`
- Clear fallback/demo analysis when no API key is configured
- Structured severity, confidence, damage types and impact area
- NLP-style accident analysis
- Image/text consistency explanation
- Educational INR repair-cost range
- Print / Save as PDF through the browser
- DIP preprocessing module using OpenCV
- Optional YOLO training/prediction modules
- Security-oriented environment configuration
- Vercel serverless API compatibility

## Technology stack

Frontend: HTML5, CSS3, JavaScript, responsive Grid/Flexbox.

Backend: Node.js serverless API on Vercel.

AI: OpenAI API through the backend, default model `gpt-4.1-mini`.

DIP/ML support: Python, OpenCV, NumPy and Ultralytics YOLO.

## System workflow

1. Upload vehicle image.
2. Validate file type and size.
3. Send image + accident description to `POST /api/analyze`.
4. If `OPENAI_API_KEY` is configured, use OpenAI vision analysis.
5. Otherwise use the transparent demo/fallback analyzer.
6. Display structured assessment and disclaimer.
7. Print or save the assessment as PDF from the browser.

## Project structure

```
vehicle-damage-and-insurance-analyzer/
├── index.html
├── styles.css
├── app.js
├── api/
│   └── analyze.js
├── dip/
│   └── preprocessing.py
├── ml/
│   ├── train.py
│   ├── predict.py
│   └── README.md
├── nlp/
│   └── accident_analyzer.py
├── insurance/
│   └── cost_estimator.py
├── models/
│   └── README.md
├── dataset/
│   └── README.md
├── uploads/
│   └── .gitkeep
├── results/
│   └── .gitkeep
├── .env.example
├── .gitignore
├── package.json
├── requirements.txt
├── vercel.json
└── README.md
```

## Installation

```bash
git clone https://github.com/S-SAM-02/vehicle-damage-and-insurance-analyzer.git
cd vehicle-damage-and-insurance-analyzer
npm install
```

For Python modules:

```bash
python -m venv venv
# Windows
venv\Scripts\activate
pip install -r requirements.txt
```

## Environment variables

Create `.env` locally:

```env
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4.1-mini
```

Never commit `.env`. Only `.env.example` belongs in Git.

## Local development

The frontend is a static site and the analysis endpoint is designed for Vercel. For the full application, run it through Vercel's local development environment or deploy it to Vercel.

## Vercel deployment

Import this GitHub repository into Vercel and configure:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

The API key must remain server-side. The browser never receives it.

## Digital Image Processing

`dip/preprocessing.py` demonstrates:
- image loading
- resizing to 640 × 640
- Gaussian noise reduction
- CLAHE contrast enhancement
- Canny edge detection
- normalization

## Machine Learning

The ML module is prepared for a YOLO damage detector. No trained model is fabricated or committed.

After preparing a legally usable dataset:

```bash
python ml/train.py --data dataset/data.yaml --epochs 30
python ml/predict.py path/to/image.jpg --model models/damage_model.pt
```

## NLP

`nlp/accident_analyzer.py` provides a transparent baseline that extracts accident type, impact direction, components and severity indicators. The deployed web analysis can use the AI endpoint when configured.

## Cost estimation

The repair range is intentionally approximate and configurable. It must never be presented as an exact market quote.

## API

### POST /api/analyze

Request:

```json
{
  "image": "data:image/jpeg;base64,...",
  "description": "The front bumper hit another vehicle at low speed."
}
```

Response contains:

```json
{
  "analysisMode": "OpenAI vision analysis",
  "severity": "moderate",
  "confidence": 0.87,
  "impactArea": "front-right",
  "damageTypes": ["bumper_damage"],
  "repairRange": "₹8,000 – ₹25,000",
  "damageSummary": "...",
  "incident": {
    "accidentType": "front collision",
    "impactDirection": "front-right",
    "components": ["bumper"],
    "severity": "moderate"
  },
  "consistency": {
    "level": "HIGH CONSISTENCY",
    "explanation": "..."
  },
  "nextStep": "..."
}
```

## Security

- API key is server-side only.
- `.env` is ignored.
- Frontend never contains the API key.
- File type and size are validated.
- User description length is limited.
- Internal API errors are not exposed.
- Production deployments should add rate limiting and abuse monitoring.

## Testing checklist

Frontend:
- Homepage loads
- Navigation works
- Upload/drag-drop works
- Preview works
- Remove/replace works
- Analyze works
- Results render
- Print/PDF works
- Reset works
- Mobile layout works

Backend:
- Missing image handled
- Invalid image handled
- Missing API key falls back transparently
- OpenAI errors fall back transparently
- Invalid AI JSON does not reach the frontend

## Troubleshooting

If analysis shows **Demo / fallback analysis**, configure `OPENAI_API_KEY` in the deployment environment.

If upload fails, use JPG, PNG or WEBP under 8 MB.

If Python modules fail, create the virtual environment and install `requirements.txt`.

## Limitations

- Image-based damage assessment can be uncertain.
- A trained YOLO model is optional and is not included.
- Repair costs vary by vehicle, part, location, labor and insurer.
- AI output must be reviewed by a qualified professional for real-world decisions.

## Future improvements

- Integrate a validated trained damage detector
- Add bounding-box visualization from YOLO output
- Store reports securely
- Add authentication
- Add insurer/repair-center workflows
- Add a validated regional cost database
- Add stronger privacy controls and rate limiting

## Academic disclaimer

Vehicle Damage & Insurance Analyzer is an academic prototype demonstrating DIP, ML/computer vision and NLP integration. It provides an **AI-assisted preliminary assessment** only. It does not replace professional inspection, mechanic evaluation or an insurer's official assessment.
