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
    deleteClothes: (req, res) => {
        const id = req.params.id;
        ClothesModel.deleteClothes(id, (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }   
            res.status(200).json({ message: 'Clothes deleted successfully' });
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
        const { Name, Image, DaysBeforeWash, WearsBeforeWash, ConfiguredWears, Type, LastWashed } = req.body;

        console.log('Received request to upload:', { 
            Name, 
            ImageLength: Image ? Image.length : 'undefined', 
            DaysBeforeWash, 
            WearsBeforeWash, 
            ConfiguredWears, 
            Type,
            LastWashed: LastWashed || 'not provided'
        });
        
        ClothesModel.uploadClothingCatalog(
            null,
            Name,
            Image,
            DaysBeforeWash,
            WearsBeforeWash,
            ConfiguredWears,
            Type,
            LastWashed || null, // Use null if LastWashed is not provided
            (err) => {
                if (err) {
                    console.error('Error in uploadClothingCatalog:', err.message);
                    return res.status(500).json({ error: err.message });
                }   
                res.status(201).json({ message: 'Clothing catalog uploaded successfully' });
            }
        );
    },

    getClothingImage: (req, res) => {
        const name = req.params.name;
        
        ClothesModel.getClothingImage(name, (err, imageData) => {
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
        const { wearsBeforeWash, lastWashed} = req.body;
        
        if (wearsBeforeWash === undefined) {
            return res.status(400).json({ error: 'wearsBeforeWash is required' });
        }
        
        ClothesModel.updateClothingItem(name, wearsBeforeWash, lastWashed, (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            res.status(200).json({ 
                message: `Successfully updated wear count for item ${name}`,
                name: name,
                wearsBeforeWash: wearsBeforeWash,
                lastWashed: lastWashed || null
            });
        });
    },

    editClothingCatalog: (req, res) => {
        const name = req.params.name;
        const { ConfiguredWears } = req.body;
        ClothesModel.editClothingCatalog(name, ConfiguredWears, (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json({ message: 'Clothing catalog updated successfully' });
        });
        console.log(`Updated ConfiguredWears for item ${name} to ${ConfiguredWears}`);
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
    deleteLaundryList: (req, res) => {
        const id = req.params.id;
        ClothesModel.deleteLaundryList(id, (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json({ message: 'Laundry list deleted successfully' });
        });
    },
    deleteClothingCatalog: (req, res) => {
        const id = req.params.id;
        ClothesModel.deleteClothingCatalog(id, (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json({ message: 'Clothing catalog deleted successfully' });
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