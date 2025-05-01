from roboflow import Roboflow
from dotenv import load_dotenv
import os

load_dotenv()

rf = Roboflow(api_key=os.getenv("ROBOFLOW_API_KEY"))
project = rf.workspace("niceworkspace").project("clothing-detection-uhmgf")
version = project.version(11)
dataset = version.download("yolov11")
                
project.version(version.version).deploy(model_type="yolov11", model_path="ClothingDetector/datasets/runs/detect/train")
