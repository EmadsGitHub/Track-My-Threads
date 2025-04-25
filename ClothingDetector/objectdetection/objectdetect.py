import os, random, cv2
import supervision as sv
import IPython
import inference
import ultralytics
import time
import requests
import urllib.parse

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

currentWearsDB = {}

url = "http://10.0.0.116:3000/api/clothes/clothingcatalog"
response = requests.get(url)
if response.status_code == 200:
    data = response.json()
    print(data)
else:
    print(f"Failed to fetch data from {url}")

for clothing in data:
    currentWearsDB[clothing["Name"]] = clothing["WearsBeforeWash"]

print(currentWearsDB)
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
        # Find the top with the highest count using max() with a key function
        highestvaluekeytops = max(my_tops, key=my_tops.get) if my_tops else None
        
        
        # Find the pants with the highest count using max() with a key function
        highestvaluekeypants = max(my_pants, key=my_pants.get) if my_pants else None
        
        if highestvaluekeytops is not None and highestvaluekeypants is not None:
            if my_tops[highestvaluekeytops] > 0 and my_pants[highestvaluekeypants] > 0:
                print(f"You are wearing: {highestvaluekeytops} and {highestvaluekeypants}")
                encoded_tops = urllib.parse.quote(highestvaluekeytops)
                encoded_pants = urllib.parse.quote(highestvaluekeypants)
                send_datatop = requests.put(f'http://10.0.0.116:3000/api/clothes/{encoded_tops}', json={"wearsBeforeWash": currentWearsDB[highestvaluekeytops] + 1})
                send_datapants = requests.put(f'http://10.0.0.116:3000/api/clothes/{encoded_pants}', json={"wearsBeforeWash": currentWearsDB[highestvaluekeypants] + 1})
                if send_datatop.status_code == 200:
                    # Parse JSON response
                    data = send_datatop.json()
                    print(data)
                else:
                    print(f"Failed with status code: {send_datatop.status_code}")
                if send_datapants.status_code == 200:
                    # Parse JSON response
                    data = send_datapants.json()
                    print(data)
                else:
                    print(f"Failed with status code: {send_datapants.status_code}")
                
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

