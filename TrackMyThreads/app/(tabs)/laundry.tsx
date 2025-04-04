import { 
    MaterialIcons,
    FontAwesome,
    FontAwesome5,
    Ionicons,
    AntDesign,
    Feather
} from '@expo/vector-icons';

import Entypo from '@expo/vector-icons/Entypo';
import React, { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { Dimensions, Platform, PixelRatio } from 'react-native';
import SideBanner from '../components/sidebanner';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity,
    ScrollView,
    Modal,
    Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

// Import MobileList for the laundry items display
import MobileList from '../components/MobileList';

// Interface for clothing items
interface ClothingItem {
    id: number;
    name: string;
    image: string;
    daysBeforeWash: number;
    wearsBeforeWash: number;
    configuredWears: number;
    type: string;
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

// Utility functions from addclothing.tsx
const retrieveClothingItems = async (): Promise<ClothingItem[]> => {
    try {
        console.log('Fetching clothing metadata from API...');
        
        // This endpoint returns metadata only (no images)
        const response = await fetch('http://10.0.0.116:3000/api/clothes/clothingcatalog', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            return [];
        }
        
        const jsonData = await response.json();
        
        // Map the response to match our ClothingItem interface
        const mappedItems: ClothingItem[] = jsonData.map((item: any) => ({
            id: item.ID,
            name: item.Name,
            image: "", // We'll load images separately when needed
            daysBeforeWash: item.DaysBeforeWash,
            wearsBeforeWash: item.WearsBeforeWash,
            configuredWears: item.ConfiguredWears,
            type: item.Type,
            lastWashed: item.LastWashed // Add LastWashed from the API response
        }));
        
        return mappedItems;
    } catch (error) {
        console.error('Network or fetch error:', error);
        return [];
    }
};

const loadItemImage = async (itemName: string): Promise<string> => {
    try {
        const response = await fetch(`http://10.0.0.116:3000/api/clothes/image/${itemName}`);
        
        if (!response.ok) {
            return "";
        }
        
        // The response is just the base64 string
        const base64Image = await response.text();
        return base64Image;
    } catch (error) {
        console.error(`Error loading image for item ${itemName}:`, error);
        return "";
    }
};

type RootStackParamList = {
    Laundry: undefined;
    AddClothing: undefined;
};

// Main Laundry component
const Laundry = () => {
    const [isSideMenuVisible, setIsSideMenuVisible] = useState(false);
    const [laundryItems, setLaundryItems] = useState<ClothingItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // States for handling item selection and image display
    const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
    const [imagePopupVisible, setImagePopupVisible] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [imageData, setImageData] = useState("");
    
    // Add states from addclothing.tsx for item selection modal
    const [modalVisible, setModalVisible] = useState(false);
    const [databaseItems, setDatabaseItems] = useState<ClothingItem[]>([]);
    const [unselectedItems, setUnselectedItems] = useState<ClothingItem[]>([]);
    
    // New state for controlling delete mode
    const [isDeleteMode, setIsDeleteMode] = useState(false);

    // Function to load database items - modify this to accept an optional current laundry items parameter
    const loadDatabaseItems = async (currentLaundryItems?: ClothingItem[]) => {
        setIsLoading(true);
        try {
            // First, load all clothing items
            const items = await retrieveClothingItems();
            setDatabaseItems(items);
            
            // Get current laundry items
            const laundryResponse = await fetch('http://10.0.0.116:3000/api/clothes/laundrylist');
            const existingLaundryItems = await laundryResponse.json();
            
            // Extract the names of items already in the laundry list for efficient comparison
            const existingLaundryNames = new Set(existingLaundryItems.map((item: any) => item.name));
            
            // Find items that should be added to laundry list (wear count >= configured wears)
            const itemsToAddToLaundry = items.filter(item => 
                item.wearsBeforeWash >= item.configuredWears && 
                !existingLaundryNames.has(item.name)
            );
            
            console.log(`Found ${itemsToAddToLaundry.length} items that need to be added to laundry list`);
            
            // Add items to laundry list if needed
            for (const item of itemsToAddToLaundry) {
                try {
                    console.log(`Adding ${item.name} to laundry list (wears: ${item.wearsBeforeWash}/${item.configuredWears})`);
                    
                    // Create the item in the format expected by the API
                    const uploadItem = {
                        name: item.name,
                        daysBeforeWash: item.daysBeforeWash,
                        wearsBeforeWash: item.wearsBeforeWash,
                        configuredWears: item.configuredWears,
                        type: item.type
                    };
                    
                    const response = await fetch('http://10.0.0.116:3000/api/clothes/laundrylist', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(uploadItem)
                    });
                    
                    if (!response.ok) {
                        console.error(`Failed to add ${item.name} to laundry list: ${response.status}`);
                    }
                } catch (error) {
                    console.error(`Error adding ${item.name} to laundry list:`, error);
                }
            }
            
            // Refresh the laundry list if any items were added
            if (itemsToAddToLaundry.length > 0) {
                await getLaundryList();
            }
            
            // Use the provided currentLaundryItems if available, otherwise use the state value
            const laundryItemsToUse = currentLaundryItems !== undefined ? currentLaundryItems : laundryItems;
            
            // Generate unselected items
            const laundryItemNames = new Set(laundryItemsToUse.map(item => item.name));
            const filteredItems = items.filter(item => !laundryItemNames.has(item.name));
            setUnselectedItems(filteredItems);
        } catch (error) {
            console.error('Error loading database items:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Function to mark all items as washed - modify this part
    const washAllItems = async () => {
        try {
            console.log("Starting to mark all items as washed...");
            
            // Create a copy of the array to avoid modification issues during iteration
            const itemsToUpdate = [...laundryItems];
            let successCount = 0;
            let failureCount = 0;
            
            // Get current date in ISO format for LastWashed field
            const currentDate = new Date().toISOString();
            
            // First, reset wear count for each item in the clothing catalog
            for (const item of itemsToUpdate) {
                console.log(`Processing item: ${item.name} (ID: ${item.id})`);
                
                try {
                    // Use PUT request to update each item's wear count to 0 and set LastWashed date
                    const response = await fetch(`http://10.0.0.116:3000/api/clothes/${item.name}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                            wearsBeforeWash: 0,
                            lastWashed: currentDate 
                        })
                    });
                    
                    if (response.ok) {
                        console.log(`Successfully marked ${item.name} as washed`);
                        successCount++;
                    } else {
                        // Get error details
                        const errorText = await response.text();
                        console.log(`Failed to update item ${item.name}: ${response.status}`);
                        console.log(`Error response: ${errorText.substring(0, 100)}...`);
                        failureCount++;
                    }
                } catch (error) {
                    console.error(`Error processing item ${item.name}:`, error);
                    failureCount++;
                }
            }
            
            // After updating all items, clear the laundry list
            if (itemsToUpdate.length > 0) {
                try {
                    console.log("Attempting to clear laundry list...");
                    const clearUrl = 'http://10.0.0.116:3000/api/clothes/laundrylist/all';
                    console.log(`Sending DELETE request to: ${clearUrl}`);
                    
                    const clearResponse = await fetch(clearUrl, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    console.log(`Clear response status: ${clearResponse.status} ${clearResponse.statusText}`);
                    
                    if (clearResponse.ok) {
                        const result = await clearResponse.json();
                        console.log(`Cleared laundry list: ${result.itemsCleared} items removed`);
                    } else {
                        const errorText = await clearResponse.text();
                        console.log(`Failed to clear laundry list: ${clearResponse.status}`);
                        console.log(`Error response: ${errorText.substring(0, 200)}...`);
                    }
                } catch (error) {
                    console.error('Error clearing laundry list:', error);
                }
            }
            
            // Clear the local state regardless of server response
            setLaundryItems([]);
            console.log(`Wash operation completed: ${successCount} items updated, ${failureCount} failures`);
            
            // Refresh the database items - pass an empty array to represent the current laundry items
            // This ensures we don't use the stale state value
            await loadDatabaseItems([]);
            
        } catch (error) {
            console.error("Error in washAllItems function:", error);
        }
    };

    // Function to handle when an item is selected
    const handleItemSelect = async (item: ClothingItem) => {
        // Set the selected item immediately for visual feedback
        setSelectedItem(item);
        
        // Show the image popup and start loading the image
        setModalVisible(false);
        setImagePopupVisible(true);
        
        setImageLoading(true);
        
        try {
            // Load the image using the existing loadItemImage function
            const image = await loadItemImage(item.name);
            setImageData(image);
            
        } catch (error) {
            console.error(`Error loading image for item ${item.name}:`, error);
        } finally {
            setImageLoading(false);
        }
    };

    // Function to add the selected item to the laundry list
    const addSelectedItemToList = async (clothingItem: ClothingItem | null) => {
        if (clothingItem) {
            try {
                // Create the item to upload
                const uploadItem = {
                    name: clothingItem.name,
                    daysBeforeWash: clothingItem.daysBeforeWash,
                    wearsBeforeWash: clothingItem.wearsBeforeWash,
                    configuredWears: clothingItem.configuredWears,
                    type: clothingItem.type
                };
    
                // Upload to the server
                const response = await fetch(`http://10.0.0.116:3000/api/clothes/laundrylist`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(uploadItem)
                });
                
                if (response.ok) {
                    console.log(`Added ${clothingItem.name} to laundry list`);
                    
                    // Add to local state and reload the list
                    setLaundryItems([...laundryItems, clothingItem]);
                    
                    // Update unselected items
                    setUnselectedItems(unselectedItems.filter(item => item.name !== clothingItem.name));
                } else {
                    console.error(`Failed to add item to laundry list: ${response.status}`);
                }
            } catch (error) {
                console.error('Error adding item to laundry list:', error);
            }
            
            // Close both modals
            setImagePopupVisible(false);
            setModalVisible(false);
            
            // Reset selection
            setSelectedItem(null);
            setImageData("");
        }
    };
    
    // Function to get the laundry list from the API
    const getLaundryList = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`http://10.0.0.116:3000/api/clothes/laundrylist`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
            });
            
            if (!response.ok) {
                setIsLoading(false);
                return;
            }
            
            const jsonData = await response.json();
            console.log('Laundry list:', jsonData);
            setLaundryItems(jsonData);
            
            // Update unselected items
            if (databaseItems.length > 0) {
                const laundryItemNames = new Set(jsonData.map((item: ClothingItem) => item.name));
                const filteredItems = databaseItems.filter(item => !laundryItemNames.has(item.name));
                setUnselectedItems(filteredItems);
            }
        } catch (error) {
            console.error('Error fetching laundry list:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // New function to handle individual item deletion (frontend only for now)
    const handleDeleteItem = async (itemToDelete: ClothingItem) => {
        // Log the deletion attempt (backend implementation will be added later)
        console.log(`Delete item requested: ${itemToDelete.name} (ID: ${itemToDelete.id})`);
        
        // For now, just update the local state to remove the item
        setLaundryItems(currentItems => 
            currentItems.filter(item => item.id !== itemToDelete.id)
        );
        try{
            const response = await fetch(`http://10.0.0.116:3000/api/clothes/laundrylist/${itemToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                console.error('Error deleting item:', response.status);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };
    
    // Toggle delete mode
    const toggleDeleteMode = () => {
        setIsDeleteMode(!isDeleteMode);
    };

    // Fetch laundry items when component mounts
    useFocusEffect(
        React.useCallback(() => {
            const initializeData = async () => {
                try {
                    console.log("Initializing laundry screen data...");
                    // First load the database items (which also checks for automatic additions)
                    await loadDatabaseItems();
                    // Then get the full laundry list to display
                await getLaundryList();
                } catch (error) {
                    console.error("Error initializing laundry data:", error);
                }
            };
            
            initializeData();
        }, [])
    );

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
                <Text style={styles.headerText}>Laundry Manager</Text>
                <Text style={styles.headerSubtext}>Track your dirty clothes</Text>
            </View>
            <View style={styles.configurationpanel}>
                <Text style={styles.configurationheader}>Configurations</Text>
                <View style={styles.configurationcontainer}>
                    <TouchableOpacity 
                        style={styles.configurationaddbutton} 
                        onPress={() => setModalVisible(true)}
                    >
                        <AntDesign name="pluscircleo" size={32} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.configurationremovebutton}
                        onPress={toggleDeleteMode}
                    >
                        <AntDesign name="minuscircleo" size={32} color="black" />
                    </TouchableOpacity>
                    
                </View>
            </View>
            
            {/* Main Content */}
            <View style={styles.mainContent}>
                <View style={styles.laundryContainer}>
                    <Text style={styles.laundryTitle}>
                        Your Laundry Items
                    </Text>
                    
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>Loading laundry items...</Text>
                        </View>
                    ) : laundryItems.length > 0 ? (
                        <View style={styles.listWrapper}>
                            <Text style={styles.laundryStatus}>
                                {laundryItems.length} item{laundryItems.length !== 1 ? 's' : ''} in laundry
                            </Text>
                            {isDeleteMode ? (
                                // Custom delete mode UI
                                <ScrollView style={styles.deleteListContainer}>
                                    {laundryItems.map((item) => (
                                        <View key={item.id} style={styles.deleteListItem}>
                                            <View style={styles.deleteItemInfo}>
                                                <FontAwesome5 name="tshirt" size={24} color="black" style={styles.deleteItemIcon} />
                                                <Text style={styles.deleteItemText}>{item.name}</Text>
                                            </View>
                                            <TouchableOpacity 
                                                style={styles.deleteItemButton}
                                                onPress={() => handleDeleteItem(item)}
                                            >
                                                <MaterialIcons name="delete" size={24} color="#FF3B30" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>
                            ) : (
                                // Normal view with MobileList
                                <MobileList 
                                    items={laundryItems}
                                    onItemPress={(item) => handleItemSelect(item)}
                                />
                            )}
                        </View>
                    ) : (
                        <View style={styles.noItemsContainer}>
                            <Text style={styles.noItemsText}>
                                No laundry items to display
                            </Text>
                        </View>
                    )}
                    
                    
                    <TouchableOpacity 
                        style={styles.washButtonBottom}
                        onPress={() => {
                            if (isDeleteMode) {
                                setIsDeleteMode(false); // Exit delete mode
                            } else {
                                washAllItems(); // Regular wash functionality
                            }
                        }}
                    >
                        <View style={styles.washButtonContent}>
                            <Feather 
                                name="check-circle" 
                                size={20} 
                                color="white" 
                            />
                            <Text style={styles.washButtonText}>
                                {isDeleteMode ? "Exit Delete Mode" : "Mark All Washed"}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
            
            {/* Item Details Modal */}
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
                                {selectedItem ? selectedItem.name : 'Item Details'}
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
                                    <Text style={styles.popupInfoValue}>{selectedItem.daysBeforeWash}</Text>
                                </View>
                                <View style={styles.popupInfoRow}>
                                    <Text style={styles.popupInfoLabel}>Wears Since Last Wash:</Text>
                                    <Text style={styles.popupInfoValue}>{selectedItem.wearsBeforeWash}</Text>
                                </View>
                                <View style={styles.popupInfoRow}>
                                    <Text style={styles.popupInfoLabel}>Last Washed:</Text>
                                    <Text style={styles.popupInfoValue}>
                                        {selectedItem.lastWashed ? new Date(selectedItem.lastWashed).toLocaleDateString() : 'Never'}
                                    </Text>
                                </View>
                                
                            </View>
                        )}
                        
                        <TouchableOpacity
                            style={styles.popupAddButton}
                            onPress={() => addSelectedItemToList(selectedItem)}
                        >
                            <AntDesign name="plus" size={18} color="white" style={styles.buttonIcon} />
                            <Text style={styles.popupButtonText}>Add to Basket</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Clothing Database</Text>
                        </View>
                        
                        <View style={styles.modalContent}>
                            {isLoading ? (
                                <View style={styles.loadingContainer}>
                                    <Text style={styles.loadingText}>Loading items from database...</Text>
                                </View>
                            ) : unselectedItems.length > 0 ? (
                                <ScrollView style={styles.itemList}>
                                    {unselectedItems.map((item) => (
                                        <TouchableOpacity 
                                            key={item.id} 
                                            style={[
                                                styles.databaseItem,
                                                selectedItem?.id === item.id && styles.selectedDatabaseItem
                                            ]}
                                            onPress={() => handleItemSelect(item)}
                                        >
                                            <Text style={styles.itemName}>{item.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No items found in database</Text>
                                    <TouchableOpacity 
                                        style={styles.refreshButton}
                                        onPress={() => loadDatabaseItems()}
                                    >
                                        <Text style={styles.refreshButtonText}>Refresh</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                        
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.closeButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// Styles (combining styles from both components)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#3674B5',
    },
    header: {
        flex: 1,
        alignItems: 'center',
        marginTop: -20,
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
    mainContent: {
        backgroundColor: '#D1F8EF',
        flex: 9,
        alignItems: 'center',
        marginTop: responsiveHeight(9),
        borderTopLeftRadius: 85,
        borderTopRightRadius: 85,
        paddingTop: 50,
    },
    laundryContainer: {
        marginTop: 20,
        width: '90%',
        height: responsiveHeight(60),
        backgroundColor: 'transparent',
        borderRadius: 12,
        paddingBottom: 100,
        position: 'relative',
    },
    laundryTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#3674B5',
        marginBottom: 10,
        paddingLeft: 10,
    },
    laundryScrollView: {
        width: '100%',
    },
    laundryItemCard: {
        width: '100%',
        backgroundColor: '#007B7F',
        borderRadius: 12,
        padding: 15,
        marginVertical: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    laundryItemText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    noItemsContainer: {
        backgroundColor: '#F6EAB6',
        borderRadius: 12,
        padding: 20,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    noItemsText: {
        fontSize: 16,
        color: '#3674B5',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    configurationpanel: {
        width: '85%',
        flex: 1,
        backgroundColor: '#A1E3F9',
        borderRadius: 30,
        padding: 10,
        alignSelf: 'center',
        zIndex: 8,
        position: 'absolute',
        marginTop: responsiveHeight(-4),
        top: responsiveHeight(22),
        height: responsiveHeight(15),
    },
    configurationheader: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#3674B5',
        marginBottom: 15,
        alignSelf: 'center',
    },
    configurationcontainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        gap: 20,
    },
    configurationaddbutton: {
        borderRadius: 12,
        padding: 10,
    },
    configurationremovebutton: {    
        borderRadius: 12,
        padding: 10,
    },
    configurationsettings: {
        borderRadius: 12,
        padding: 10,
    },
    listWrapper: {
        flex: 0,
        width: '100%',
        height: responsiveHeight(35),
        maxHeight: responsiveHeight(45),
        marginBottom: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3674B5',
    },
    
    // Added styles from addclothing.tsx
    washButtonBottom: {
        
        paddingVertical: 15,
        paddingHorizontal: 20,
        backgroundColor: '#4CAF50', // Green color
        borderRadius: 25,
        alignSelf: 'center',
        width: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 1000,
        position: 'absolute',
        bottom: 125,
    },
    washButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    washButtonText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 5,
        fontSize: 14,
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)', // semi-transparent background
    },  
    modalView: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
    },  
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#3674B5',
        marginBottom: 15,
    },
    modalContent: {
        width: '100%',
        maxHeight: responsiveHeight(50),
    },
    closeButton: {
        backgroundColor: '#3674B5',
        borderRadius: 10,
        padding: 10,
        marginTop: 10,
    },
    closeButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    modalInput: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#3674B5',
        borderRadius: 10,
        padding: 10,
    },  
    itemList: {
        width: '100%',
        maxHeight: responsiveHeight(50),
        padding: 20,
    },
    databaseItem: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        marginBottom: 20,
        borderRadius: 8,
        backgroundColor: '#F9F9F9',
    },
    itemName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3674B5',
        marginBottom: 5,
    },
    itemDetail: {
        fontSize: 14,
        color: '#666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },  
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3674B5',
    },
    refreshButton: {
        backgroundColor: '#3674B5',
        borderRadius: 10,
        padding: 10,
        marginTop: 10,
    },
    refreshButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },  
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    buttonIcon: {
        marginRight: 8,
    },
    selectedDatabaseItem: {
        backgroundColor: '#E6F7FF',
        borderColor: '#3674B5',
        borderWidth: 1,
    },
    
    // Image popup styles
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
    laundryStatus: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3674B5',
        marginBottom: 10,
    },
    activeButton: {
        backgroundColor: 'rgba(255, 59, 48, 0.1)', // Light red background
        borderRadius: 15,
    },
    deleteTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FF0000',
        marginBottom: 10,
        paddingLeft: 10,
    },
    deleteListContainer: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    deleteListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
    },
    deleteItemInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    deleteItemIcon: {
        marginRight: 15,
    },
    deleteItemText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    deleteItemButton: {
        padding: 10,
    },
});

export default Laundry;
