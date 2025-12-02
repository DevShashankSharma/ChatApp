import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client'; 

const BASE_URL = "https://chat-app-ipbs.vercel.app/";

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSingningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    onlineUsers: [],
    socket: null,
    isCheckingAuth: true,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get('api/auth/check');

            set({ authUser: res.data })

            get().connectSocket();
        } catch (error) {
            console.log("Error in Checking Auth", error);
            set({ authUser: null })
        } finally {
            set({ isCheckingAuth: false })
        }
    },

    signup: async (data) => {
        try {
            set({ isSigningUp: true })
            const res = await axiosInstance.post('api/auth/signup', data);
            set({ authUser: res.data })
            toast.success("Account created successfully");

            get().connectSocket();
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isSigningUp: false })
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post('api/auth/logout');
            set({ authUser: null });
            toast.success("Logged out successfully");

            get().disconnectSocket();
        } catch (error) {
            toast.error("Error logging out");
            console.log("Error logging out", error);
        }
    },

    login: async (data) => {
        try {
            set({ isLoggingIn: true });
            const res = await axiosInstance.post('api/auth/login', data);
            set({ authUser: res.data });
            toast.success("Logged in successfully");

            get().connectSocket();
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isLoggingIn: false });
        }
    },

    updateProfile: async (data) => {
        try {
            set({ isUpdatingProfile: true });
            const res = await axiosInstance.put('api/auth/update-profile', data);
            set({ authUser: res.data });
            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error(error.response.data.message);
            console.log("Error updating profile", error);
        } finally {
            set({ isUpdatingProfile: false });
        }
    },

    connectSocket: () => {
        const { authUser } = get();
        if (!authUser || get().socket?.connected) return;

        const socket = io.connect(BASE_URL, {
            query: {
                userId: authUser._id
            }
        });
        socket.connect();
        
        set({ socket: socket });

        socket.on("getOnlineUsers", (usersIds) => {
            set({ onlineUsers: usersIds });
        });
    },

    disconnectSocket: () => {
        if (get().socket?.connected) get().socket.disconnect();
    },
})); 