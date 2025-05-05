# Track-My-Threads
Do you have trouble remembering what clothes need to be put in the laundry every week? Everyone has some sort of system, whether it is having a separate area to put worn clothes, perhaps designating clothes for certain days or uses, or the smell test (yikes), but it is still not that easy to remember.

TrackMyThreads is an app that I made to help myself keep track of what clothes I need to wash each week. The basic principle is that I log the clothing I wear every day, and the app keeps track of when I wear clothing and it will display a list of clothing I have worn too much without washing.

## How It Works
TrackMyThreads simplifies your laundry management through an intuitive mobile interface built with React Native and Expo. Here's how the app works:
Home Screen
The home screen features a calendar where you can select specific days and log what clothing items you wore. Simply select a date, tap "Add Clothes" and choose from your clothing catalog. This helps track your wear patterns over time and automatically calculates when items need washing.

### Clothing Catalog
The catalog serves as your digital wardrobe inventory. Each item is stored with:
- Name and type
- Image (if available)
- Maximum wears before washing (configurable)
- Current wear count
- Days since last wash
You can view detailed information about each item by tapping on it, which displays a popup with all relevant data and the item's image.

### Laundry Manager
The laundry manager automatically identifies clothing that needs washing based on two criteria:
Number of wears since last wash
Days elapsed since last wash
When an item reaches its configured maximum wears, it automatically appears in your laundry list. You can view all items that need washing in one convenient place and mark them as washed with a single tap of the "Mark All Washed" button.

## Technical Features
- React Native & Expo: Cross-platform mobile app that works on both iOS and Android
- SQLite Database: Local storage for your clothing items and wear history
- Node.js Backend: Express server handling data operations and image storage
- Custom REST API
- Figma Design
<br>
<br>
<br>
<br>
<br>
## Demo Video
[![TrackMyThreads](https://img.youtube.com/vi/RkRljqU5kR8/0.jpg)](https://www.youtube.com/watch?v=RkRljqU5kR8)
<br>
<br>
<br>
<br>
<br>
<div align="center">
  <img src="examples/IMG_5817.PNG" width="150" alt="Screenshot 1">
  <img src="examples/IMG_5818.PNG" width="150" alt="Screenshot 2">
  <img src="examples/IMG_5819.PNG" width="150" alt="Screenshot 3">
  <img src="examples/IMG_5820.PNG" width="150" alt="Screenshot 4">
  <img src="examples/IMG_5821.PNG" width="150" alt="Screenshot 5">
</div>
