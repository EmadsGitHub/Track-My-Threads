
import { 
    MaterialIcons,  // Material Design icons
    FontAwesome,    // Font Awesome icons
    Ionicons       // Ionicons
} from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import { Link } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Dimensions } from 'react-native';
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

interface SideBannerProps {
    isVisible: boolean;
    onClose: () => void;
}  

const CalendarScreen = () => {
    return (
      <Calendar style={styles.calendar}
        // Basic calendar
        markedDates={{
          '2025-02-26': {marked: true, dotColor: '#3674B5'},
          '2024-03-17': {selected: true, selectedColor: '#3674B5'}
        }}
        onDayPress={(day: DateData) => {
          console.log('selected day', day);
        }}
        theme={{
            backgroundColor: '#D1F8EF',
            calendarBackground: '#A1E3F9',
            textDayHeaderFontWeight: 'bold',
            textDayHeaderFontSize: 16,
            textDayHeaderFontColor: '#578FCA',
            dayTextColor: '#578FCA',
            textSectionTitleColor: '#578FCA',
            
        }}
      />
    );
  };

const SideBanner = ({isVisible, onClose}: SideBannerProps)=> {
    const navigation = useNavigation();
    const menuItems = [
        {name: 'Home', icon: 'home' as const, route: 'MainMenu'},
        {name: 'Login', icon: 'lock-open' as const, route: 'Login'},
    ];
    return (
        <View style={[styles.sidebannercontainer, {display: isVisible ? 'flex' : 'none'}
        ]}>
            <View style={styles.sidebannerheader}>
                <TouchableOpacity onPress={onClose}>
                    <Ionicons name="close" size={24} color="#FFFDD0" />
                </TouchableOpacity>
            </View>
            <ScrollView>
                {menuItems.map((item, index)=>(
                    <TouchableOpacity 
                    key={index} 
                    onPress={()=> {
                        navigation.navigate(item.route); 
                        onClose();
                        } } 
                        style={styles.sidebanneritem}>
                        <Ionicons name={item.icon} size={24} color="#578FCA" />
                        <Text style={styles.sidebannertext}>{item.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    )
}  

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

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;
const MainMenu = () => {
    const [isSideMenuVisible, setIsSideMenuVisible] = useState(false);
    return (
        <View style={styles.container}>
            <View style={styles.topBanner}>
                <TouchableOpacity onPress={() => setIsSideMenuVisible(true)}>
                    <Entypo name="menu" size={36} color="black" />
                </TouchableOpacity>
                <SearchBar />
                <FontAwesome name="qrcode" size={36} color="black" />
            </View>
            <SideBanner isVisible={isSideMenuVisible} onClose={() => setIsSideMenuVisible(false)} />
            <View style={styles.header}>
                <Text style={styles.headerText}>Hello!</Text>
                <Text style={styles.headerSubtext}>What are we wearing today?</Text>
            </View>
            <View style={styles.mainmenucontent}>
                <CalendarScreen />
                <Text>Main Menu</Text>
            </View>            
        </View>
    );
};

const styles = StyleSheet.create({

    container: {
        flex: 1,
        
        backgroundColor: '#3674B5',
    },
    header: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 50,
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
    },
    searchInput: {
        width: width*0.7,
        height: 40,
        borderWidth: 1,
        borderColor: '#FFFDD0',
        borderRadius: 10,
        paddingLeft: 10,
        color: '#FFFDD0',
    },
    topBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: height*0.05,

    },
    sidebannercontainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '30%',
        height: '100%',
        backgroundColor: '#A1E3F9',
    },
    sidebannerheader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 16,
    },
    sidebannertext: {
        fontSize: 20,
        color: '#578FCA',
    },
    sidebanneritem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    mainmenucontent: {
        backgroundColor: '#D1F8EF',
        flex: 6,
        alignItems: 'center',
        paddingTop: 50,
        borderTopLeftRadius: 85,    // Rounded top corners
        borderTopRightRadius: 85,
    },
    calendar: {
        width: 300
    },

});

export default MainMenu;

