import { FontAwesome5 } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';    



// Define the structure of a list item

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
// Props for the MobileList component
interface MobileListProps {
  items: ClothingItem[];
  onItemPress: (item: ClothingItem) => void;
}

const MobileList = ({ items, onItemPress }: MobileListProps) => {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {items.map((item, index) => (
          <View key={item.id} style={styles.listItem}>
            {/* Left side - Icon */}
            <TouchableOpacity 
              style={styles.iconContainer} 
              onPress={() => onItemPress(item)}
            >
                <FontAwesome5 name="tshirt" size={24} color="black" />
            </TouchableOpacity>
            
            {/* Middle - Content */}
            <TouchableOpacity 
              style={styles.contentContainer}
              onPress={() => onItemPress(item)}
            >
              <Text style={styles.titleText}>{item.name}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  scrollView: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6c7a89',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  iconText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
    paddingRight: 15,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  contentText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  }
});

export default MobileList; 