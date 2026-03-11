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
    isTyping: false,

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

    editMessage: async (messageId, text) => {
        try {
            const res = await axiosInstance.put(`/messages/edit/${messageId}`, { text });
            // update local chats
            set({ chats: get().chats.map(c => (c._id === messageId ? res.data.message : c)) });
        } catch (error) {
            console.log('Error editing message', error);
            toast.error('Error editing message');
        }
    },

    deleteMessage: async (messageId, forEveryone = false) => {
        try {
            console.log('deleteMessage called for', messageId, 'forEveryone=', forEveryone);
            const res = await axiosInstance.delete(`/messages/${messageId}${forEveryone ? '?forEveryone=true' : ''}`);
            console.log('deleteMessage response', res?.data);
            set({ chats: get().chats.filter(c => c._id !== messageId) });
        } catch (error) {
            console.log('Error deleting message', error?.response || error);
            const msg = error?.response?.data?.message || error?.message || 'Error deleting message';
            toast.error(msg);
        }
    },

    markAsRead: async (messageId) => {
        try {
            await axiosInstance.post(`/messages/${messageId}/read`);
            // optimistic UI: add current user to readBy
            const userId = useAuthStore.getState().authUser._id;
            set({ chats: get().chats.map(m => m._id === messageId ? { ...m, readBy: Array.isArray(m.readBy) ? Array.from(new Set([...m.readBy, userId])) : [userId] } : m) });
        } catch (error) {
            console.log('Error marking as read', error);
        }
    },

    addReaction: async (messageId, emoji) => {
        try {
            const res = await axiosInstance.post(`/messages/${messageId}/reaction`, { emoji });
            set({ chats: get().chats.map(c => c._id === messageId ? res.data.message : c) });
        } catch (error) {
            console.log('Error adding reaction', error);
            toast.error('Error adding reaction');
        }
    },

    searchMessages: async (q) => {
        try {
            const res = await axiosInstance.get(`/messages/search?q=${encodeURIComponent(q)}`);
            return res.data.results || [];
        } catch (error) {
            console.log('Error searching messages', error);
            toast.error('Error searching messages');
            return [];
        }
    },

    subscribeToMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.on("newMessage", (newMessage) => {
            // use latest selectedUser from store to ensure listener works across changes
            const sel = get().selectedUser;
            // if no conversation open, ignore (client could instead show a badge)
            if (!sel) return;
            if (String(newMessage.senderId) !== String(sel._id) && String(newMessage.receiverId) !== String(sel._id)) return;
            set({ chats: [...(Array.isArray(get().chats) ? get().chats : []), newMessage] });
        });

        socket.on('editMessage', (message) => {
            set({ chats: get().chats.map(c => c._id === message._id ? message : c) });
        });

        socket.on('deleteMessage', ({ messageId }) => {
            set({ chats: get().chats.filter(c => c._id !== messageId) });
        });

        socket.on('reaction', (message) => {
            set({ chats: get().chats.map(c => c._id === message._id ? message : c) });
        });

        socket.on('messageRead', ({ messageId, readerId }) => {
            set({ chats: get().chats.map(m => m._id === messageId ? { ...m, readBy: Array.isArray(m.readBy) ? Array.from(new Set([...m.readBy, readerId])) : [readerId] } : m) });
        });

        socket.on('typing', () => {
            set({ isTyping: true });
        });
        socket.on('stopTyping', () => {
            set({ isTyping: false });
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage");
        socket.off('editMessage');
        socket.off('deleteMessage');
        socket.off('reaction');
        socket.off('messageRead');
        socket.off('typing');
        socket.off('stopTyping');
    },

    // Todo : Optimize it in future
    setSelectedUser: (selectedUser) => set({ selectedUser }),
    startTyping: (receiverId) => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;
        socket.emit('typing', receiverId);
    },
    stopTyping: (receiverId) => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;
        socket.emit('stopTyping', receiverId);
    }
}));