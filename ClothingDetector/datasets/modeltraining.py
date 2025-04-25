from roboflow import Roboflow
from dotenv import load_dotenv
import os

load_dotenv()

rf = Roboflow(api_key=os.getenv("ROBOFLOW_API_KEY"))
project = rf.workspace("niceworkspace").project("clothing-detection-uhmgf")
version = project.version(10)
dataset = version.download("yolov11")
                
