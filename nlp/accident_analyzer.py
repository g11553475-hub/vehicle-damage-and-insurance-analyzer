"""Small transparent NLP baseline for accident descriptions.
The production web API uses the configured AI model when available.
"""
import re

def analyze(text: str) -> dict:
    t=text.lower()
    direction="front-right" if "front" in t and "right" in t else "front-left" if "front" in t and "left" in t else "rear" if "rear" in t or "back" in t else "front" if "front" in t else "not clear"
    components=[x for x in ["bumper","headlight","windshield","door","hood","paint","tire"] if x in t]
    severity="high" if re.search(r"critical|severe|major|heavy",t) else "moderate" if re.search(r"moderate|medium",t) else "low" if re.search(r"minor|low speed|light",t) else "moderate"
    accident_type="rear collision" if "rear" in t or "back" in t else "front collision" if "front" in t and ("hit" in t or "collision" in t or "crash" in t) else "collision" if re.search(r"hit|collision|crash|accident",t) else "not clear"
    return {"accidentType":accident_type,"impactDirection":direction,"components":components,"severity":severity}
