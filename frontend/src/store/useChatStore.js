import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useChatStore = create((set, get) => ({
    chats: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isChatLoading: false,

    getUsers: async () => {
        try {
            set({ isUsersLoading: true });
            const res = await axiosInstance.get("/messages/users");
            // console.log(res.data);
            set({ users: res.data.filteredUsers });
        } catch (error) {
            console.log("Error in getting users", error);
            toast.error("Error in getting users");
        } finally {
            set({ isUsersLoading: false });
        }
    },

    getChats: async (userId) => {
        try {
            set({ isChatLoading: true });
            const res = await axiosInstance.get(`/messages/${userId}`);
            set({ chats: Array.isArray(res.data.messages) ? res.data.messages : [] });  // Ensure chats is always an array
            // console.log( res.data);
        } catch (error) {
            console.log("Error in getting chats", error);
            toast.error("Error in getting chats");
        } finally {
            set({ isChatLoading: false });
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, chats } = get();
        if (!Array.isArray(chats)) {
            console.error("chats is not an array:", chats);
        }
        try {
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
            set({ chats: [...(Array.isArray(chats) ? chats : []), res.data] }); // Ensure chats is an array before spreading
        } catch (error) {
            console.log("Error in sending message", error);
            toast.error("Error in sending message");
        }
    },

    // Todo : Optimize it in future
    setSelectedUser: (selectedUser) => set({ selectedUser }),
}));