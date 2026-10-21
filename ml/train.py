"""YOLO training entry point.
Requires a legally usable dataset and ultralytics installed.
"""
import argparse
from ultralytics import YOLO

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--data",default="dataset/data.yaml")
    p.add_argument("--model",default="yolo11n.pt")
    p.add_argument("--epochs",type=int,default=30)
    p.add_argument("--imgsz",type=int,default=640)
    p.add_argument("--batch",type=int,default=8)
    a=p.parse_args()
    model=YOLO(a.model)
    model.train(data=a.data,epochs=a.epochs,imgsz=a.imgsz,batch=a.batch,project="runs",name="damage_model")

if __name__=="__main__": main()
