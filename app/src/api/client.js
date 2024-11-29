import axios from 'axios';

const client = axios.create({
    baseURL: 'http://localhost:4000/api',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});



export const fetchData = async (endpoint) => {
    try {
        const response = await client.get(endpoint);
        return response.data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export default client;
