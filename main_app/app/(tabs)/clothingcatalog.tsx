import { 
    MaterialIcons,
    FontAwesome,
    Ionicons,
    AntDesign,
    Feather
} from '@expo/vector-icons';
import Entypo from '@expo/vector-icons/Entypo';
import React, { useEffect, useState } from 'react';
import { Dimensions, Platform, PixelRatio, FlatList } from 'react-native';
import SideBanner from '../components/sidebanner';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity,
    ScrollView,
    Image,
    Modal
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { api } from '../../services/api';

// Define the ClothingItem interface to match your API response
interface ClothingItem {
    ID: number;
    Name: string;
    image: string;
    DaysBeforeWash: number;
    WearsBeforeWash: number;
    ConfiguredWears: number;
    Type: string;
    lastWashed: string | null;
}

// Get device dimensions for responsive design
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Normalize function for consistent sizing across different screen sizes
const normalize = (size: number) => {
    const scale = SCREEN_WIDTH / 375; // Base scale on iPhone 8 width
    const newSize = size * scale;
    
    // Different scaling for iOS and Android
    if (Platform.OS === 'ios') {
        // Check if device is a tablet (iPad)
        const isTablet = SCREEN_WIDTH > 768;
        return isTablet ? Math.round(newSize * 0.8) : Math.round(newSize);
    } else {
        return Math.round(PixelRatio.roundToNearestPixel(newSize));
    }
};

// Calculate responsive dimensions
const responsiveWidth = (percentage: number) => {
    return SCREEN_WIDTH * (percentage / 100);
};

const responsiveHeight = (percentage: number) => {
    return SCREEN_HEIGHT * (percentage / 100);
};

const retrieveClothingItems = async () => {
    try {
        
        const data = await api.getAllClothesFromCatalog();
        
        return data;
    } catch (error) {
        console.error('Error fetching clothing items:', error);
        return [];
    }
};

const loadItemImage = async (itemName: string): Promise<string> => {
    try {

        // The response is just the base64 string
        const base64Image = await api.getClothingImage(itemName);
        return base64Image;
    } catch (error) {
        console.error(`Error loading image for item ${itemName}:`, error);
        return "";
    }
};

// Main ClothingCatalog component
const ClothingCatalog = () => {
    const [isSideMenuVisible, setIsSideMenuVisible] = useState(false);
    const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [itemImages, setItemImages] = useState<{ [key: number]: string }>({}); // State to hold images
    const [imagePopupVisible, setImagePopupVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [imageData, setImageData] = useState<string | null>(null);
    const [itemDetails, setItemDetails] = useState<ClothingItem | null>(null);
    
    // New states for adding items
    const [addItemModalVisible, setAddItemModalVisible] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemWears, setNewItemWears] = useState('');
    const [newItemType, setNewItemType] = useState('');
    const [newItemImage, setNewItemImage] = useState<string | null>(null);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [isConfigurationMode, setIsConfigurationMode] = useState(false);
    const [newConfiguredWears, setNewConfiguredWears] = useState(0);

    const handleItemPress = async (itemId: number) => {
        // Find the item first
        console.log(clothingItems);
        const item = clothingItems.find(item => item.ID === itemId) || null;
        
        // Set the selected item
        setSelectedItem(item);
        setImagePopupVisible(true);
        setImageLoading(true);
        
        // Clear previous image data when opening a new modal
        setImageData(null);
        
        // Use the item directly instead of relying on selectedItem state
        const loadImage = async () => {
            if (item) {
                const image = await loadItemImage(item.Name);
                
                setImageData(image);
            }
            setImageLoading(false);
        };
        loadImage();
    };

    const toggleDeleteMode = () => {
        setIsDeleteMode(!isDeleteMode);
    };

    const handleDeleteItem = async (itemId: number) => {
        try{
            await api.deleteClothingCatalog(itemId.toString());
        } catch (error) {
            console.error('Error deleting item:', error);
        }
        const items = await retrieveClothingItems();
        setClothingItems(items);
    };

    const handleConfiguration = async (item: ClothingItem) => {
        console.log("handleConfiguration called with item:", item.Name);
        
        // First, set the configured wears and the selected item
        setNewConfiguredWears(item.ConfiguredWears);
        setSelectedItem(item);
        
        // Close the details modal first
        setImagePopupVisible(false);
        
        // Use a longer timeout to ensure the first modal is fully closed
        setTimeout(() => {
            console.log("Opening configuration modal for:", item.Name);
            setIsConfigurationMode(true);
        }, 300);
    };

    // Function to pick image from camera roll
    const pickImage = async () => {
        // Ask for permission first
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (status !== 'granted') {
            alert('Sorry, we need camera roll permissions to make this work!');
            return;
        }
        
        // Launch image picker
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
            base64: true,
        });
        
        if (!result.canceled) {
            // Get base64 data from the selected image
            const base64Image = result.assets[0].base64;
            if (base64Image) {
                setNewItemImage(base64Image);
            }
        }
    };
    
    // Function to handle adding a new item
    const handleAddItem = async () => {
        // Validate input
        if (!newItemName || !newItemWears || !newItemType) {
            alert('Please fill in all fields');
            return;
        }
        
        if (!newItemImage) {
            alert('Please select an image');
            return;
        }
        
        // Check image data
        console.log(`Image data length: ${newItemImage.length} characters`);
        
        // Create the item object with explicit typing
        const myNewClothingItem = {
            Name: newItemName,
            WearsBeforeWash: 0,
            DaysBeforeWash: 0,
            ConfiguredWears: parseInt(newItemWears),
            Type: newItemType,
            lastWashed: null,
            // Make sure image is properly formatted
            Image: newItemImage
        };
        
        console.log("Sending new clothing item to server...");
        console.log(`Item name: ${myNewClothingItem.Name}`);
        console.log(`Item type: ${myNewClothingItem.Type}`);
        try {
            // Send the request to add the item
            await api.uploadClothingCatalog(myNewClothingItem);
            
                
                // Refresh clothing items list
            const items = await retrieveClothingItems();
            setClothingItems(items);
                
                // Load images for new items
            const images = { ...itemImages };
            for (const item of items) {
                if (!images[item.ID]) {
                    const image = await loadItemImage(item.Name);
                    if (image) {
                        images[item.ID] = image;
                    }
                }
            }
            setItemImages(images);
                
                // Reset form and close modal
            setNewItemName('');
            setNewItemWears('');
            setNewItemType('');
            setNewItemImage(null);
            setAddItemModalVisible(false);
        } catch (error: any) {
            console.error('Error adding item:', error);
            alert('An error occurred while adding the item: ' + error.message);
        }
    };

    const handleSaveConfigurations = async () => {
        if (!selectedItem) {
            console.error("Cannot save configurations: No item selected");
            alert("Error: No item selected");
            return;
        }

        try {
            console.log(`Saving configurations: setting ${selectedItem.Name} ConfiguredWears to ${newConfiguredWears}`);
            
            // Use the specific endpoint for updating ConfiguredWears
            await api.editClothingCatalog(selectedItem.Name, { 
                ConfiguredWears: newConfiguredWears 
            });
            

            const items = await retrieveClothingItems();
            setClothingItems(items);
                
                // Close the modal
            setIsConfigurationMode(false);
            
        } catch (error) {
            console.error('Error saving configurations:', error);
            alert('Error saving configurations');
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            const fetchClothingItems = async () => {
                const items = await retrieveClothingItems();
                setClothingItems(items);
                setIsLoading(false);

                // Load images for each item
                const images: { [key: number]: string } = {};
                for (const item of items) {
                    const image = await loadItemImage(item.Name);
                    
                    if (image) {
                        images[item.ID] = image;
                    }
                }
                setItemImages(images);
            };
            fetchClothingItems();
        }, []) // Empty dependency array since we want this to run every time the screen is focused
    );

    // First, let's add some console logging to track the modal state
    useEffect(() => {
        console.log("Configuration mode state changed:", isConfigurationMode);
        if (isConfigurationMode) {
            console.log("Selected item for configuration:", selectedItem);
        }
    }, [isConfigurationMode]);

    return (
        <View style={styles.container}>
            {/* Top Banner */}
            <View style={styles.topBanner}>
                <TouchableOpacity onPress={() => setIsSideMenuVisible(true)}>
                    <Entypo name="menu" size={normalize(36)} color="black" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/')} style={styles.homeButton}>
                    <FontAwesome name="home" size={normalize(36)} color="black" />
                </TouchableOpacity>
            </View>
            
            {/* Side Banner */}
            <SideBanner isVisible={isSideMenuVisible} onClose={() => setIsSideMenuVisible(false)} />
            
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerText}>Clothing Catalog</Text>
                <Text style={styles.headerSubtext}>Manage your wardrobe items</Text>
            </View>
            
            {/* Configuration Panel */}
            <View style={styles.configurationPanel}>
                <Text style={styles.configurationHeader}>Configurations</Text>
                <View style={styles.configurationContainer}>
                    <TouchableOpacity style={styles.configButton} onPress={() => setAddItemModalVisible(true)}>
                        <AntDesign name="pluscircleo" size={32} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.configButton} onPress={() => toggleDeleteMode()}>
                        <AntDesign name="minuscircleo" size={32} color="black" />
                    </TouchableOpacity>
                    
                </View>
            </View>
            
            {/* Main Content */}
            <View style={styles.mainContent}>
                <View style={styles.catalogContainer}>
                    <Text style={styles.catalogTitle}>Your Clothes</Text>
                    {isLoading ? (          
                        <View style={styles.contentPlaceholder}>
                            <Text style={styles.placeholderText}>Loading...</Text>
                        </View>
                    ) : clothingItems.length > 0 ? (
                        <FlatList
                            data={clothingItems}
                            keyExtractor={(item) => item.ID.toString()}
                            numColumns={2}
                            columnWrapperStyle={styles.columnWrapper}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.itemContainer} onPress={() => handleItemPress(item.ID)}>
                                    {itemImages[item.ID] ? ( // Use the loaded image
                                        <Image 
                                            source={{ uri: `data:image/jpeg;base64,${itemImages[item.ID]}` }} 
                                            style={styles.itemImage} 
                                        />
                                    ) : (
                                        <View style={[styles.itemImage, styles.imagePlaceholder]}>
                                            <Text style={styles.imagePlaceholderText}>No Image</Text>
                                        </View>
                                    )}
                                    {isDeleteMode && (
                                        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteItem(item.ID)}>
                                            <AntDesign name="delete" size={24} color="red" />
                                        </TouchableOpacity>
                                    )}
                                    <Text style={styles.itemName}>{item.Name}</Text>

                                </TouchableOpacity>
                            )}
                        />
                    ) : (
                        <View style={styles.contentPlaceholder}>
                            <Text style={styles.placeholderText}>No items found</Text>
                        </View>
                    )}
                </View>
            </View>
                    
            <Modal
                animationType="fade"
                transparent={true}
                visible={imagePopupVisible}
                onRequestClose={() => setImagePopupVisible(false)}
            >
                <View style={styles.imageOverlay}>
                    <View style={styles.imagePopupContainer}>
                        <View style={styles.imagePopupHeader}>
                            <Text style={styles.imagePopupTitle}>
                                {selectedItem ? selectedItem.Name : 'Item Details'}
                            </Text>
                            <TouchableOpacity onPress={() => setImagePopupVisible(false)}>
                                <AntDesign name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.imageDisplayArea}>
                            {imageLoading ? (
                                <View style={styles.imageLoadingContainer}>
                                    <Text style={styles.imageLoadingText}>Loading image...</Text>
                                    <AntDesign name="loading1" size={30} color="#3674B5" />
                                </View>
                            ) : imageData ? (
                                <Image 
                                    source={{uri: `data:image/jpeg;base64,${imageData}`}} 
                                    style={styles.popupImage}
                                    resizeMode="contain"
                                />
                            ) : (
                                <View style={styles.imageUnavailableContainer}>
                                    <Feather name="image" size={50} color="#999" />
                                    <Text style={styles.imageUnavailableText}>Image unavailable</Text>
                                </View>
                            )}
                        </View>
                        
                        {selectedItem && (
                            <View style={styles.popupInfoSection}>
                                <View style={styles.popupInfoRow}>
                                    <Text style={styles.popupInfoLabel}>Days Since Last Wash:</Text>
                                    <Text style={styles.popupInfoValue}>{selectedItem.DaysBeforeWash}</Text>
                                </View>
                                <View style={styles.popupInfoRow}>
                                    <Text style={styles.popupInfoLabel}>Wears Since Last Wash:</Text>
                                    <Text style={styles.popupInfoValue}>{selectedItem.WearsBeforeWash}</Text>
                                </View>
                                <View style={styles.popupInfoRow}>
                                    <Text style={styles.popupInfoLabel}>Last Washed:</Text>
                                    <Text style={styles.popupInfoValue}>
                                        {selectedItem.lastWashed ? new Date(selectedItem.lastWashed).toLocaleDateString() : 'Never'}
                                    </Text>
                                </View>
                                <TouchableOpacity style={styles.editconfigurations} onPress={() => handleConfiguration(selectedItem)}>
                                    <Text style={styles.editconfigurationsText}>Edit Configurations</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        
                        
                    </View>
                </View>
            </Modal>
            
            {/* Add Item Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={addItemModalVisible}
                onRequestClose={() => setAddItemModalVisible(false)}
            >
                <View style={styles.imageOverlay}>
                    <View style={styles.imagePopupContainer}>
                        <View style={styles.imagePopupHeader}>
                            <Text style={styles.imagePopupTitle}>
                                Add New Clothing Item
                            </Text>
                            <TouchableOpacity onPress={() => setAddItemModalVisible(false)}>
                                <AntDesign name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={styles.addItemScrollView}>
                            {/* Image Selection */}
                            <TouchableOpacity 
                                style={styles.imagePicker} 
                                onPress={pickImage}
                            >
                                {newItemImage ? (
                                    <Image 
                                        source={{ uri: `data:image/jpeg;base64,${newItemImage}` }} 
                                        style={styles.newItemImage} 
                                    />
                                ) : (
                                    <View style={styles.imagePickerPlaceholder}>
                                        <Feather name="camera" size={40} color="#3674B5" />
                                        <Text style={styles.imagePickerText}>
                                            Select Image from Camera Roll
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            
                            {/* Form Fields */}
                            <View style={styles.formField}>
                                <Text style={styles.formLabel}>Item Name:</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={newItemName}
                                    onChangeText={setNewItemName}
                                    placeholder="Enter clothing item name"
                                    placeholderTextColor="#444"
                                />
                            </View>
                            
                            <View style={styles.formField}>
                                <Text style={styles.formLabel}>Configured Wears:</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={newItemWears}
                                    onChangeText={setNewItemWears}
                                    placeholder="Number of wears before washing"
                                    keyboardType="numeric"
                                    placeholderTextColor="#444"
                                />
                            </View>
                            
                            <View style={styles.formField}>
                                <Text style={styles.formLabel}>Type:</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={newItemType}
                                    onChangeText={setNewItemType}
                                    placeholder="Type of clothing (e.g., Shirt, Pants)"
                                    placeholderTextColor="#444"
                                />
                            </View>
                        </ScrollView>
                        
                        <TouchableOpacity
                            style={styles.popupAddButton}
                            onPress={handleAddItem}
                        >
                            <AntDesign name="plus" size={18} color="white" style={styles.buttonIcon} />
                            <Text style={styles.popupButtonText}>Add Item</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="slide"
                transparent={true}
                visible={isConfigurationMode}
                onRequestClose={() => {
                    console.log("Configuration modal closing via request");
                    setIsConfigurationMode(false);
                }}
            >
                <View style={styles.imageOverlay}>
                    <View style={styles.imagePopupContainer}>
                        <View style={styles.imagePopupHeader}>
                            <Text style={styles.imagePopupTitle}>
                                Edit Configurations
                            </Text>
                            <TouchableOpacity 
                                onPress={() => {
                                    console.log("Close button pressed on configuration modal");
                                    setIsConfigurationMode(false);
                                }}
                            >
                                <AntDesign name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={styles.addItemScrollView}>
                            {/* Form Fields */}
                            <View style={styles.formField}>
                                <Text style={styles.formLabel}>Set Configured Wears:</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={newConfiguredWears.toString()}
                                    onChangeText={(text) => {
                                        const value = parseInt(text) || 0;
                                        console.log("Setting new configured wears to:", value);
                                        setNewConfiguredWears(value);
                                    }}
                                    placeholder="Enter number of wears before washing"
                                    keyboardType="numeric"
                                />
                            </View>
                        </ScrollView>
                        
                        <TouchableOpacity
                            style={styles.popupAddButton}
                            onPress={() => {
                                console.log("Save button pressed");
                                handleSaveConfigurations();
                            }}
                        >
                            <AntDesign name="save" size={18} color="white" style={styles.buttonIcon} />
                            <Text style={styles.popupButtonText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#3674B5',
    },
    header: {
        flex: 1,
        alignItems: 'center',
        marginTop: -50,
        paddingBottom: 20,
    },
    headerText: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#FFFDD0',
    },
    headerSubtext: {
        fontSize: 18,
        color: '#FFFDD0',
    },
    homeButton: {
        position: 'absolute',
        right: 20,
        top: 20,
    },
    topBanner: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: responsiveHeight(10),
    },
    configurationPanel: {
        width: '85%',
        flex: 1,
        backgroundColor: '#A1E3F9',
        borderRadius: 30,
        padding: 10,
        alignSelf: 'center',
        zIndex: 8,
        position: 'absolute',
        top: responsiveHeight(15),
        height: responsiveHeight(15),
    },
    configurationHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#3674B5',
        marginBottom: 15,
        alignSelf: 'center',
    },
    configurationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        gap: 20,
    },
    configButton: {
        borderRadius: 12,
        padding: 10,
    },
    mainContent: {
        backgroundColor: '#D1F8EF',
        flex: 9,
        alignItems: 'center',
        marginTop: 80,
        marginBottom: -20,
        borderTopLeftRadius: 85,
        borderTopRightRadius: 85,
        paddingTop: 50,
        zIndex: 5,
    },
    catalogContainer: {
        marginTop: 20,
        width: '90%',
        height: responsiveHeight(60),
        backgroundColor: 'transparent',
        borderRadius: 12,
        paddingBottom: 100,
        position: 'relative',
        zIndex: 10,
    },
    catalogTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#3674B5',
        marginBottom: 10,
        paddingLeft: 10,
    },
    contentPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 20,
        padding: 20,
    },
    placeholderText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3674B5',
        marginBottom: 20,
        textAlign: 'center',
    },
    imagePlaceholderText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#3674B5',
        textAlign: 'center',
    },
    itemContainer: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        margin: 8,
        padding: 15,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },  
    itemImage: {
        width: 100,
        height: 100,
        borderRadius: 10,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3674B5',
        marginTop: 5,
    },
    itemType: {
        fontSize: 14,
        color: '#3674B5',
    },
    imagePlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 50,
    },
    imageOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)', // Darker overlay for contrast
        zIndex: 1000, // Ensure it's on top
    },
    imagePopupContainer: {
        width: '95%',
        backgroundColor: '#f0f8ff', // Light blue background
        borderRadius: 15,
        overflow: 'hidden',
        elevation: 10, // Higher elevation for Android
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
    },
    imagePopupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#3674B5', // Blue header
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    imagePopupTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
    },
    imageDisplayArea: {
        height: responsiveHeight(40),
        width: '100%',
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    popupImage: {
        width: '100%',
        height: '100%',
    },
    imageLoadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    imageLoadingText: {
        fontSize: 16,
        color: '#3674B5',
        marginBottom: 10,
    },
    imageUnavailableContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    imageUnavailableText: {
        fontSize: 16,
        color: '#999',
        marginTop: 10,
    },
    popupInfoSection: {
        padding: 15,
        backgroundColor: '#f0f8ff',
    },
    popupInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    popupInfoLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3674B5',
    },
    popupInfoValue: {
        fontSize: 16,
        color: '#333',
    },
    popupAddButton: {
        flexDirection: 'row',
        backgroundColor: '#4CAF50', // Green for distinction
        padding: 15,
        margin: 15,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    popupButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    addItemScrollView: {
        width: '100%',
        padding: 15,
        maxHeight: responsiveHeight(60),
    },
    imagePicker: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#3674B5',
        borderStyle: 'dashed',
        marginBottom: 20,
        overflow: 'hidden',
    },
    imagePickerPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f8ff',
    },
    imagePickerText: {
        marginTop: 10,
        color: '#3674B5',
        fontSize: 16,
        textAlign: 'center',
    },
    newItemImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    formField: {
        marginBottom: 15,
    },
    formLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3674B5',
        marginBottom: 5,
    },
    formInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        backgroundColor: 'white',
    },
    buttonIcon: {
        marginRight: 8,
    },
    deleteButton: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    editconfigurations: {
        marginTop: 10,
        alignSelf: 'center',
        backgroundColor: '#D1F8EF',
    },
    editconfigurationsText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3674B5',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#3674B5',
    },
    configurationOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
    },
    configurationPopupContainer: {
        width: '95%',
        backgroundColor: '#f0f8ff',
        borderRadius: 15,
        overflow: 'hidden',
    },
    configurationPopupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#3674B5',
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    configurationPopupTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
    },
    configurationScrollView: {
        padding: 15,
    },
    configurationPopupButton: {
        flexDirection: 'row',
        backgroundColor: '#4CAF50',
        padding: 15,
        margin: 15,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    configurationPopupButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    
    
    

});

export default ClothingCatalog;
