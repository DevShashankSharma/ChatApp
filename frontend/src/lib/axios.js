import axios from 'axios';

export const axiosInstance = axios.create({
    baseURL: import.meta.env.MODE === "development" ? "http://localhost:5005" : "https://chat-app-ipbs.vercel.app/", 
    withCredentials: true,
});