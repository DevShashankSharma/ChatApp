import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
    chats: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isChatLoading: false,
    isTyping: false, // Is the *other* user typing?

    getUsers: async () => {
        set({ isUsersLoading: true });
        try {
            const res = await axiosInstance.get('/api/messages/users');
            set({ users: res.data.filteredUsers });
        } catch (error) {
            toast.error(error.response?.data?.message || "Error fetching users");
        } finally {
            set({ isUsersLoading: false });
        }
    },

    getChats: async (userId) => {
        try {
            set({ isChatLoading: true });
            const res = await axiosInstance.get(`api/messages/${userId}`);
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
            const res = await axiosInstance.post(`api/messages/send/${selectedUser._id}`, messageData);
            set({ chats: [...(Array.isArray(chats) ? chats : []), res.data] }); // Ensure chats is an array before spreading
        } catch (error) {
            console.log("Error in sending message", error);
            toast.error("Error in sending message");
        }
    },

    subscribeToMessages: () => {
        const { selectedUser } = get();
        if (!selectedUser) return;

        const socket = useAuthStore.getState().socket;

        socket.on("newMessage", (newMessage) => {
            if (newMessage.senderId !== selectedUser._id) return;
            set({ chats: [...get().chats, newMessage] });
        });

        // Listen for typing events
        socket.on("typing", ({ senderId }) => {
            if (senderId === selectedUser._id) {
                set({ isTyping: true });
            }
        });

        socket.on("stopTyping", ({ senderId }) => {
            if (senderId === selectedUser._id) {
                set({ isTyping: false });
            }
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        if(socket) {
            socket.off("newMessage");
            socket.off("typing");
            socket.off("stopTyping");
        }
    },

    // Todo : Optimize it in future
    setSelectedUser: (selectedUser) => set({ selectedUser }),
}));