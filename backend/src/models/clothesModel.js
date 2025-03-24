// src/models/clothesModel.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Use a path relative to the current file
const dbPath = path.resolve(__dirname, '../../clothes.db');

console.log('Database path:', dbPath);

// Open the database
const db = new sqlite3.Database(dbPath);

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

const createLaundryListTable = () => {
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
const createTable = () => {
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

const createClothingCatalogTable = () => {  
    const createTableSQL = `

        CREATE TABLE IF NOT EXISTS clothingcatalog (
        "ID"	INTEGER UNIQUE,
        "Name"	TEXT NOT NULL UNIQUE,
        "Image"	BLOB NOT NULL UNIQUE,
        "DaysBeforeWash"	INTEGER NOT NULL,
        "WearsBeforeWash"	INTEGER NOT NULL,
        "ConfiguredWears"	INTEGER NOT NULL,
        "Type"	TEXT NOT NULL,
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
const uploadClothing=(id, name, image, daysBeforeWash, wearsBeforeWash, configuredWears, type, callback)=>{
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
const addClothes = (date, items, callback) => {
    items.forEach(item => {
        const sql = `
            INSERT INTO clothes (date, item) 
            VALUES (?, ?)
        `;

        db.run(sql, [date, item], function(err) {
            if (err) {
                return callback(err);
            }
            console.log(`Added ${item} for ${date}`);
        });
    });
};

const deleteClothes = (name, callback) => {
    const sql = `
        DELETE FROM clothes WHERE name = ?
    `;
    db.run(sql, [name], function(err) {
        if (err) {
            return callback(err);   
        }
        if (this.changes === 0) {
            return callback(new Error('Item not found'));
        }
        callback(null);
        console.log(`Deleted item with name ${name}`);
    });
    
    
};
// Function to get all clothes
const getAllClothesFromCatalog = (callback) => {
    db.all(
        `SELECT ID, Name, DaysBeforeWash, WearsBeforeWash, ConfiguredWears, Type 
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

const getAllClothes = (callback) => {
    db.all(
        `SELECT * FROM clothes`,
        (err, rows) => {
            callback(err, rows);
        }   
    );
};

const uploadClothingCatalog = (id, name, image, daysBeforeWash, wearsBeforeWash, configuredWears, type, callback) => {
    const sql = `
        INSERT INTO clothingcatalog (ID, Name, Image, DaysBeforeWash, WearsBeforeWash, ConfiguredWears, Type)
        VALUES (?, ?, ?, ?, ?, ?, ?);
    `;
        db.run(sql, [name, image, daysBeforeWash, wearsBeforeWash, configuredWears, type], function(err){
        if (err) {
            return callback(err);
        }
        console.log(`Uploaded clothing catalog item with name ${name} and id ${id}`);
    }); 
}

// Function to update a clothing item in the catalog
const updateClothingItem = (name, wearsBeforeWash, callback) => {
    console.log(`Updating clothing item ${name} to set wear count to ${wearsBeforeWash}`);
    const sql = `
        UPDATE clothingcatalog 
        SET WearsBeforeWash = ? 
        WHERE Name = ?
    `;
    
    db.run(sql, [wearsBeforeWash, name], function(err) {
        if (err) {
            console.error(`Error updating clothing item ${name}:`, err.message);
            return callback(err);
        }
        
        if (this.changes === 0) {
            console.log(`No item found with name ${name} to update`);
            return callback(new Error(`Item with name ${name} not found`));
        }
        
        console.log(`Successfully updated wear count for item ${name} to ${wearsBeforeWash}`);
        callback(null);
    });
};

// Function to clear the laundry list
const clearLaundryList = (callback) => {
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

const getClothingImage = (id, callback) => {
    db.get(
        `SELECT Image FROM clothingcatalog WHERE ID = ?`,
        [id],
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
const uploadLaundryList = (name, daysBeforeWash, wearsBeforeWash, configuredWears, type, callback = () => {}) => {
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

const getAllLaundryList = (callback) => {
    db.all(
        `SELECT id, name, daysBeforeWash, wearsBeforeWash, configuredWears, type FROM laundrylist`,
        (err, rows) => {
            callback(err, rows);
        }
    );
};
// Initialize the database and create the table
createTable();
createClothingCatalogTable();
createLaundryListTable();
// Export the model functions
module.exports = {
    addClothes,
    getAllClothes,
    getAllClothesFromCatalog,
    deleteClothes,
    uploadClothing,
    createClothingCatalogTable,
    getClothingImage,
    createLaundryListTable,
    uploadLaundryList,
    getAllLaundryList,
    uploadClothingCatalog,
    updateClothingItem,
    clearLaundryList
};