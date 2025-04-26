from roboflow import Roboflow
rf = Roboflow(api_key="Fl6OJur3jHyAJR2tyUfM")
project = rf.workspace("niceworkspace").project("clothing-detection-uhmgf")
version = project.version(10)
dataset = version.download("yolov11")
                
#project.version(version.version).deploy(model_type="yolov11", model_path="C:/Users/emad_/Downloads/ClothingDetector/runs/detect/train8")