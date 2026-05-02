import axios from 'axios';
import { Platform } from 'react-native';

// Use 10.0.2.2 for Android emulator to access localhost
const BASE_URL = 'http://192.168.19.21:5000/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;
