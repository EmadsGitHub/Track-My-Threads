import os, random, cv2
import supervision as sv
import IPython
import inference
import ultralytics
import time
import requests

from roboflow import Roboflow
# Check if dataset already exists

highestvaluekeytops=""
highestvaluekeypants=""
stop_condition=False


project_id = "niceworkspace/clothing-detection-uhmgf"  # Replace with your actual project ID
dataset_version = "9" # Replace with your dataset version number

model_id = project_id.split("/")[1] + "/" + dataset_version
model = inference.get_model(model_id, "Fl6OJur3jHyAJR2tyUfM")

# Location of test set images
emad = cv2.VideoCapture('http://10.0.0.34:81/stream')

width = 640
height = 360

url = "http://10.0.0.116:3000/api/clothes/clothingcatalog"
response = requests.get(url)
if response.status_code == 200:
    data = response.json()
    print(data)
else:
    print(f"Failed to fetch data from {url}")

my_tops = {
    "Blue Hoodie": 0,
    "HOSA Hoodie": 0,
    "Waterloo Hoodie": 0,
    "Yellow Hoodie": 0,
    "Yellow T-Shirt": 0,
    "Maroon T-Shirt": 0
}
my_pants = {
    "Blue Sweatpants": 0,
    "Gray Sweatpants": 0,
    "White Sweatpants": 0,
    "Navy Sweatpants": 0
}
last_time=time.time()
while True:
    ret, frame = emad.read()
    frame = cv2.resize(frame, (width, height))

    results = model.infer(frame, confidence=0.80, overlap=30)[0]
    detections = sv.Detections.from_inference(results)
    for prediction in results.predictions:
        print(f"Detected: {prediction.class_name}")
        try:
            my_tops[prediction.class_name] += 1
        except KeyError:
            my_pants[prediction.class_name] += 1

    # Annotate boxes and labels
    box_annotator = sv.BoxAnnotator()
    label_annotator = sv.LabelAnnotator()
    annotated_image = box_annotator.annotate(scene=frame, detections=detections)
    annotated_image = label_annotator.annotate(scene=annotated_image, detections=detections)
    cv2.imshow('myWindow', annotated_image)
    currenttime=time.time()
    if currenttime-last_time>5:
        for key in my_tops:
            if highestvaluekeytops=="":
                highestvaluekeytops=key
            elif my_tops[key]>my_tops[highestvaluekeytops]:
                highestvaluekeytops=key

        for key in my_pants:
            if highestvaluekeypants=="":
                highestvaluekeypants=key
            elif my_pants[key]>my_pants[highestvaluekeypants]:
                highestvaluekeypants=key

        print(f"You are wearing: {highestvaluekeytops} and {highestvaluekeypants}")
        my_tops = {
            "Blue Hoodie": 0,
            "HOSA Hoodie": 0,
            "Waterloo Hoodie": 0,
            "Yellow Hoodie": 0,
            "Yellow T-Shirt": 0,
            "Maroon T-Shirt": 0
        }
        my_pants = {
            "Blue Sweatpants": 0,
            "Gray Sweatpants": 0,
            "White Sweatpants": 0,
            "Navy Sweatpants": 0
        }
        last_time=currenttime
        stop_condition=True
    if (cv2.waitKey(1) & 0xFF == ord('q')) or stop_condition:
        break

