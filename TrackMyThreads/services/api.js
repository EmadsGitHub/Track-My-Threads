import { getDeviceId } from '../utils/deviceId';

// Base URL for your API
const API_BASE_URL = 'http://10.0.0.116:3000/api';

/**
 * Performs a fetch request with the device ID header
 * @param {string} endpoint - API endpoint to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
export const fetchWithDeviceId = async (endpoint, options = {}) => {
  try {
    const deviceId = await getDeviceId();
    
    // Ensure headers object exists
    const headers = options.headers || {};
    
    // Add device ID to headers
    const fetchOptions = {
      ...options,
      headers: {
        ...headers,
        'Device-ID': deviceId,
        'Content-Type': 'application/json',
      },
    };
    
    console.log(`Making ${options.method || 'GET'} request to ${endpoint} with device ID`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
    
    // For responses that aren't JSON (like image data)
    if (endpoint.includes('/image/')) {
      return response.text();
    }
    
    // For normal JSON responses
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Helper methods for common requests
export const api = {
  // Get all clothing items
  editClothingCatalog: (name, data) => fetchWithDeviceId(`/clothes/clothingcatalog/${name}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  uploadClothingCatalog: (data) => fetchWithDeviceId('/clothes/clothingcatalog', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteClothingCatalog: (name) => fetchWithDeviceId(`/clothes/clothingcatalog/${name}`, {
    method: 'DELETE',
  }),
  // Get image for a clothing item
  getClothingImage: (name) => fetchWithDeviceId(`/clothes/image/${name}`),
  getAllClothesFromCatalog: () => fetchWithDeviceId('/clothes/clothingcatalog'),
  getAllClothes: () => fetchWithDeviceId('/clothes'),

  updateClothingItem: (name, data) => fetchWithDeviceId(`/clothes/${name}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteClothes: (id) => fetchWithDeviceId(`/clothes/${id}`, {
    method: 'DELETE',
  }),
  addClothes: (data) => fetchWithDeviceId('/clothes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getAllLaundryList: () => fetchWithDeviceId('/clothes/laundrylist'),
  uploadLaundryList: (data) => fetchWithDeviceId('/clothes/laundrylist', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  clearLaundryList: () => fetchWithDeviceId('/clothes/laundrylist/all', {
    method: 'DELETE',
  }),
  deleteLaundryList: (id) => fetchWithDeviceId(`/clothes/laundrylist/${id}`, {
    method: 'DELETE',
  }),




  
  // Get laundry list
  
};