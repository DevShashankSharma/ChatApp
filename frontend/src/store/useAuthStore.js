import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL || "https://chatapp-backend-nl5h.onrender.com/api";
const BASE_URL = (API_BASE && API_BASE.replace && API_BASE.replace(/\/api\/?$/, '')) || "https://chatapp-backend-nl5h.onrender.com";

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    onlineUsers: [],
    announcements: [],
    isAdmin: false,
    typingAllUser: null,
    socket: null,
    isCheckingAuth: true,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get('/auth/check');

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
            const res = await axiosInstance.post('/auth/signup', data);
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
            await axiosInstance.post('/auth/logout');
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
            const res = await axiosInstance.post('/auth/login', data);
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
            const res = await axiosInstance.put('/auth/update-profile', data);
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

        // announcement realtime
        socket.on('announcement', (announcement) => {
            set((state) => ({ announcements: [announcement, ...state.announcements] }));
        });

        socket.on('announcement:update', (announcement) => {
            set((state) => ({ announcements: state.announcements.map(a => a._id === announcement._id ? announcement : a) }));
        });

        socket.on('announcement:delete', ({ id }) => {
            set((state) => ({ announcements: state.announcements.filter(a => a._id !== id) }));
        });

        socket.on('typingAll', ({ userId }) => {
            set({ typingAllUser: userId });
        });

        socket.on('stopTypingAll', ({ userId }) => {
            const current = get().typingAllUser;
            if (current === userId) set({ typingAllUser: null });
        });

        socket.on("getOnlineUsers", (usersIds) => {
            set({ onlineUsers: usersIds });
        });
        socket.on("userOnline", (userId) => {
            set((state) => ({ onlineUsers: Array.from(new Set([...state.onlineUsers, userId])) }));
        });
        socket.on("userOffline", (userId) => {
            // backend emits without id in current impl for full list updates; handle both
            if (!userId) {
                // request will be refreshed by getOnlineUsers when emitted
                return;
            }
            set((state) => ({ onlineUsers: state.onlineUsers.filter(id => id !== userId) }));
        });
    },

    fetchAnnouncements: async () => {
        try {
            const res = await axiosInstance.get('/announcements');
            set({ announcements: res.data.announcements || [], isAdmin: !!res.data.isAdmin });
        } catch (error) {
            console.log('Error fetching announcements', error);
        }
    },

    fetchAllAnnouncements: async () => {
        try {
            const res = await axiosInstance.get('/announcements/all');
            return res.data.announcements || [];
        } catch (error) {
            console.log('Error fetching all announcements', error);
            throw error;
        }
    },

    postAnnouncement: async (payload) => {
        try {
            const res = await axiosInstance.post('/announcements', payload);
            // server will broadcast; also optimistically add
            set((state) => ({ announcements: [res.data.announcement, ...state.announcements] }));
            return res.data.announcement;
        } catch (error) {
            console.log('Error posting announcement', error);
            throw error;
        }
    },

    editAnnouncement: async (id, payload) => {
        try {
            const res = await axiosInstance.put(`/announcements/${id}`, payload);
            set((state) => ({ announcements: state.announcements.map(a => a._id === id ? res.data.announcement : a) }));
            return res.data.announcement;
        } catch (error) {
            console.log('Error editing announcement', error);
            throw error;
        }
    },

    deleteAnnouncement: async (id) => {
        try {
            await axiosInstance.delete(`/announcements/${id}`);
            set((state) => ({ announcements: state.announcements.filter(a => a._id !== id) }));
        } catch (error) {
            console.log('Error deleting announcement', error);
            throw error;
        }
    },

    disconnectSocket: () => {
        if (get().socket?.connected) get().socket.disconnect();
    },
}));