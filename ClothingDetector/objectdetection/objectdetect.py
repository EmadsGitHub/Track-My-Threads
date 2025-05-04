import os, random, cv2
import supervision as sv
import IPython
import inference
import ultralytics
import time
import requests
import urllib.parse
from dotenv import load_dotenv
import socket
from datetime import datetime, date

load_dotenv()

from roboflow import Roboflow
# Check if dataset already exists

def get_client_ip():
    # Get the local machine's IP address
    try:
        # Create a socket connection to an external server
        # This doesn't actually establish a connection, but gets the local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))  # Google's DNS server
        ip = s.getsockname()[0]
        s.close()
        return ip.replace(".", "_")  # Replace dots with underscores
    except Exception:
        return "127_0_0_1"  # Default to localhost if there's an error

def detect_clothing(show_gui=False):
    highestvaluekeytops=""
    highestvaluekeypants=""
    stop_condition=False


    project_id = "niceworkspace/clothing-detection-uhmgf"  # Replace with your actual project ID
    dataset_version = "10" # Replace with your dataset version number

    model_id = project_id.split("/")[1] + "/" + dataset_version
    model = inference.get_model(model_id, os.getenv("ROBOFLOW_API_KEY"))

    # Location of test set images
    emad = cv2.VideoCapture('http://10.0.0.34:81/stream')
    
    # Check if camera opened successfully
    if not emad.isOpened():
        print("Error: Could not connect to camera stream")
        return []  # Return empty list if camera not available

    width = 640
    height = 360

    currentWearsDB = {}

    try:
        client_ip = "10.0.0.66"
        url = "http://10.0.0.116:3000/api/clothes/clothingcatalog"
        response = requests.get(url, headers={"X-Forwarded-For": client_ip.replace("_", "."), "Content-Type": "application/json"}, timeout=5)
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
        # Read a frame from the camera
        ret, frame = emad.read()
        
        # Check if frame was successfully read
        if not ret or frame is None:
            print("Error: Could not read frame from camera")
            break  # Exit the loop if we can't get frames
            
        # Now we can safely resize the frame
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
                # Use the machine's IP address instead of device ID
                client_ip = "10.0.0.66"
                print(f"Using client IP: {client_ip}")
                itemstoAdd = []
                today = date.today()
                for item in detecteditems:
                    print(f"You are wearing: {item}")
                    try:
                        encoded_clothing = urllib.parse.quote(item)
                        send_data = requests.put(
                            f'http://10.0.0.116:3000/api/clothes/{encoded_clothing}', 
                            json={"wearsBeforeWash": currentWearsDB.get(item, 0) + 1}, 
                            headers={"X-Forwarded-For": client_ip.replace("_", "."), "Content-Type": "application/json"},
                            timeout=5
                        )
                        
                        # Try to get JSON response regardless of status code
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

                    itemstoAdd.append(item)

                try:
                    send_data = requests.post(
                        f'http://10.0.0.116:3000/api/clothes', 
                        json={"date": today.isoformat(), "items": itemstoAdd}, 
                        headers={"X-Forwarded-For": client_ip.replace("_", "."), "Content-Type": "application/json"},
                        timeout=5
                    )
                    print(f"Response JSON: {send_data.json()}")
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
