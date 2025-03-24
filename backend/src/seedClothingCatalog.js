const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Array of clothing items that can be randomly selected
const myClothing = [
    {name: "Blue Hoodie", image: "backend/src/imagefolder/bluehoodie.png", daysBeforeWash: 0, wearsBeforeWash: 0, configuredWears: 2, type: "Top"},
    {name: "Yellow Hoodie", image: "backend/src/imagefolder/yellowhoodie.png", daysBeforeWash: 0, wearsBeforeWash: 0, configuredWears: 2, type: "Top"},
    {name:"HOSA Hoodie", image: "backend/src/imagefolder/hosahoodie.png", daysBeforeWash: 0, wearsBeforeWash: 0, configuredWears: 2, type: "Top"},
    {name: "Waterloo Hoodie", image: "backend/src/imagefolder/waterloohoodie.png", daysBeforeWash: 0, wearsBeforeWash: 0, configuredWears: 2, type: "Top"},
    {name: "White Sweatpants", image: "backend/src/imagefolder/whitesweatpants.png", daysBeforeWash: 0, wearsBeforeWash: 0, configuredWears: 2, type: "Bottom"},
    {name: "Blue Sweatpants", image: "backend/src/imagefolder/bluesweatpants.png", daysBeforeWash: 0, wearsBeforeWash: 0, configuredWears: 2, type: "Bottom"},
    {name: "Gray Sweatpants", image: "backend/src/imagefolder/graysweatpants.png", daysBeforeWash: 0, wearsBeforeWash: 0, configuredWears: 2, type: "Bottom"},
    {name: "Navy Sweatpants", image: "backend/src/imagefolder/navysweatpants.png", daysBeforeWash: 0, wearsBeforeWash: 0, configuredWears: 2, type: "Bottom"},
    {name: "Yellow T-Shirt", image: "backend/src/imagefolder/yellowtshirt.png", daysBeforeWash: 0, wearsBeforeWash: 0, configuredWears: 2, type: "Top"}, 
    {name: "Maroon T-Shirt", image: "backend/src/imagefolder/maroontshirt.png", daysBeforeWash: 0, wearsBeforeWash: 0, configuredWears: 2, type: "Top"},
];

// Function to insert clothing items into the database
const insertClothingItems = (db) => {
    // Create a promise array for each insertion
    const promises = myClothing.map(item => {
        return new Promise((resolve, reject) => {
            // Read the image file as a buffer
            try {
                // Read the image file as a buffer
                const imageBuffer = fs.readFileSync(path.resolve(process.cwd(), item.image));
                
                const sql = `
                    INSERT INTO clothingcatalog (name, image, daysBeforeWash, wearsBeforeWash, configuredWears, type) 
                    VALUES (?, ?, ?, ?, ?, ?)
                `;

                // Execute the SQL query with the image buffer
                db.run(sql, [item.name, imageBuffer, item.daysBeforeWash, item.wearsBeforeWash, item.configuredWears, item.type], function(err) {
                    if (err) {
                        console.error(`Error inserting ${item.name}:`, err.message);
                        reject(err);
                    } else {
                        console.log(`Added ${item.name} to the database with image as BLOB`);
                        resolve();
                    }
                });
            } catch (error) {
                console.error(`Error reading image file for ${item.name}:`, error.message);
                reject(error);
            }
        });
    });

    // Wait for all insertions to complete
    return Promise.all(promises);
};

// Function to retrieve and save an image from the database to test it worked
const retrieveAndSaveImage = (db, name, outputPath) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT "Image" as image FROM clothingcatalog WHERE "Name" = ?`;
        db.get(sql, [name], (err, row) => {
            if (err) {
                console.error('Error executing SQL:', err.message);
                reject(err);
                return;
            }
            
            if (!row) {
                console.error(`No image found for ${name}`);
                reject(new Error(`No image found for ${name}`));
                return;
            }
            
            // Save the retrieved image buffer to a file to verify it works
            try {
                fs.writeFileSync(outputPath, row.image);
                console.log(`Successfully retrieved and saved image for ${name} to ${outputPath}`);
                resolve();
            } catch (error) {
                console.error(`Error saving retrieved image for ${name}:`, error.message);
                reject(error);
            }
        });
    });
};

// Function to seed the database
const seedDatabase = (db) => {
    // Convert from async/await to .then() and .catch()
    retrieveAndSaveImage(db, "Maroon T-Shirt", path.join(path.resolve(process.cwd(), 'backend/src/output'), 'retrieved_hoodie.png'))
        .then(() => {
            console.log('Database seeding completed successfully!');
            db.close((err) => {
                if (err) {
                    return console.error('Error closing database:', err.message);
                }
                console.log('Database connection closed.');
            });
        })
        .catch((error) => {
            console.error('Error during database seeding:', error);
            db.close();
        });
};

// Connect to the database
const db = new sqlite3.Database("C:/Users/elina/Track-My-Threads/backend/clothes.db");

// Seed the database
seedDatabase(db);

    // Close the database connection when the script finishes
process.on('exit', () => {
    db.close((err) => {
        if (err) {
            return console.error('Error closing database:', err.message);
        }
        console.log('Database connection closed.');
    });
});

