import { getClientIp } from '../utils/clientIp';

// Base URL for your API
const API_BASE_URL = 'http://10.0.0.116:3000/api';

/**
 * Performs a fetch request with the client IP header
 * @param {string} endpoint - API endpoint to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
export const fetchWithClientIp = async (endpoint, options = {}) => {
  try {
    const clientIp = await getClientIp();
    
    // Ensure headers object exists
    const headers = options.headers || {};
    
    // Add client IP to headers
    const fetchOptions = {
      ...options,
      headers: {
        ...headers,
        'X-Forwarded-For': clientIp,
        'Content-Type': 'application/json',
      },
    };
    
    console.log(`Making ${options.method || 'GET'} request to ${endpoint} with client IP: ${clientIp}`);
    
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
  editClothingCatalog: (name, data) => fetchWithClientIp(`/clothes/clothingcatalog/${name}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  uploadClothingCatalog: (data) => fetchWithClientIp('/clothes/clothingcatalog', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteClothingCatalog: (name) => fetchWithClientIp(`/clothes/clothingcatalog/${name}`, {
    method: 'DELETE',
  }),
  // Get image for a clothing item
  getClothingImage: (name) => fetchWithClientIp(`/clothes/image/${name}`),
  getAllClothesFromCatalog: () => fetchWithClientIp('/clothes/clothingcatalog'),
  getAllClothes: () => fetchWithClientIp('/clothes'),

  updateClothingItem: (name, data) => fetchWithClientIp(`/clothes/${name}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteClothes: (id) => fetchWithClientIp(`/clothes/${id}`, {
    method: 'DELETE',
  }),
  addClothes: (data) => fetchWithClientIp('/clothes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getAllLaundryList: () => fetchWithClientIp('/clothes/laundrylist'),
  uploadLaundryList: (data) => fetchWithClientIp('/clothes/laundrylist', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  clearLaundryList: () => fetchWithClientIp('/clothes/laundrylist/all', {
    method: 'DELETE',
  }),
  deleteLaundryList: (id) => fetchWithClientIp(`/clothes/laundrylist/${id}`, {
    method: 'DELETE',
  }),
  checkAndAddToLaundry: () => fetchWithClientIp('/clothes/checkandaddtolist', {
    method: 'GET',
  }),




  
  // Get laundry list
  
};