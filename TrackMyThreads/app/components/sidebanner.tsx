import { 
    MaterialIcons,
    FontAwesome,
    Ionicons
} from '@expo/vector-icons';
import Entypo from '@expo/vector-icons/Entypo';
import { useRouter } from 'expo-router';
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

type RoutePath = '/' | '/clothingcatalog' | '/laundry';

const SideBanner = ({isVisible, onClose}: SideBannerProps) => {
    const router = useRouter();
    const menuItems: Array<{name: string; icon: 'home' | 'shirt' | 'water'; route: RoutePath}> = [
        {name: 'Home', icon: 'home', route: '/'},
        {name: 'Clothing Catalog', icon: 'shirt', route: '/clothingcatalog'},
        {name: 'Laundry', icon: 'water', route: '/laundry'},
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
                        router.push(item.route);
                        onClose();
                    }} 
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
