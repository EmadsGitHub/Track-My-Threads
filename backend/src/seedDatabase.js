/**
 * This script adds mock data to the database.
 * It creates an array of clothing items and randomly selects 3 items to add to the database.
 */

const sqlite3 = require('sqlite3').verbose();

// Array of clothing items that can be randomly selected
const myClothing = [
    "HOSA Hoodie", 
    "Waterloo Hoodie", 
    "Blue Hoodie", 
    "Yellow Hoodie", 
    "Blue Sweatpants", 
    "White Sweatpants", 
    "Navy Sweatpants", 
    "Gray Sweatpants", 
    "Yellow T-Shirt", 
    "Maroon T-Shirt",
];

// Open the database
const db = new sqlite3.Database('C:/Users/elina/Track-My-Threads/backend/clothes.db');

// Get today's date formatted as YYYY-MM-DD
const today = new Date().toISOString().split('T')[0];

// Function that returns random items from an array
const getRandomItems = (arr, count) => {
    // Create copy of array and shuffle it randomly
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    // Return first 'count' items
    return shuffled.slice(0, count);
};

// Function to add items to database for a specific date
const addOrReplaceData = (date, items) => {
    // For each clothing item
    items.forEach(item => {
        // SQL query to insert item, ignore if already exists
        const sql = `
            INSERT INTO clothes (date, item) 
            VALUES (?, ?)
        `;

        // Execute the SQL query
        db.run(sql, [date, item], function(err) {
            if (err) {
                return console.error('Error executing SQL:', err.message);
            }
            console.log(`Added ${item} for ${date}`);
        });
    });
};

// Make sure the table exists
db.run(`
    CREATE TABLE IF NOT EXISTS clothes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        item TEXT NOT NULL
    );
`, (err) => {
    if (err) {
        return console.error('Error creating table:', err.message);
    }
    console.log('Table "clothes" created or already exists.');
    
    // Get 3 random clothing items and add them for today
    const todaysClothes = getRandomItems(myClothing, 3);
    console.log('Selected clothes for today:', todaysClothes);
    addOrReplaceData(today, todaysClothes);
    
    // Close database connection after 1 second
    // (giving time for async operations to complete)
    setTimeout(() => {
        db.close();
        console.log('Database connection closed.');
    }, 1000);
}); 