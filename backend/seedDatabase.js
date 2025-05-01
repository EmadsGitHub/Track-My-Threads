const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const myClothing = [
    {name: "Blue Hoodie", image: "src/imagefolder/bluehoodie.png", daysBeforeWash: 0, wearsBeforeWash: 0, configuredWears: 5, type: "Top", lastWashed: null},
    {name: "Yellow Hoodie", image: "src/imagefolder/yellowhoodie.png", daysBeforeWash: 0, wearsBeforeWash: 0, configuredWears: 5, type: "Top", lastWashed: null},
    {name:"HOSA Hoodie", image: "src/imagefolder/hosahoodie.png", daysBeforeWash: 0, wearsBeforeWash: 0, configuredWears: 5, type: "Top", lastWashed: null},
    {name: "Waterloo Hoodie", image: "src/imagefolder/waterloohoodie.png", daysBeforeWash: 0, wearsBeforeWash: 0, configuredWears: 5, type: "Top", lastWashed: null},
    {name: "White Sweatpants", image: "src/imagefolder/whitesweatpants.png", daysBeforeWash: 0, wearsBeforeWash: 0, configuredWears: 3, type: "Bottom", lastWashed: null},
    {name: "Blue Sweatpants", image: "src/imagefolder/bluesweatpants.png", daysBeforeWash: 0, wearsBeforeWash: 0, configuredWears: 3, type: "Bottom", lastWashed: null},
    {name: "Gray Sweatpants", image: "src/imagefolder/graysweatpants.png", daysBeforeWash: 0, wearsBeforeWash: 0, configuredWears: 3, type: "Bottom", lastWashed: null},
    {name: "Navy Sweatpants", image: "src/imagefolder/navysweatpants.png", daysBeforeWash: 0, wearsBeforeWash: 0, configuredWears: 3, type: "Bottom", lastWashed: null},
    {name: "Yellow T-Shirt", image: "src/imagefolder/yellowtshirt.png", daysBeforeWash: 0, wearsBeforeWash: 0, configuredWears: 2, type: "Top", lastWashed: null}, 
    {name: "Maroon T-Shirt", image: "src/imagefolder/maroontshirt.png", daysBeforeWash: 0, wearsBeforeWash: 0, configuredWears: 2, type: "Top", lastWashed: null},
];

function readImageFile(imagePath) {
    try {
      // Get absolute path
      const absolutePath = path.resolve(__dirname, imagePath);
      console.log(`Reading image from ${absolutePath}`);
      
      if (fs.existsSync(absolutePath)) {
        return fs.readFileSync(absolutePath);
      } else {
        console.error(`Image file not found: ${absolutePath}`);
        // Return a placeholder or default image
        return fs.readFileSync(path.resolve(__dirname, 'src/imagefolder/placeholder.png'));
      }
    } catch (error) {
      console.error(`Error reading image file: ${error.message}`);
      return null;
    }
  }

async function seedDatabase() {
    const db = new sqlite3.Database('backend/databases/user_10_0_0_116.db');
    const insertClothingItem = db.prepare(`
        INSERT OR REPLACE INTO clothingcatalog 
        (Name, Image, DaysBeforeWash, WearsBeforeWash, ConfiguredWears, Type, LastWashed)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      // Process each clothing item
      let completed = 0;
      
      myClothing.forEach((item) => {
        try {
          // Read the image file
          const imageBuffer = readImageFile(item.image);
          
          if (!imageBuffer) {
            console.log(`Skipping ${item.name} due to missing image`);
            completed++;
            return;
          }
          
          // Insert the item into the database
          insertClothingItem.run(
            item.name,
            imageBuffer,
            item.daysBeforeWash,
            item.wearsBeforeWash,
            item.configuredWears,
            item.type,
            item.lastWashed,
            function(err) {
              completed++;
              
              if (err) {
                console.error(`Error inserting ${item.name}:`, err.message);
              } else {
                console.log(`Successfully inserted ${item.name}`);
              }
              
              // Check if all items are processed
              if (completed === myClothing.length) {
                // Close the prepared statement
                insertClothingItem.finalize();
                
                // Close the database connection
                db.close(() => {
                  console.log('Database connection closed.');
                });
              }
            }
          );
        } catch (error) {
          console.error(`Error processing ${item.name}:`, error.message);
          completed++;
        }});
    db.close();
}

seedDatabase();