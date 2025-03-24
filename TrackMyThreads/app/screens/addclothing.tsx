import { 
    MaterialIcons,
    FontAwesome,
    Ionicons,
    AntDesign,
    Feather
} from '@expo/vector-icons';
import Entypo from '@expo/vector-icons/Entypo';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { Dimensions, Platform, PixelRatio } from 'react-native';
import SideBanner from './sidebanner';
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

// Import MobileList directly instead of ListExample
import MobileList from '../components/MobileList';

// Search Bar component
const SearchBar = () => {
    const [searchQuery, setsearchQuery] = useState('');
    const handleSearch = (text: string) => {
        setsearchQuery(text);
        // Add your search logic here
    };
    return (
        <View style={styles.searchBarContainer}>
            <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                value={searchQuery}
                onChangeText={setsearchQuery}
            />
        </View>
    )
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




// Sample clothing data


// Interface for clothing items from SQLite database
interface ClothingItem {
    id: number;
    name: string;
    image: string;
    daysBeforeWash: number;
    wearsBeforeWash: number;
    configuredWears: number;
    type: string;
}

// Mock data for testing until we connect to the database


const retrieveClothingItems = async (): Promise<ClothingItem[]> => {
    try {
        console.log('Fetching clothing metadata from API...');
        
        // This endpoint now returns metadata only (no images)
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
        
        // This should now work reliably since we're not parsing large binary data
        const jsonData = await response.json();
        
        
        // Map the response to match our ClothingItem interface
        const mappedItems: ClothingItem[] = jsonData.map((item: any) => ({
            id: item.ID,
            name: item.Name,
            image: "", // We'll load images separately when needed
            daysBeforeWash: item.DaysBeforeWash,
            wearsBeforeWash: item.WearsBeforeWash,
            configuredWears: item.ConfiguredWears,
            type: item.Type
        }));
        
        return mappedItems;
    } catch (error) {
        console.error('Network or fetch error:', error);
        return [];
    }
};

const loadItemImage = async (itemId: number): Promise<string> => {
    try {
        
        
        const response = await fetch(`http://10.0.0.116:3000/api/clothes/image/${itemId}`);
        
        if (!response.ok) {
            
            return "";
        }
        
        // The response is just the base64 string
        const base64Image = await response.text();
        return base64Image;
    } catch (error) {
        console.error(`Error loading image for item ${itemId}:`, error);
        return "";
    }
};

// Main AddClothing component
const AddClothing = () => {
    const [isSideMenuVisible, setIsSideMenuVisible] = useState(false);
    const [items, setItems] = useState<ClothingItem[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    
    // State for database items
    const [databaseItems, setDatabaseItems] = useState<ClothingItem[]>([]);
    const [unselectedItems, setUnselectedItems] = useState<ClothingItem[]>([...databaseItems]);
    const [isLoading, setIsLoading] = useState(false);
    const [laundryListItems, setLaundryListItems] = useState<ClothingItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
    
    // Add these new states
    const [imagePopupVisible, setImagePopupVisible] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [imageData, setImageData] = useState("");
    const [pageStatus, setPageStatus] = useState(true);
    
    // Load items from database when component mounts
    
    useFocusEffect(
        React.useCallback(() => {
            // This code runs when the screen is focused
            
            setPageStatus(true);
    
            return () => {
                    // This code runs when the screen is unfocused
               
                setPageStatus(false);
            };
        }, [])
    );

    const generateUnselectedItems = async () => {
        const cleanItems = await retrieveClothingItems();
        for (const item of laundryListItems) {
            if (cleanItems.includes(item)) {
                cleanItems.splice(cleanItems.indexOf(item), 1);
            }
        }
        setUnselectedItems(cleanItems);
    }
    useEffect(() => {
        generateUnselectedItems();
    }, [laundryListItems]);
    
    const washAllItems = async () => {
        try {
            console.log("Starting to mark all items as washed...");
            
            // Create a copy of the array to avoid modification issues during iteration
            const itemsToUpdate = [...laundryListItems];
            let successCount = 0;
            let failureCount = 0;
            
            // First, reset wear count for each item in the clothing catalog
            for (const item of itemsToUpdate) {
                console.log(`Processing item: ${item.name} (ID: ${item.id})`);
                
                try {
                    // Use PUT request to update each item's wear count to 0
                    const response = await fetch(`http://10.0.0.116:3000/api/clothes/${item.name}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ wearsBeforeWash: 0 })
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
            setLaundryListItems([]);
            console.log(`Wash operation completed: ${successCount} items updated, ${failureCount} failures`);
            
        } catch (error) {
            console.error("Error in washAllItems function:", error);
        }
    };

    // Function to load database items
    const loadDatabaseItems = async () => {
        setIsLoading(true);
        try {
            const items = await retrieveClothingItems();
            setDatabaseItems(items);
            
        } catch (error) {
            console.error('Error loading database items:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDatabaseItems();
    }, []);
    

    
    // Function to load and display the image popup
    const handleItemSelect = async (item: ClothingItem) => {
        // Set the selected item immediately for visual feedback
        setSelectedItem(item);
        
        // Show the image popup and start loading the image
        setModalVisible(false);
        setImagePopupVisible(true);
        
        setImageLoading(true);
        
        try {
            // Load the image using the existing loadItemImage function
            const image = await loadItemImage(item.id);
            setImageData(image);
            
        } catch (error) {
            console.error(`Error loading image for item ${item.id}:`, error);
        } finally {
            setImageLoading(false);
        }
    };
    const createLaundryList = async () => {
        const laundryList = await retrieveClothingItems();
        const existingNames = laundryListItems.map(item => item.name);
        const filteredList = laundryList.filter((item: ClothingItem) => item.wearsBeforeWash >= item.configuredWears && !existingNames.includes(item.name));
        return filteredList;
    }
    useEffect(() => {
        const loadLaundryList = async () => {
            const laundryItems = await createLaundryList();
            const fullList = laundryItems.concat(laundryListItems).concat(items);
            
            setLaundryListItems(fullList);
        }
        loadLaundryList();
    }, [items, databaseItems]);

    


    const uploadLaundryList = async () => {
        const uploadedNames = new Set<string>();
        for (const item of laundryListItems) {
            try {
                // Check for duplicates
                if (uploadedNames.has(item.name)) {
                    console.log(`Skipping duplicate item: ${item.name}`);
                    continue; // This should skip to the next iteration
                }
    
                const uploadItem = {
                    name: item.name,
                    daysBeforeWash: item.daysBeforeWash,
                    wearsBeforeWash: item.wearsBeforeWash,
                    configuredWears: item.configuredWears,
                    type: item.type
                };
    
                const response = await fetch(`http://10.0.0.116:3000/api/clothes/laundrylist`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(uploadItem)
                    
                });
                console.log(JSON.stringify(uploadItem));
    
                if (!response.ok) {
                    const errorData = await response.json();
                    console.log(errorData);
                    continue; // This will skip to the next iteration if the upload fails
                }
    
                // Add the name to the set after a successful upload
                uploadedNames.add(item.name);
            } catch (error) {
                console.error(`Error uploading laundry list:`, error);
                
                continue; // This will skip to the next iteration if an error occurs
            }
        }
    };

    useEffect(() => {
        
        uploadLaundryList();
    }, [laundryListItems]);
    
    const getLaundryList = async () => {
        try {
            
            const response = await fetch(`http://10.0.0.116:3000/api/clothes/laundrylist`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
            });
            
            if (!response.ok) {
                
                return "";
            }
            
            
            const jsonData = await response.json();
            const image = await loadItemImage(jsonData.id);
            jsonData.image = image;
            
            setLaundryListItems(jsonData);
        } catch (error) {
            
            return "";
        }
    }
    useEffect(() => {
        getLaundryList();
    }, []);
    // Function to add the selected item to your list
    const addSelectedItemToList = async (clothingItem: ClothingItem | null) => {
        if (clothingItem) {
            // Add the selected item to your items list
            const newItem = {
                id: clothingItem.id,
                name: clothingItem.name,
                image: clothingItem.image,
                daysBeforeWash: clothingItem.daysBeforeWash,
                wearsBeforeWash: clothingItem.wearsBeforeWash,
                configuredWears: clothingItem.configuredWears,
                type: clothingItem.type 
            };
            
            setItems([...items, newItem as unknown as ClothingItem]);
            
            // Close both modals
            setImagePopupVisible(false);
            setModalVisible(false);
            
            // Reset selection
            setSelectedItem(null);
            setImageData("");
        }
    };

    return (
        <View style={styles.container}>
            {/* Top Banner */}
            <View style={styles.topBanner}>
                <TouchableOpacity onPress={() => setIsSideMenuVisible(true)}>
                    <Entypo name="menu" size={normalize(36)} color="black" />
                </TouchableOpacity>
                <SearchBar />
                <FontAwesome name="home" size={normalize(36)} color="black" />
            </View>
            
            {/* Side Banner */}
            <SideBanner isVisible={isSideMenuVisible} onClose={() => setIsSideMenuVisible(false)} />
            
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerText}>Add Clothing</Text>
                <Text style={styles.headerSubtext}>Add new items to your wardrobe</Text>
            </View>
            
            {/* Main Content */}
            <View style={styles.mainContent}>
                <View style={styles.clothingContainer}>
                    <Text style={styles.clothingTitle}>Laundry Basket</Text>
                    <TouchableOpacity 
                        style={styles.addIcon}
                        onPress={() => setModalVisible(true)}
                    >
                        <AntDesign name="plus" size={20} color="white" />
                    </TouchableOpacity>
                    
                    <View style={styles.listWrapper}>
                        <MobileList 
                            items={laundryListItems}
                            onItemPress={handleItemSelect}
                        />
                    </View>
                    
                    {/* Mark All Washed Button - Now at bottom */}
                    <TouchableOpacity 
                        style={styles.washButtonBottom}
                        onPress={() => {
                            // Clear the laundry list
                            setLaundryListItems([]);
                            console.log('Marked all items as washed and cleared the list');
                        }}
                    >
                        <TouchableOpacity onPress={washAllItems}>
                            <View style={styles.washButtonContent}>
                                <Feather name="check-circle" size={20} color="white" />
                                <Text style={styles.washButtonText}>Mark All Washed</Text>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </View>
            </View>
            
            {/* Basic Modal Popup */}
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
                                        onPress={loadDatabaseItems}
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

            <Modal
                animationType="fade"
                transparent={true}
                visible={imagePopupVisible}
                onRequestClose={() => {
                    
                    setImagePopupVisible(false);
                }}
            >
                <View style={styles.imageOverlay}>
                    <View style={styles.imagePopupContainer}>
                        <View style={styles.imagePopupHeader}>
                            <Text style={styles.imagePopupTitle}>
                                {selectedItem ? selectedItem.name : 'Item Details'}
                            </Text>
                            <TouchableOpacity onPress={() => {
                                
                                setImagePopupVisible(false);
                            }}>
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
                                    <Text style={styles.popupInfoLabel}>ID:</Text>
                                    <Text style={styles.popupInfoValue}>{selectedItem.id}</Text>
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
        paddingTop: 0,
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
    searchBarContainer: {
        alignItems: 'center',
        paddingTop: 10,
        height: responsiveHeight(7.5),
    },
    searchInput: {
        width: responsiveWidth(70),
        height: 40,
        borderWidth: 1,
        borderColor: '#FFFDD0',
        borderRadius: 10,
        paddingLeft: 10,
        color: '#FFFDD0',
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
        marginTop: 20,
        borderTopLeftRadius: 85,
        borderTopRightRadius: 85,
    },
    clothingContainer: {
        marginTop: 80,
        width: '90%',
        flex: 1,
        backgroundColor: 'transparent',
        borderRadius: 12,
    },
    clothingTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#3674B5',
        marginTop: -50,
        paddingLeft: 10,
        textAlign: 'center',
        marginBottom: 20,
    },
    clothingScrollView: {
        width: '100%',
    },
    listWrapper: {
        flex: 1,
        width: '100%',
    },
    formHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#3674B5',
        marginBottom: 15,
        alignSelf: 'center',
    },
    formContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        gap: 20,
    },
    addIcon: {
        position: 'absolute',
        top: -60,
        right: 10,
        padding: 10,
        backgroundColor: '#3674B5',
        borderRadius: 100,
        zIndex: 1,
    },
    washButton: {
        position: 'absolute',
        top: -60,
        right: 70, // Positioned to the left of the add icon
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: '#4CAF50', // Green color
        borderRadius: 20,
        zIndex: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    washButtonBottom: {
        marginTop: 20,
        marginBottom: 20,
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#3674B5',
        marginBottom: 15,
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    addButton: {
        backgroundColor: '#3674B5',
        borderRadius: 10,
        padding: 10,
        marginTop: 10,
    },
    modalViewImageModal: {
        width: '80%',
        backgroundColor: 'blue',
        borderRadius: 20,
        padding: 35,
        zIndex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    buttonIcon: {
        marginRight: 8,
    },
    selectedDatabaseItem: {
        backgroundColor: '#E6F7FF',
        borderColor: '#3674B5',
        borderWidth: 1,
    },
    disabledButton: {
        backgroundColor: '#cccccc', // Gray color for disabled state
        opacity: 0.7,
    },
    // Additional styles will be added as needed
});

export default AddClothing;
