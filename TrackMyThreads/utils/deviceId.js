import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

// Key for storing device ID in AsyncStorage
const DEVICE_ID_KEY = 'track_my_threads_device_id';

/**
 * Gets the device ID from storage or creates a new one if it doesn't exist
 * @returns {Promise<string>} The device ID
 */
export const getDeviceId = async () => {
  try {
    // Try to get existing device ID
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    
    // If no device ID exists, create and store one
    if (!deviceId) {
      deviceId = uuidv4();
      console.log('Generated new device ID:', deviceId);
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    } else {
      console.log('Using existing device ID:', deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('Error managing device ID:', error);
    // Fallback to a temporary ID if storage fails
    return 'temp-' + Math.random().toString(36).substring(2, 15);
  }
};