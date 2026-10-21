"""Run a trained YOLO damage model on one image."""
import argparse
from ultralytics import YOLO

def predict(image_path,model_path="models/damage_model.pt"):
    model=YOLO(model_path)
    result=model.predict(source=image_path,conf=.25,verbose=False)[0]
    names=result.names
    output=[]
    for box in result.boxes:
        xyxy=[round(float(v),2) for v in box.xyxy[0].tolist()]
        output.append({"class":names[int(box.cls[0])],"confidence":round(float(box.conf[0]),3),"boundingBox":xyxy})
    return output

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("image");p.add_argument("--model",default="models/damage_model.pt")
    a=p.parse_args()
    print(predict(a.image,a.model))
