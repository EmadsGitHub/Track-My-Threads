from objectdetection.objectdetect import detect_clothing

if __name__ == "__main__":
    # Run with GUI for interactive testing
    detected_items = detect_clothing(show_gui=True)
    print(f"Detected items: {detected_items}") 