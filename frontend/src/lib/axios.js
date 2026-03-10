import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || "https://chatapp-backend-nl5h.onrender.com/api";

export const axiosInstance = axios.create({
    baseURL: BASE,  //! base url for the api
    withCredentials: true,  //! send cookies when cross-domain requests
});