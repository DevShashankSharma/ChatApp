import axios from 'axios';

export const axiosInstance = axios.create({
<<<<<<< HEAD
    baseURL: import.meta.env.MODE === "development" ? "http://localhost:5005" : "https://chat-app-ipbs.vercel.app/", 
    withCredentials: true,
});
=======
    baseURL: "https://chatapp-backend-nl5h.onrender.com/api/",  //! base url for the api
    withCredentials: true,  //! send cookies when cross-domain requests
}); 
>>>>>>> project
