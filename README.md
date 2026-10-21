# Vehicle Damage & Insurance Analyzer

A GitHub Pages-friendly academic prototype that runs a vehicle-damage detection model in the browser. It does not need a project-owned backend or an OpenAI API key, but the first analysis requires an internet connection to download the ONNX runtime and model weights.

## Current features
- JPG/JPEG, PNG and WEBP upload, drag-and-drop, preview, replace/remove.
- Browser-based ONNX inference using a public YOLO11 segmentation model.
- Candidate detections for crack, dent, glass shatter, lamp broken, scratch and flat tyre.
- Annotated preview with model confidence labels, detection table, indicative INR repair-cost ranges, and print/save-PDF report.
- No manual damage-category or severity selection.

## Important limitations
This is a preliminary screening tool, not a certified vehicle inspection or insurance decision. Model predictions may miss damage or flag reflections, textures and other visual patterns. The estimated severity uses the size of the predicted image region, not structural integrity. Cost ranges are broad illustrative INR values and may double-count overlapping detections; they are not quotes. A qualified repair professional and insurer must verify the result.

The detector uses the public `tommy33355/damagelens-onnx` ONNX export, which documents six damage classes and YOLO11 segmentation output. Model weights are served by Hugging Face, not stored in this repository. This adds an external model download and means the first load may take time or fail on slow networks. If the model URL, CORS access, CDN, or runtime changes, analysis will display an error rather than a fabricated report.

**License note:** The model card identifies the model and source weights as AGPL-3.0 and notes that the underlying CarDD dataset is intended for non-commercial research and educational use. Review and comply with the upstream model and dataset terms before using or redistributing this project commercially. Model reference: https://huggingface.co/tommy33355/damagelens-onnx

## Enable GitHub Pages
1. Open repository **Settings → Pages**.
2. Under **Build and deployment**, choose **GitHub Actions**.
3. Wait for the **Deploy static site to GitHub Pages** workflow to finish.
4. Open https://g11553475-hub.github.io/vehicle-damage-and-insurance-analyzer/
5. Upload a clear photo and select **Analyze Vehicle**. The first run downloads the ONNX model; keep the tab open and allow it to finish.

## Development and testing
- Static site; no npm installation or server required.
- Check JavaScript syntax with `node --check app.js`.
- Verify upload validation, model download, browser inference, detection boxes, no-detection handling, and print/save-PDF in a modern browser.

## Privacy
The uploaded image is processed in the browser and is not sent by this page to a project-owned analysis backend. The model file is downloaded from Hugging Face. Browser extensions or network infrastructure may have their own behavior; do not upload sensitive documents or personally identifiable information unnecessarily.

## Fictional insurance demo
The generated report includes clearly labelled sample policy details (DemoShield Motor Cover, policy DEMO-MOTOR-2026-001), a sample ₹5,00,000 sum insured, ₹2,000 deductible, and an assumed 80% eligible share after deductible. It calculates an illustrative insurer share and customer-paid repair balance from detected repair-cost ranges. These details are invented for demonstration and must not be presented as a real policy or claim approval.
