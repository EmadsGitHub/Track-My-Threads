// src/models/clothesModel.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');


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

const createLaundryListTable = (db) => {
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS laundrylist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            image BLOB NOT NULL,
            daysBeforeWash INTEGER NOT NULL,
            wearsBeforeWash INTEGER NOT NULL,
            configuredWears INTEGER NOT NULL,
            type TEXT NOT NULL
        );
    `;
    db.run(createTableSQL, (err) => {
        if (err) {
            return console.error('Error creating table:', err.message);
        }
        console.log('Table "laundrylist" created or already exists.');
    });
};

// Function to create the clothes table
const createTable = (db) => {
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS clothes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            item TEXT NOT NULL
        );
    `;

    db.run(createTableSQL, (err) => {
        if (err) {
            return console.error('Error creating table:', err.message);
        }
        console.log('Table "clothes" created or already exists.');
    });
};

const createClothingCatalogTable = (db) => {  
    const createTableSQL = `

        CREATE TABLE IF NOT EXISTS clothingcatalog (
        "ID"	INTEGER UNIQUE,
        "Name"	TEXT NOT NULL UNIQUE,
        "Image"	BLOB NOT NULL UNIQUE,
        "DaysBeforeWash"	INTEGER NOT NULL,
        "WearsBeforeWash"	INTEGER NOT NULL,
        "ConfiguredWears"	INTEGER NOT NULL,
        "Type"	TEXT NOT NULL,
        "LastWashed"	TEXT,
        PRIMARY KEY("ID","Name","Image")
        );
    `;

    db.run(createTableSQL, (err) => {
        if (err) {
            return console.error('Error creating table:', err.message);
        }
        console.log('Table "clothingcatalog" created or already exists.');
    });
};
const uploadClothing=(db, id, name, image, daysBeforeWash, wearsBeforeWash, configuredWears, type, callback)=>{
    const sql = `
        INSERT INTO clothingcatalog (ID, Name, Image, DaysBeforeWash, WearsBeforeWash, ConfiguredWears, Type)
        VALUES (?, ?, ?, ?, ?, ?, ?);
    `;
    db.run(sql, [id, name, image, daysBeforeWash, wearsBeforeWash, configuredWears, type], function(err){
        if (err) {
            return callback(err);
        }
        console.log(`Uploaded clothing item with name ${name} and id ${id}`);
    });
}
// Function to add items to the database for a specific date
const addClothes = (db, date, items, callback) => {
    // Keep track of how many items have been processed
    let completedCount = 0;
    let hasError = false;
    
    // Handle case of empty items array
    if (items.length === 0) {
        return callback(null); // Success with no items
    }
    
    items.forEach(item => {
        const sql = `
            INSERT INTO clothes (date, item) 
            VALUES (?, ?)
        `;

        db.run(sql, [date, item], function(err) {
            // If we've already encountered an error, don't do anything more
            if (hasError) return;
            
            if (err) {
                hasError = true;
                return callback(err);
            }
            
            console.log(`Added ${item} for ${date}`);
            completedCount++;
            
            // If all items have been processed successfully, call the callback
            if (completedCount === items.length) {
                callback(null); // Success!
            }
        });
    });
};

const deleteLaundryList = (db, id, callback) => {
    const sql = `
        DELETE FROM laundrylist WHERE id = ?
    `;
    db.run(sql, [id], function(err) {
        if (err) {
            return callback(err);   
        }
        if (this.changes === 0) {
            return callback(new Error('Item not found'));
        }
        callback(null);
        console.log(`Deleted item with id ${id}`);
    });
    
    
};
// Function to get all clothes
const getAllClothesFromCatalog = (db, callback) => {
    db.all(
        `SELECT ID, Name, DaysBeforeWash, WearsBeforeWash, ConfiguredWears, Type, LastWashed 
         FROM clothingcatalog`,
        (err, rows) => {
          if (err) {
            callback(err, null);
            return;
          }
          callback(null, rows);
          
        }
      );
};

// Function to check clothing items and add them to laundry list if needed
const checkAndAddToLaundry = (db, callback) => {
    // First get all clothes from catalog
    getAllClothesFromCatalog(db, (err, clothingItems) => {
        if (err) {
            return callback(err);
        }
        
        // Track how many items need to be processed
        let itemsToProcess = 0;
        let processedItems = 0;
        let errors = [];
        
        // Check each item to see if it needs washing
        clothingItems.forEach(item => {
            // If item has reached configured wears limit, add to laundry list
            if (item.WearsBeforeWash >= item.ConfiguredWears) {
                itemsToProcess++;
                console.log(`Adding ${item.Name} to laundry list`);
                // Add to laundry list
                uploadLaundryList(
                    db, 
                    item.Name, 
                    item.DaysBeforeWash, 
                    item.WearsBeforeWash, 
                    item.ConfiguredWears, 
                    item.Type, 
                    (err) => {
                        processedItems++;
                        
                        if (err) {
                            errors.push(err);
                        }
                        
                        // Check if all items have been processed
                        if (processedItems === itemsToProcess) {
                            if (errors.length > 0) {
                                callback(errors[0], null); // Return the first error, clothes items, and count
                            } else {
                                callback(null, clothingItems); // Return clothes items and count of items added
                            }
                        }
                    }
                );
            }
        });
        
        // If no items needed washing, call the callback immediately with all clothing items
        if (itemsToProcess === 0) {
            callback(null, clothingItems);
        }
    });
};

const getAllClothes = (db, callback) => {
    db.all(
        `SELECT * FROM clothes`,
        (err, rows) => {
            callback(err, rows);
        }   
    );
};

const deleteClothes = (db, id, callback) => {
    const sql = `DELETE FROM clothes WHERE id = ?`;
    db.run(sql, [id], function(err) {
        if (err) {
            return callback(err);
        }
        if (this.changes === 0) {
            return callback(new Error('Item not found'));
        }
        callback(null);
    });
};

const uploadClothingCatalog = (db, id, name, image, daysBeforeWash, wearsBeforeWash, configuredWears, type, lastWashed, callback) => {
    // Convert base64 image to buffer if it's a string (from frontend)
    let imageBuffer;
    
    try {
        if (!image) {
            console.error('Image data is undefined or null');
            return callback && callback(new Error('Image data is required'));
        }
        
        if (typeof image === 'string') {
            // Check if the image is already a base64 string
            if (image.startsWith('data:image')) {
                // Extract the base64 part if it's a data URL
                const base64Data = image.split(',')[1];
                imageBuffer = Buffer.from(base64Data, 'base64');
            } else {
                // Assume it's already a base64 string without the data URL prefix
                imageBuffer = Buffer.from(image, 'base64');
            }
            console.log(`Converted base64 image to buffer for ${name}, size: ${imageBuffer.length} bytes`);
        } else if (Buffer.isBuffer(image)) {
            // If it's already a buffer, use it as is
            imageBuffer = image;
            console.log(`Using existing buffer for ${name}, size: ${imageBuffer.length} bytes`);
        } else if (typeof image === 'object') {
            // If it's an object (maybe from multer or another middleware), try to get the buffer
            imageBuffer = image.buffer || image;
            console.log(`Using buffer from object for ${name}`);
        } else {
            throw new Error('Invalid image format. Expected base64 string or buffer.');
        }
        
        const sql = `
            INSERT INTO clothingcatalog (Name, Image, DaysBeforeWash, WearsBeforeWash, ConfiguredWears, Type, LastWashed)
            VALUES (?, ?, ?, ?, ?, ?, ?);
        `;
        
        db.run(sql, [name, imageBuffer, daysBeforeWash, wearsBeforeWash, configuredWears, type, lastWashed], function(err) {
            if (err) {
                console.error(`Error uploading clothing item ${name}:`, err.message);
                return callback && callback(err);
            }
            console.log(`Uploaded clothing catalog item with name ${name}`);
            return callback && callback(null, this.lastID);
        });
    } catch (error) {
        console.error(`Error processing image for ${name}:`, error.message);
        return callback && callback(error);
    }
}

// Function to update a clothing item in the catalog
const updateClothingItem = (db, name, wearsBeforeWash, lastWashed, callback) => {
    console.log(`Updating clothing item ${name} to set wear count to ${wearsBeforeWash} and last washed to ${lastWashed || 'null'}`);
    
    // If lastWashed is provided, update it along with the wear count
    const sql = lastWashed ? 
        `UPDATE clothingcatalog 
         SET WearsBeforeWash = ?, LastWashed = ? 
         WHERE Name = ?` :
        `UPDATE clothingcatalog 
         SET WearsBeforeWash = ? 
         WHERE Name = ?`;
    
    const params = lastWashed ? 
        [wearsBeforeWash, lastWashed, name] : 
        [wearsBeforeWash, name];
    
    db.run(sql, params, function(err) {
        if (err) {
            console.error(`Error updating clothing item ${name}:`, err.message);
            return callback(err);
        }
        
        if (this.changes === 0) {
            console.log(`No item found with name ${name} to update`);
            return callback(new Error(`Item with name ${name} not found`));
        }
        
        console.log(`Successfully updated wear count for item ${name} to ${wearsBeforeWash}${lastWashed ? ` and LastWashed to ${lastWashed}` : ''}`);
        
    });
    getAllClothesFromCatalog(db, (err, clothingItems) => {
        if (err) {
            return callback(err);
        }
        
        // Track how many items need to be processed
        let itemsToProcess = 0;
        let processedItems = 0;
        let errors = [];
        
        // Check each item to see if it needs washing
        clothingItems.forEach(item => {
            // If item has reached configured wears limit, add to laundry list
            if (item.WearsBeforeWash >= item.ConfiguredWears) {
                itemsToProcess++;
                console.log(`Adding ${item.Name} to laundry list`);
                // Add to laundry list
                uploadLaundryList(
                    db, 
                    item.Name, 
                    item.DaysBeforeWash, 
                    item.WearsBeforeWash, 
                    item.ConfiguredWears, 
                    item.Type, 
                    (err) => {
                        processedItems++;
                        
                        if (err) {
                            errors.push(err);
                        }

                    }
                );
            }
        });
        callback(null); 
    })
    
};

const editClothingCatalog = (db, name, ConfiguredWears, callback) => {
    console.log(`Attempting to update ConfiguredWears for item ${name} to ${ConfiguredWears}`);
    
    const sql = `UPDATE clothingcatalog SET ConfiguredWears = ? WHERE Name = ?`;
    
    db.run(sql, [ConfiguredWears, name], function(err) {
        if (err) {
            console.error(`Error updating ConfiguredWears for ${name}:`, err.message);
            return callback(err);
        }
        
        if (this.changes === 0) {
            console.log(`No item found with name ${name} to update ConfiguredWears`);
            return callback(new Error(`Item with name ${name} not found`));
        }
        
        console.log(`Successfully updated ConfiguredWears for item ${name} to ${ConfiguredWears}`);
        callback(null);
    });
};

// Function to clear the laundry list
const clearLaundryList = (db, callback) => {
    console.log('Clearing all items from laundry list');
    const sql = `DELETE FROM laundrylist`;
    
    db.run(sql, function(err) {
        if (err) {
            console.error('Error clearing laundry list:', err.message);
            return callback(err);
        }
        
        console.log(`Cleared ${this.changes} items from laundry list`);
        callback(null, this.changes);
    });
};

const deleteClothingCatalog = (db, id, callback) => {
    const sql = `DELETE FROM clothingcatalog WHERE ID = ?`;
    db.run(sql, [id], function(err) {
        callback(err);
    });
    console.log(`Deleted clothing catalog item with id ${id}`);
};

const getClothingImage = (db, name, callback) => {
    db.get(
        `SELECT Image FROM clothingcatalog WHERE Name = ?`,
        [name],
        (err, row) => {
            if (err) {
                callback(err, null);
                return;
            }
            if (!row) {
                callback(new Error('Item not found'), null);
                return;
            }
            callback(null, row.Image);
        }
    );
};
const uploadLaundryList = (db, name, daysBeforeWash, wearsBeforeWash, configuredWears, type, callback = () => {}) => {
        // Find the matching item in myClothing array
    let matchingItem = myClothing.find(item => item.name === name);
    
    if (!matchingItem) {
        return callback(new Error(`No matching clothing item found for ${name}`));
    }
    
    try {
        // Use the correct path resolution like in the seeding file
        // Note: This resolves the path properly without duplicating 'backend'
        const imagePath = matchingItem.image.replace(/^backend\//, '');
        const imageBuffer = fs.readFileSync(path.resolve(process.cwd(), imagePath));
        
        const sql = `
            INSERT OR REPLACE INTO laundrylist (name, image, daysBeforeWash, wearsBeforeWash, configuredWears, type)
            VALUES (?, ?, ?, ?, ?, ?);
        `;
        
        db.run(sql, [name, imageBuffer, daysBeforeWash, wearsBeforeWash, configuredWears, type], function(err) {
            if (err) {
                console.error(`Error uploading laundry list item ${name}:`, err.message);
                return callback(err);
            }
            console.log(`Uploaded laundry list item with name ${name}`);
            callback(null);
        });
    } catch (error) {
        console.error(`Error reading image file for ${name}:`, error.message);
        return callback(error);
    }
};

const getAllLaundryList = (db, callback) => {
    db.all(
        `SELECT id, name, daysBeforeWash, wearsBeforeWash, configuredWears, type FROM laundrylist`,
        (err, rows) => {
            callback(err, rows);
        }
    );
};
// Initialize the database and create the table
const initializeTables = (db, callback) => {
    // Create all your tables
    createTable(db);
    createClothingCatalogTable(db);
    createLaundryListTable(db);
    
    // Call the callback when done
    if (callback) callback(null);
};
// Export the model functions
module.exports = {
    addClothes,
    getAllClothes,
    getAllClothesFromCatalog,
    deleteLaundryList,
    uploadClothing,
    createClothingCatalogTable,
    getClothingImage,
    createLaundryListTable,
    uploadLaundryList,
    getAllLaundryList,
    uploadClothingCatalog,
    updateClothingItem,
    clearLaundryList,
    deleteClothingCatalog,
    deleteClothes,
    editClothingCatalog,
    initializeTables,
    checkAndAddToLaundry
};