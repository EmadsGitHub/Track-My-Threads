// Import required packages
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Import myClothing array
const { myClothing } = require('./seedDatabase.js');

// Function to read an image file and convert it to a buffer
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

// Main function to seed the database
async function seedClothingCatalog(deviceId = 'default') {
  // Create database directory if it doesn't exist
  if (!fs.existsSync('./databases')) {
    fs.mkdirSync('./databases');
  }
  
  // Create database connection for the specific device
  const dbPath = path.resolve(__dirname, `./databases/user_${deviceId}.db`);
  console.log(`Using database: ${dbPath}`);
  const db = new sqlite3.Database(dbPath);

  // Create the clothingcatalog table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS clothingcatalog (
      "ID" INTEGER PRIMARY KEY AUTOINCREMENT,
      "Name" TEXT NOT NULL UNIQUE,
      "Image" BLOB NOT NULL,
      "DaysBeforeWash" INTEGER NOT NULL,
      "WearsBeforeWash" INTEGER NOT NULL,
      "ConfiguredWears" INTEGER NOT NULL,
      "Type" TEXT NOT NULL,
      "LastWashed" TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Error creating table:', err.message);
      db.close();
      return;
    }
    
    console.log('Table "clothingcatalog" created or already exists.');
    
    // Insert clothing items
    const insertClothingItem = db.prepare(`
      INSERT OR REPLACE INTO clothingcatalog 
      (Name, Image, DaysBeforeWash, WearsBeforeWash, ConfiguredWears, Type)
      VALUES (?, ?, ?, ?, ?, ?)
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
      }
    });
  });
}

// If running this script directly
if (require.main === module) {
  // Get device ID from command line arguments or use default
  const deviceId = process.argv[2] || 'default';
  
  console.log(`Seeding clothing catalog for device: ${deviceId}`);
  seedClothingCatalog(deviceId).then(() => {
    console.log('Seeding process initiated.');
  }).catch(err => {
    console.error('Error in seeding process:', err);
  });
}

// Export for use in other files
module.exports = { seedClothingCatalog }; 