# Models

Place a trained YOLO model here as `damage_model.pt` after training.

Large model binaries should not be committed to GitHub. Use Git LFS or external model storage if a trained model needs to be deployed.

The application never claims that a trained model exists when one has not been supplied. The web demo uses OpenAI vision when configured, otherwise a clearly labeled fallback mode.
