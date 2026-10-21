# Machine Learning Module

This module supports an optional trained YOLO damage-detection model.

Expected model location:
`models/damage_model.pt`

The repository intentionally does **not** include a trained model or fabricated dataset. Prepare a legally usable dataset first, then train with:

```bash
python ml/train.py --data dataset/data.yaml --epochs 30
```

Prediction:
```bash
python ml/predict.py path/to/image.jpg --model models/damage_model.pt
```

Suggested classes: scratch, dent, crack, bumper_damage, headlight_damage, windshield_damage, paint_damage, broken_part.
