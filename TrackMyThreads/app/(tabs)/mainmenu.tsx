import { 
    MaterialIcons,  // Material Design icons
    FontAwesome,    // Font Awesome icons
    Ionicons       // Ionicons
} from '@expo/vector-icons';
import * as SQLite from 'expo-sqlite';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import { Link } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import SideBanner from '../screens/sidebanner';
import React, { useEffect, useState } from 'react';
import { Dimensions, Platform, PixelRatio } from 'react-native';
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

const SearchBar = ()=>{
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

interface ClothingItem {
    id: number;
    date: string;
    item: string;
}

const MainMenu = () => {
    const [isSideMenuVisible, setIsSideMenuVisible] = useState(false);
    const [clothes, setClothes] = useState<ClothingItem[]>([]);
    const [deletedItem, setDeletedItem] = useState<ClothingItem | null>(null);
    const [DaySelected, setDaySelected] = useState('');
    
    // Determine if device is a tablet
    
    
    // Fetch clothes when day changes
    useEffect(() => {
        fetchClothes();
    }, [DaySelected]);
    
    // Handle deletion separately
    useEffect(() => {
        if (deletedItem) {
            handleDelete(deletedItem);
        }
    }, [deletedItem]);
    
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
            console.log('Selected day:', DaySelected);
            setClothes(filteredClothes);
            console.log('Fetched data:', data);
        } catch (error) {
            console.error('Error fetching clothes:', error);
        }
    };
    
    // Function to handle deletion
    const handleDelete = async (item: ClothingItem) => {
        try {
            console.log('Attempting to delete item with ID:', item.id);
            
            const response = await fetch(`http://10.0.0.116:3000/api/clothes/${item.id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            
            console.log('Successfully deleted item:', item);
            
            // Update local state to remove the deleted item
            setClothes(prevClothes => prevClothes.filter(clothing => clothing.id !== item.id));
            
            // Reset deletedItem to null after successful deletion
            setDeletedItem(null);
        } catch (error) {
            console.error('Error deleting clothes:', error);
            // Reset deletedItem even if there's an error
            setDeletedItem(null);
        }
    };
    
    // Add this function inside your MainMenu component
    const getRandomColor = (index: number) => {
        const colors = ['#007B7F', '#003366', '#3B9A9C', '#A4D8E1', '#A9A9A9', '#F6EAB6'];
        return colors[index % colors.length];
    };

    return (
        <View style={styles.container}>
            <View style={styles.topBanner}>
                <TouchableOpacity onPress={() => setIsSideMenuVisible(true)}>
                    <Entypo name="menu" size={normalize(36)} color="black" />
                </TouchableOpacity>
                <SearchBar />
                <FontAwesome name="qrcode" size={normalize(36)} color="black" />
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
                </View>
            </View>
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
    searchBarContainer: {
        alignItems: 'center',
        paddingTop: responsiveHeight(1),
    },
    searchInput: {
        width: responsiveWidth(70),
        height: normalize(40),
        borderWidth: 1,
        borderColor: '#FFFDD0',
        borderRadius: 10,
        paddingLeft: 10,
        color: '#FFFDD0',
        fontSize: normalize(14),
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
        flex: 1,
        backgroundColor: 'transparent',
        borderRadius: 12,
    },
    clothesScrollView: {
        width: '100%',
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
});

export default MainMenu;

