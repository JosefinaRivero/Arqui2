import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const hotelService = {
  getHotels: () => api.get('/hotels'),
  getHotel: (id) => api.get(`/hotels/${id}`),
  createHotel: (hotel) => api.post('/hotels', hotel),
  updateHotel: (id, hotel) => api.put(`/hotels/${id}`, hotel),
  deleteHotel: (id) => api.delete(`/hotels/${id}`),
};

export const searchService = {
  searchHotels: (params) => api.get('/search', { params }),
};

export const userService = {
  getUsers: () => api.get('/users'),
  getUser: (id) => api.get(`/users/${id}`),
  getUserReservations: (id) => api.get(`/reservations/user/${id}`),
};

export const reservationService = {
  createReservation: (reservation) => api.post('/reservations', reservation),
  getReservations: () => api.get('/reservations'),
  checkAvailability: (params) => api.get('/availability', { params }),
};

export default api;