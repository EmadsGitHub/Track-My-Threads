import { 
    MaterialIcons,  // Material Design icons
    FontAwesome,    // Font Awesome icons
    Ionicons       // Ionicons
} from '@expo/vector-icons';
import * as SQLite from 'expo-sqlite';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import { Link, router } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import SideBanner from '../components/sidebanner';
import React, { useEffect, useState } from 'react';
import { Dimensions, Platform, PixelRatio, Modal } from 'react-native';
import { DateData } from 'react-native-calendars';
import { Calendar } from 'react-native-calendars';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    Image, 
    TouchableOpacity,  // For custom buttons
    ActivityIndicator,
    ScrollView,   // For loading state
  } from 'react-native';

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

const CalendarScreen = ({selectedDate, setSelectedDate}: {selectedDate: string, setSelectedDate: (date: string) => void}) => {
    // Combine both fixed marks and selected date
    const markedDates = {
        '2025-02-26': {marked: true, dotColor: '#3674B5'},
        ...(selectedDate ? {[selectedDate]: {selected: true, selectedColor: '#3674B5'}} : {})
    };
    
    // Determine if device is a tablet
    const isTablet = SCREEN_WIDTH > 768;
    
    return (
        <View style={styles.calendarcontainer}>
            <Calendar 
                style={styles.calendar}
                markedDates={markedDates}
                onDayPress={(daySelected: DateData) => {
                console.log('selected day', daySelected);
                setSelectedDate(daySelected.dateString);
                }}
                theme={{
                    'stylesheet.calendar.main': {
                        day: {
                            height: isTablet ? 40 : 30,      // Larger height for tablets
                          },
                          week: {
                            flexDirection: 'row',      // Make sure days are in a row
                            justifyContent: 'space-around', // Space days evenly
                            height: isTablet ? 50 : 25,      // Larger height for tablets
                            marginTop: 2,            // Space between rows
                            marginBottom: 2,     // Match day height to row height
                          },
                    },
                    backgroundColor: '#D1F8EF',
                    calendarBackground: '#A1E3F9',
                    textDayHeaderFontWeight: 'bold',
                    textDayHeaderFontSize: isTablet ? 14 : 8,  // Larger font for tablets
                    textDayFontSize: isTablet ? 18 : 12,       // Larger font for tablets
                    monthTextFontSize: isTablet ? 18 : 12,     // Larger font for tablets
                    textMonthFontSize: isTablet ? 18 : 12,     // Larger font for tablets
                    textDayHeaderFontColor: '#3674B5',
                    dayTextColor: '#3674B5',
                    textSectionTitleColor: '#3674B5',
                    textDisabledColor: '#808080',
                    selectedDayBackgroundColor: '#3674B5', // Blue background for selected date
                    selectedDayTextColor: '#FFFFFF',  
                    dayContainerHeight: isTablet ? 30 : 20, // Larger height for tablets
                    textDayFontWeight: 'bold',
                    monthTextFontWeight: 'bold',
                }}
            />
        </View>
    );
};

interface ClothingItem {
    id: number;
    date: string;
    item: string;
}

interface ClothingCatalog {
    ID: number;
    Name: string;
    Image: string;
    DaysBeforeWash: number;
    WearsBeforeWash: number;
    ConfiguredWears: number;
    Type: string;
    lastWashed: string | null;
}

const retrieveClothingItems = async (): Promise<ClothingCatalog[]> => {
    const response = await fetch('http://10.0.0.116:3000/api/clothes/clothingcatalog', {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
    });
    const data = await response.json();
    return data;
};

const HomeScreen = () => {
    const [isSideMenuVisible, setIsSideMenuVisible] = useState(false);
    const [clothes, setClothes] = useState<ClothingItem[]>([]);
    const [deletedItem, setDeletedItem] = useState<ClothingItem | null>(null);
    const [DaySelected, setDaySelected] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [unselectedItems, setUnselectedItems] = useState<ClothingCatalog[]>([]);
    const [selectedItems, setSelectedItems] = useState<ClothingCatalog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [clothingItems, setClothingItems] = useState<ClothingCatalog[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [needsFullUpdate, setNeedsFullUpdate] = useState(true);
    // Determine if device is a tablet
    
    
    // Fetch clothes when day changes
    useEffect(() => {
        fetchClothes();
    }, [DaySelected, refreshTrigger]);
    
    // Handle deletion separately
    useEffect(() => {
        if (deletedItem) {
            handleDelete(deletedItem);
        }
    }, [deletedItem]);

    const loadClothingItems = async () => {
        const items = await retrieveClothingItems();
        setClothingItems(items);
        const clothingNames = clothes.map(item => item.item);
        const wornclothes = items.filter(item => clothingNames.includes(item.Name));
        const updatedUnselectedItems = items.filter(item => !wornclothes.includes(item));
        setUnselectedItems(updatedUnselectedItems);
        setIsLoading(false);
    };

    useEffect(() => {
        console.log("Loading clothing items");
        loadClothingItems();
    }, [modalVisible]);
    
    // Function to fetch clothes
    const fetchClothes = async () => {
        try {
            const response = await fetch('http://10.0.0.116:3000/api/clothes', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            
            const data = await response.json();
            const filteredClothes = data.filter((item: ClothingItem) => item.date === DaySelected);
            setClothes(filteredClothes);
        } catch (error) {
            console.error('Error fetching clothes:', error);
        }
    };
    
    // Function to update wear counts based on wear history
    const updateWearCount = async () => {
        try {
            // Step 1: Get all clothing items from catalog
            const clothingCatalog = await retrieveClothingItems();
            console.log('Retrieved clothing catalog:', clothingCatalog.length, 'items');
            
            // Step 2: Get all clothing wear records
            const response = await fetch('http://10.0.0.116:3000/api/clothes', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            
            const allClothingRecords = await response.json();
            console.log('Retrieved wear records:', allClothingRecords.length, 'records');
            
            const currentDate = new Date();
            
            // Step 3: Process each clothing item in the catalog
            for (const item of clothingCatalog) {
                // Get the last washed date for this item
                const lastWashedDate = item.lastWashed ? new Date(item.lastWashed) : null;
                console.log(`Processing ${item.Name}, last washed: ${lastWashedDate ? lastWashedDate.toISOString().split('T')[0] : 'never'}`);
                
                // Find all wear records for this item
                const itemWearRecords = allClothingRecords.filter(
                    (record: ClothingItem) => record.item === item.Name
                );
                
                // Count wears that occurred after last wash but before current date
                let wearsCount = 0;
                
                for (const record of itemWearRecords) {
                    const wearDate = new Date(record.date);
                    
                    // Check if this wear was after last wash but before current date
                    if ((!lastWashedDate || wearDate > lastWashedDate) && wearDate < currentDate) {
                        wearsCount++;
                        console.log(`  Counted wear on ${record.date}`);
                    }
                }
                
                // Only update if there are wears to count
                if (wearsCount > 0) {
                    console.log(`  Updating ${item.Name} with ${wearsCount} wears`);
                    
                    try {
                        const updateResponse = await fetch(`http://10.0.0.116:3000/api/clothes/${item.Name}`, {
                            method: 'PUT',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ wearsBeforeWash: wearsCount }),
                        });
                        
                        if (!updateResponse.ok) {
                            console.error(`Failed to update wear count for ${item.Name}: ${updateResponse.status}`);
                        }
                    } catch (error) {
                        console.error('Error updating wear count:', error);
                    }
                }
            }
            
            console.log('Wear count update complete');
            
        } catch (error) {
            console.error('Error in updateWearCount:', error);
        }
    };
    useEffect(() => {
        if (needsFullUpdate) {
            updateWearCount();
            setNeedsFullUpdate(false);
        }
    }, [needsFullUpdate]);
    
    // Function to handle deletion
    const handleDelete = async (item: ClothingItem) => {
        try {
            await fetch(`http://10.0.0.116:3000/api/clothes/${item.id}`, {
                method: 'DELETE',
            });
        } catch (error) {
            console.error('Error deleting clothes:', error);
        }
        fetchClothes();
        setNeedsFullUpdate(true);
    };
    
    // Add this function inside your HomeScreen component
    const getRandomColor = (index: number) => {
        const colors = ['#007B7F', '#003366', '#3B9A9C', '#A4D8E1', '#A9A9A9', '#F6EAB6'];
        return colors[index % colors.length];
    };

    const handleOpenModal = () => {
        setModalVisible(true);
    };

    const handleAddClothes = async () => {
        console.log('handleAddClothes started');
        
        if (!DaySelected) {
            alert("Please select a day first");
            return;
        }
        
        // Create a copy of selectedItems for safety
        const itemsToAdd = [...selectedItems];
        console.log('Items to add:', itemsToAdd.length);
        
        if (itemsToAdd.length === 0) {
            alert("Please select at least one item");
            return;
        }
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            // Proceed with adding clothes without wear count updates
            console.log('Adding clothes to server...');
            
            try {
                const response = await fetch(`http://10.0.0.116:3000/api/clothes`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        date: DaySelected, 
                        items: itemsToAdd.map(item => item.Name)
                    }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId); // Clear the timeout if fetch completes
                
                console.log('Server response status:', response.status);
                
                // Check response status before proceeding
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Server error: ${response.status} - ${errorText}`);
                }
                
                console.log('POST request successful');
                
                // Try to parse JSON response if applicable
                try {
                    const responseData = await response.json();
                    console.log('Response data:', responseData);
                } catch (jsonError) {
                    console.log('Response not JSON or empty');
                }
                
            } catch (fetchError: any) {
                if (fetchError.name === 'AbortError') {
                    console.error('Request timed out after 5 seconds');
                } else {
                    console.error('Fetch error:', fetchError);
                }
                throw fetchError;
            }
            
            console.log('Clearing selected items...');
            setSelectedItems([]);
            
            console.log('Closing modal...');
            setModalVisible(false);
            
            console.log('Refreshing clothes list...');
            // Trigger a refresh
            setRefreshTrigger(prev => prev + 1);
            
            console.log('Process complete');
            
        } catch (error: any) {
            console.error('Error in handleAddClothes:', error);
            alert(`Error: ${error.message || 'Unknown error occurred'}`);
        } finally {
            console.log('HandleAddClothes completed (finally block)');
            setNeedsFullUpdate(true);
        }
    };
    

    const handleItemSelect = (item: ClothingCatalog) => {
        // Check if item is already selected
        const isAlreadySelected = selectedItems.some(selectedItem => selectedItem.ID === item.ID);
        
        if (isAlreadySelected) {
            // If already selected, remove it (unselect)
            setSelectedItems(selectedItems.filter(selectedItem => selectedItem.ID !== item.ID));
        } else {
            // If not selected, add it to selected items
            setSelectedItems([...selectedItems, item]);
        }
        
        // No need to update unselectedItems since we'll display all items
        // and just change their styling based on selection state
    };
    

    return (
        <View style={styles.container}>
            <View style={styles.topBanner}>
                <TouchableOpacity onPress={() => setIsSideMenuVisible(true)}>
                    <Entypo name="menu" size={normalize(36)} color="black" />
                </TouchableOpacity>
            </View>
            <SideBanner isVisible={isSideMenuVisible} onClose={() => setIsSideMenuVisible(false)} />
            <View style={styles.header}>
                <Text style={[styles.headerText, { fontSize: normalize(30) }]}>Hello!</Text>
                <Text style={[styles.headerSubtext, { fontSize: normalize(18) }]}>What are we wearing today?</Text>
            </View>
            <View style={styles.mainmenucontent}>
                <CalendarScreen selectedDate={DaySelected} setSelectedDate={setDaySelected} />
                <View style={styles.selectedClothesContainer}>
                    
                    <ScrollView style={styles.clothesScrollView}>
                        {clothes.length > 0 ? (
                            clothes.map((item, index) => (
                                <View key={index} style={[styles.clothingCard, {backgroundColor: getRandomColor(index)}]}>   
                                    <View style={styles.clothingInfo}>
                                        <Text style={[styles.clothingItemText, { fontSize: normalize(16) }]}>
                                            {item.item}
                                        </Text>
                                        <TouchableOpacity onPress={() => setDeletedItem(item)} style={styles.deleteButton}>
                                            <Entypo name="trash" size={normalize(24)} color="black" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View style={styles.noClothesContainer} >
                                <Text style={[styles.noClothesText, { fontSize: normalize(16) }]}>
                                    No clothes worn on this day
                                </Text>
                                
                            </View>
                            
                        )}
                    </ScrollView>
                    <TouchableOpacity style={styles.addClothesButton} onPress={handleOpenModal}>
                        <Text style={styles.addClothesText}>Add Clothes</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
                            ) : clothingItems.length > 0 ? (
                                
                                <ScrollView style={styles.itemList}>
                                    {unselectedItems.map((item) => (
                                        <TouchableOpacity 
                                            key={item.ID} 
                                            style={selectedItems.some(selectedItem => selectedItem.ID === item.ID) 
                                                  ? styles.selectedDatabaseItem 
                                                  : styles.databaseItem}
                                            onPress={() => handleItemSelect(item)}
                                        >
                                            <Text style={styles.itemName}>{item.Name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No items found in database</Text>
                                    
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
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={handleAddClothes}
                            >
                                <Text style={styles.closeButtonText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};
const isTablet = SCREEN_WIDTH > 768;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#3674B5',
    },
    header: {
        flex: 1,
        alignItems: 'center',
        marginTop: -30,
        paddingTop: responsiveHeight(2),
        paddingBottom: responsiveHeight(2),
    },
    headerText: {
        fontWeight: 'bold',
        color: '#FFFDD0',
    },
    headerSubtext: {
        color: '#FFFDD0',
    },
    topBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: responsiveWidth(5),
        height: responsiveHeight(5),
        marginTop: Platform.OS === 'ios' ? responsiveHeight(5) : responsiveHeight(2),
    },
    
    mainmenucontent: {
        backgroundColor: '#D1F8EF',
        flex: 9,
        alignItems: 'center',
        paddingTop: responsiveHeight(5),
        marginTop: 20,
        borderTopLeftRadius: normalize(85),
        borderTopRightRadius: normalize(85),
    },
    calendarcontainer: {
        width: responsiveWidth(80),
        height: responsiveHeight(30),
        backgroundColor: '#D1F8EF',
        alignSelf: 'center',
        borderRadius: 10,
    },
    calendar: {
        height: responsiveHeight(30),
        width: responsiveWidth(80),
        borderRadius: 10,
    },
    mainmenutexttitle: {
        marginTop: responsiveHeight(1),
        marginBottom: responsiveHeight(1.5),
        fontSize: normalize(20),
        fontWeight: 'bold',
        color: '#3674B5',
        alignSelf: 'flex-start',
        paddingLeft: normalize(10),
    },
    selectedClothesContainer: {
        marginTop: isTablet ? responsiveHeight(8) : responsiveHeight(1),
        width: responsiveWidth(80),
        height: responsiveHeight(40),
        backgroundColor: 'transparent',
        borderRadius: 12,
    },
    clothesScrollView: {
        width: '100%',
        flex: 1,
    },
    clothingCard: {
        width: '100%',
        backgroundColor: '#FFB6C1', // Default color, will be overridden by getRandomColor
        borderRadius: 12,
        padding: normalize(15),
        marginVertical: normalize(6),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    noClothesContainer: {
        borderRadius: 12,
        padding: normalize(20),
        marginVertical: normalize(8),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        backgroundColor: '#F6EAB6',
    },
    clothingInfo: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    clothingItemText: {
        color: '#FFFFFF',
        fontWeight: '500',
        flex: 1,
    },
    noClothesText: {
        color: '#3674B5',
        textAlign: 'center',
        marginTop: 0,
        fontStyle: 'italic',
    },
    deleteButton: {
        backgroundColor: 'red',
        borderRadius: 10,
        padding: normalize(5),
    },
    addClothesButton: {
        backgroundColor: '#3674B5',
        borderRadius: 10,
        marginTop: normalize(10),
        padding: normalize(5),
        marginBottom: normalize(120),
    },
    addClothesText: {
        color: '#FFFFFF',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: normalize(16),
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
        height: normalize(65),
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
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    selectedDatabaseItem: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        marginBottom: 20,
        borderRadius: 8,
        backgroundColor: '#E6F7FF',
        borderColor: '#3674B5',
        borderWidth: 1,
        height: normalize(65),
    },
});

export default HomeScreen;

