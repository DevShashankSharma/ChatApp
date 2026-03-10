import axios from 'axios';

export const axiosInstance = axios.create({
    baseURL: "https://chatapp-backend-nl5h.onrender.com/api/",  //! base url for the api
    withCredentials: true,  //! send cookies when cross-domain requests
}); 