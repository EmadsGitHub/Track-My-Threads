import { 
    MaterialIcons,
    FontAwesome,
    Ionicons
} from '@expo/vector-icons';
import Entypo from '@expo/vector-icons/Entypo';
import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity,
    ScrollView,
} from 'react-native';

interface SideBannerProps {
    isVisible: boolean;
    onClose: () => void;
}

const SideBanner = ({isVisible, onClose}: SideBannerProps) => {
    const navigation = useNavigation();
    const menuItems = [
        {name: 'Home', icon: 'home' as const, route: 'MainMenu'},
        {name: 'Login', icon: 'lock-open' as const, route: 'Login'},
        {name: 'Laundry', icon: 'water' as const, route: 'Laundry'},
    ];
    return (
        <View style={[styles.sidebannercontainer, {display: isVisible ? 'flex' : 'none'}]}>
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
                        // @ts-ignore - Add type assertion to fix the navigation error
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


// Styles (matching mainmenu.tsx)
const styles = StyleSheet.create({

    sidebannercontainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '30%',
        height: '100%',
        backgroundColor: '#A1E3F9',
        zIndex: 10,
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
});

export default SideBanner;
