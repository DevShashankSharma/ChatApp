import axios from 'axios';

export const axiosInstance = axios.create({
    baseURL: "https://chat-app-ipbs.vercel.app/",  //! base url for the api
    withCredentials: true,  //! send cookies when cross-domain requests
}); 