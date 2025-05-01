from flask import Flask, request, jsonify
import subprocess
import os
from objectdetect import detect_clothing

app = Flask(__name__)

@app.route('/trigger-detection', methods=['POST'])
def trigger_detection():
    # Run without GUI when triggered via HTTP
    detecteditems = detect_clothing(show_gui=False)
    return jsonify({"status": "success", "detecteditems": detecteditems})

if __name__ == '__main__':
    # Run on all network interfaces so ESP32 can connect
    app.run(host='0.0.0.0', port=5000, debug=True)
