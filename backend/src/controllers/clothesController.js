const ClothesModel = require('../models/clothesModel');
const fs = require('fs');
const path = require('path');

const ClothesController = {
    // Function to get all clothes
    getAllClothes: (req, res) => {
        ClothesModel.getAllClothes((err, clothes) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(clothes);
        });
    },

    getAllClothesFromCatalog: (req, res) => {
        ClothesModel.getAllClothesFromCatalog((err, clothes) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }   
            res.json(clothes);
        });
    },

    // Function to add clothes
    addClothes: (req, res) => {
        const { date, items } = req.body; // Expecting items to be an array
        ClothesModel.addClothes(date, items, (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: 'Clothes added successfully' });
        });
    },
    uploadClothing: (req, res) => {
        const { id, name, image, daysBeforeWash, wearsBeforeWash, configuredWears, type } = req.body;
        ClothesModel.uploadClothing(id, name, image, daysBeforeWash, wearsBeforeWash, configuredWears, type, (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: 'Clothing uploaded successfully' });
        });
    },  
    uploadClothingCatalog: (req, res) => {
        const { id, name, image, daysBeforeWash, wearsBeforeWash, configuredWears, type } = req.body;
        ClothesModel.uploadClothingCatalog(id, name, image, daysBeforeWash, wearsBeforeWash, configuredWears, type, (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }   
            res.status(201).json({ message: 'Clothing catalog uploaded successfully' });
        });
    },

    getClothingImage: (req, res) => {
        const id = req.params.id;
        
        ClothesModel.getClothingImage(id, (err, imageData) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            if (!imageData) {
                return res.status(404).json({ error: 'Image not found' });
            }
            
            // Convert the BLOB to base64 for transmission
            const base64Image = Buffer.from(imageData).toString('base64');
            
            // You can either send just the base64 string
            res.send(base64Image);
            
            // Or send it as JSON if preferred
            // res.json({ image: base64Image });
        });
    },
    
    // Function to update a clothing item's wear count
    updateClothingItem: (req, res) => {
        const name = req.params.name;
        const { wearsBeforeWash } = req.body;
        
        if (wearsBeforeWash === undefined) {
            return res.status(400).json({ error: 'wearsBeforeWash is required' });
        }
        
        ClothesModel.updateClothingItem(name, wearsBeforeWash, (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            res.status(200).json({ 
                message: `Successfully updated wear count for item ${name}`,
                name: name,
                wearsBeforeWash: wearsBeforeWash
            });
        });
    },
    
    // Function to clear the laundry list
    clearLaundryList: (req, res) => {
        ClothesModel.clearLaundryList((err, itemsCleared) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            res.status(200).json({ 
                message: 'Laundry list cleared successfully',
                itemsCleared: itemsCleared || 0
            });
        });
    },
    
    // Function to delete clothes
    deleteClothes: (req, res) => {
        const name = req.params.name;
        ClothesModel.deleteClothes(name, (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json({ message: 'Clothes deleted successfully' });
        });
    },
    createLaundryListTable: (req, res) => {
        ClothesModel.createLaundryListTable((err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json({ message: 'Laundry list table created successfully' });
        });
    },
    uploadLaundryList: (req, res) => {
        const { name, daysBeforeWash, wearsBeforeWash, configuredWears, type } = req.body;
        ClothesModel.uploadLaundryList(name, daysBeforeWash, wearsBeforeWash, configuredWears, type, (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: 'Laundry list item uploaded successfully' });
        });
    },
    getAllLaundryList: (req, res) => {
        ClothesModel.getAllLaundryList((err, laundryList) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(laundryList);
        });
    }
};

module.exports = ClothesController;