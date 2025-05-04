from flask import Flask, request, jsonify
import subprocess
import os
import requests
from objectdetect import detect_clothing, get_client_ip

app = Flask(__name__)

@app.route('/trigger-detection', methods=['POST'])
def trigger_detection():
    # Run without GUI when triggered via HTTP
    detecteditems = detect_clothing(show_gui=False)
    return jsonify({"status": "success", "detecteditems": detecteditems})

@app.route('/laundry-list', methods=['GET'])
def laundry_list():
    # Use IP address instead of device ID
    client_ip = "10.0.0.66"
    headers = {
        'X-Forwarded-For': client_ip.replace("_", "."),
        'Content-Type': 'application/json',
    }
    try:
        response = requests.get('http://10.0.0.116:3000/api/clothes/laundrylist', headers=headers)
        return response.json()
    except requests.exceptions.RequestException:
        return jsonify({"status": "error", "message": "Failed to fetch laundry list"})

if __name__ == '__main__':
    # Run on all network interfaces so ESP32 can connect
    app.run(host='0.0.0.0', port=5000, debug=True)
