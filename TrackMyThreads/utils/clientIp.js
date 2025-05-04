import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Key for storing client IP in AsyncStorage (for offline use)
const CLIENT_IP_KEY = 'track_my_threads_client_ip';

/**
 * Gets the device's IP address from network info or uses a cached value
 * @returns {Promise<string>} The client IP address
 */
export const getClientIp = async () => {
  try {
    // First, try to get the IP from current network state
    const networkState = await NetInfo.fetch();
    
    let clientIp = null;
    
    // Check if we have a valid IP from the current connection
    if (networkState.isConnected && networkState.details && networkState.details.ipAddress) {
      clientIp = networkState.details.ipAddress;
      console.log('Using current network IP:', clientIp);
      
      // Cache this IP for future offline use
      await AsyncStorage.setItem(CLIENT_IP_KEY, clientIp);
    } else {
      // If no current network IP, try to get the cached one
      clientIp = await AsyncStorage.getItem(CLIENT_IP_KEY);
      
      if (clientIp) {
        console.log('Using cached IP:', clientIp);
      } else {
        // If no cached IP either, use a fallback
        clientIp = '127.0.0.1';
        console.log('Using fallback IP:', clientIp);
        await AsyncStorage.setItem(CLIENT_IP_KEY, clientIp);
      }
    }
    
    return clientIp;
  } catch (error) {
    console.error('Error getting client IP:', error);
    // Fallback to localhost if there's an error
    return '127.0.0.1';
  }
}; 