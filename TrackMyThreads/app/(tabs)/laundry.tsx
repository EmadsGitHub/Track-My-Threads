import { 
    MaterialIcons,
    FontAwesome,
    Ionicons,
    AntDesign,
    Feather
} from '@expo/vector-icons';

import Entypo from '@expo/vector-icons/Entypo';
import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { Dimensions, Platform, PixelRatio } from 'react-native';
import SideBanner from '../screens/sidebanner';
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
}

// Search Bar component (same as in mainmenu.tsx)
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

    // Function to load item image when selected
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
    
    // Function to handle when an item is selected
    const handleItemSelect = async (item: ClothingItem) => {
        // Set the selected item immediately for visual feedback
        console.log(item);
        setSelectedItem(item);
        
        // Show the image popup
        setImagePopupVisible(true);
        
        // Start loading the image
        setImageLoading(true);
        
        try {
            // Load the image using the loadItemImage function
            const image = await loadItemImage(item.id);
            setImageData(image);
        } catch (error) {
            console.error(`Error loading image for item ${item.id}:`, error);
        } finally {
            setImageLoading(false);
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

            setLaundryItems(jsonData);
        } catch (error) {
            console.error('Error fetching laundry list:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch laundry items when component mounts
    useEffect(() => {
        getLaundryList();
    }, []);

    return (
        <View style={styles.container}>
            {/* Top Banner */}
            <View style={styles.topBanner}>
                <TouchableOpacity onPress={() => setIsSideMenuVisible(true)}>
                    <Entypo name="menu" size={36} color="black" />
                </TouchableOpacity>
                <SearchBar />
                <FontAwesome name="home" size={36} color="black" />
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
                    <TouchableOpacity style={styles.configurationaddbutton} onPress={() => router.push('/screens/addclothing')}>
                        <AntDesign name="pluscircleo" size={32} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.configurationremovebutton}>
                        <AntDesign name="minuscircleo" size={32} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.configurationsettings}>
                        <Feather name="settings" size={32} color="black" />
                    </TouchableOpacity>
                </View>
            </View>
            
            {/* Main Content */}
            <View style={styles.mainContent}>
                <View style={styles.laundryContainer}>
                    <Text style={styles.laundryTitle}>Your Laundry Items</Text>
                    
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>Loading laundry items...</Text>
                        </View>
                    ) : laundryItems.length > 0 ? (
                        <View style={styles.listWrapper}>
                            <MobileList 
                                items={laundryItems}
                                onItemPress={(item) => handleItemSelect(item)}
                            />
                        </View>
                    ) : (
                        <View style={styles.noItemsContainer}>
                            <Text style={styles.noItemsText}>
                                No laundry items to display
                            </Text>
                        </View>
                    )}
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
                                    <Text style={styles.popupInfoLabel}>ID:</Text>
                                    <Text style={styles.popupInfoValue}>{selectedItem.id}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// Styles (matching mainmenu.tsx)
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
        marginTop: 80,
        borderTopLeftRadius: 85,
        borderTopRightRadius: 85,
    },
    laundryContainer: {
        marginTop: 80,
        width: '90%',
        flex: 1,
        backgroundColor: 'transparent',
        borderRadius: 12,
    },
    laundryTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#3674B5',
        marginBottom: 15,
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
    // New styles for the MobileList and item modal
    listWrapper: {
        flex: 1,
        width: '100%',
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
});

export default Laundry;
