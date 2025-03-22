import axios from 'axios';

export const axiosInstance = axios.create({
    baseURL: "http://localhost:5005/api/",  //! base url for the api
    withCredentials: true,  //! send cookies when cross-domain requests
}); 