"""Digital Image Processing component.
Resize, denoise, contrast enhancement, edge detection and normalization.
"""
from pathlib import Path
import cv2
import numpy as np

def preprocess(image_path: str, size=(640, 640)) -> dict:
    image=cv2.imread(str(image_path))
    if image is None:
        raise ValueError("Unable to read image")
    resized=cv2.resize(image,size,interpolation=cv2.INTER_AREA)
    blurred=cv2.GaussianBlur(resized,(5,5),0)
    gray=cv2.cvtColor(blurred,cv2.COLOR_BGR2GRAY)
    clahe=cv2.createCLAHE(clipLimit=2.0,tileGridSize=(8,8))
    enhanced=clahe.apply(gray)
    edges=cv2.Canny(enhanced,100,200)
    normalized=resized.astype(np.float32)/255.0
    return {"image":resized,"gray":enhanced,"edges":edges,"normalized":normalized}

if __name__=="__main__":
    import argparse
    p=argparse.ArgumentParser()
    p.add_argument("image")
    p.add_argument("--output",default="results/edges.jpg")
    a=p.parse_args()
    out=preprocess(a.image)
    Path(a.output).parent.mkdir(parents=True,exist_ok=True)
    cv2.imwrite(a.output,out["edges"])
    print(f"Saved processed edge image to {a.output}")
