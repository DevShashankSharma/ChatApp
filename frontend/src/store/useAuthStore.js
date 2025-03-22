import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { data } from 'react-router-dom';

export const useAuthStore = create((set) => ({
    authUser: null,
    isSingningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,

    isCheckingAuth: true,
    checkAuth: async () => {
        try {
            const res = await axiosInstance.get('/auth/check');

            set({ authUser: res.data})
        } catch (error) {
            console.log("Error in Checking Auth", error);
            set({ authUser: null })
        } finally {
            set({ isCheckingAuth: false })
        }
    },

    signup : async (data) => {
        try {
            set({ isSigningUp: true })
            const res = await axiosInstance.post('/auth/signup', data);
            set({ authUser: res.data })
        } catch (error) {
            console.log("Error in Signing Up", error);
        } finally {
            set({ isSigningUp: false })
        }
    },
}));