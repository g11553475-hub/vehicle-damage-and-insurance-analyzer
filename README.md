# Vehicle Damage & Insurance Analyzer — API-free static edition

This project is configured for GitHub Pages. It does not require an OpenAI key, AI subscription, Node.js, Vercel, or an analysis backend.

## Current functionality
- Existing responsive red-and-white interface.
- JPG/JPEG, PNG and WEBP upload, drag-and-drop, preview, replace/remove and 3 MB limit.
- Browser-side image decoding and pixel measurements: dimensions, brightness, contrast and edge density.
- Separate INR repair-cost guide using manually selected component and severity.
- Print / Save PDF.

## Important limitation: no trained damage detector is integrated
The current browser processing is conventional image analysis, not machine learning. Pixel brightness, contrast and edge density cannot reliably identify scratches, dents, broken glass, damaged parts, severity, or localized damage. The site does not invent damage labels, confidence scores, bounding boxes, or an AI-generated no-damage result.

A real detector requires a verified, openly licensed model checkpoint and browser-compatible runtime/export (such as ONNX). The public vehicle-damage projects reviewed for this change publish application/training code or PyTorch .pt weights, but a verified, directly browser-loadable checkpoint with documented classes was not available to integrate safely here. Integrating and validating a suitable ONNX damage model remains outstanding. Do not describe this fallback as completed ML damage detection.

## Repair cost guide
Estimates are illustrative and manually selected, not predictions from the photo, quotations, hidden-damage assessments or insurance approvals. Edit the priceTable object in app.js to configure ranges.

## Enable GitHub Pages
1. Open repository Settings → Pages.
2. Under Build and deployment, choose Deploy from a branch.
3. Select main and /(root), then save.
4. Open https://g11553475-hub.github.io/vehicle-damage-and-insurance-analyzer/ after deployment completes.
5. Test file selection, drag/drop, remove/replace, Analyze Vehicle, manual cost guide and Print / Save PDF.

All page assets use relative paths, so they work from the repository subpath. No backend URL or secret is required.

## Privacy and limitations
Image processing runs in the browser; the photo is not sent to an analysis server by this page. Have a qualified professional inspect the vehicle from multiple angles. This is an academic demonstration, not a certified detector or official insurance assessment.
