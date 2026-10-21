"""Configurable educational repair-cost estimator. Values are not market guarantees."""
RANGES={
    "scratch":(2000,6000),"dent":(5000,15000),"bumper_damage":(8000,25000),
    "headlight_damage":(6000,30000),"windshield_damage":(7000,25000)
}
def estimate(damage_types,severity="moderate"):
    if severity=="critical": return "Professional inspection required"
    vals=[RANGES[x] for x in damage_types if x in RANGES]
    if not vals:
        return "₹35,000 – ₹80,000+" if severity=="high" else "₹10,000 – ₹35,000"
    lo=sum(x[0] for x in vals);hi=sum(x[1] for x in vals)
    if severity=="high": hi=max(hi,35000)
    return f"₹{lo:,} – ₹{hi:,}"
