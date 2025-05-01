import os, random, cv2
import supervision as sv
import IPython
import inference
import ultralytics
import time
import requests
import urllib.parse
from dotenv import load_dotenv

load_dotenv()

from roboflow import Roboflow
# Check if dataset already exists

def get_device_id():
    try:
        response = requests.get("http://10.0.0.116:3000/api/device/id", timeout=5)
        if response.status_code == 200:
            return response.json()["deviceId"]
        else:
            return "default-device-id"
    except requests.exceptions.RequestException:
        return "default-device-id"

def detect_clothing(show_gui=False):
    highestvaluekeytops=""
    highestvaluekeypants=""
    stop_condition=False


    project_id = "niceworkspace/clothing-detection-uhmgf"  # Replace with your actual project ID
    dataset_version = "10" # Replace with your dataset version number

    model_id = project_id.split("/")[1] + "/" + dataset_version
    model = inference.get_model(model_id, os.getenv("ROBOFLOW_API_KEY"))

    # Location of test set images
    try:
        # Update this URL to match your ESP32's current IP address and port
        # The original URL was: emad = cv2.VideoCapture('http://10.0.0.34:81/stream')
        emad = cv2.VideoCapture('http://10.0.0.97:81/stream')
        
        # Check if camera opened successfully
        if not emad.isOpened():
            print("Error: Could not connect to camera stream at http://10.0.0.97:81/stream")
            return []
    except Exception as e:
        print(f"Error connecting to camera stream: {e}")
        return []

    width = 640
    height = 360

    currentWearsDB = {}

    try:
        url = "http://10.0.0.116:3000/api/clothes/clothingcatalog"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(data)
        else:
            print(f"Failed to fetch data from {url}")
            data = []
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to API: {e}")
        data = []

    try:
        for clothing in data:
            currentWearsDB[clothing["Name"]] = clothing["WearsBeforeWash"]
    except (TypeError, KeyError) as e:
        print(f"Error processing API data: {e}")
        
    print(currentWearsDB)
    my_clothing = {
        "Blue Hoodie": 0,
        "HOSA Hoodie": 0,
        "Waterloo Hoodie": 0,
        "Yellow Hoodie": 0,
        "Yellow T-Shirt": 0,
        "Maroon T-Shirt": 0,
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
                my_clothing[prediction.class_name] += 1
            except KeyError:
                pass

        # Only show GUI if requested
        if show_gui:
            # Annotate boxes and labels
            box_annotator = sv.BoxAnnotator()
            label_annotator = sv.LabelAnnotator()
            annotated_image = box_annotator.annotate(scene=frame, detections=detections)
            annotated_image = label_annotator.annotate(scene=annotated_image, detections=detections)
            cv2.imshow('myWindow', annotated_image)
            
        currenttime=time.time()
        if currenttime-last_time>5:
            # Find the top with the highest count using max() with a key function
            
            detecteditems = [clothing for clothing in my_clothing.keys() if my_clothing[clothing] > 10]
            
            if len(detecteditems) > 0:
                device_id = get_device_id()
                print(device_id)
                for item in detecteditems:
                    print(f"You are wearing: {item}")
                    try:
                        encoded_clothing = urllib.parse.quote(item)
                        send_data = requests.put(f'http://10.0.0.116:3000/api/clothes/{encoded_clothing}', 
                                            json={"wearsBeforeWash": currentWearsDB.get(item, 0) + 1}, 
                                            headers={"Device-ID": device_id, "Content-Type": "application/json"},
                                            timeout=5)
                        if send_data.status_code == 200:
                            # Parse JSON response
                            data = send_data.json()
                            print(data)
                        try:
                            response_json = send_data.json()
                            print(f"Response JSON: {response_json}")
                        except ValueError:
                            # If response isn't JSON, get the text content
                            print(f"Response content: {send_data.text}")
                
                        # Also print the status code for reference
                        print(f"Status code: {send_data.status_code}")
                    except requests.exceptions.RequestException as e:
                        print(f"Error updating API: {e}")
    
            my_clothing = {
                "Blue Hoodie": 0,
                "HOSA Hoodie": 0,
                "Waterloo Hoodie": 0,
                "Yellow Hoodie": 0,
                "Yellow T-Shirt": 0,
                "Maroon T-Shirt": 0,
                "Blue Sweatpants": 0,
                "Gray Sweatpants": 0,
                "White Sweatpants": 0,
                "Navy Sweatpants": 0
            }
            last_time=currenttime
            stop_condition=True
            
        if show_gui and (cv2.waitKey(1) & 0xFF == ord('q')):
            break
        if stop_condition:
            break
            
    # Clean up
    emad.release()
    if show_gui:
        cv2.destroyAllWindows()
        
    return detecteditems
