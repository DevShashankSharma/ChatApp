import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore"
import ChatHeader from "./ChatHeader"
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import MessageBubble from "./MessageBubble";

const ChatContainer = () => {
    const { chats, getChats, isChatLoading, selectedUser, subscribeToMessages, unsubscribeFromMessages } = useChatStore();
    const { authUser } = useAuthStore()

    const messageEndRef = useRef(null);
    const [editingId, setEditingId] = useState(null);
    const [editingText, setEditingText] = useState("");
    const { editMessage, deleteMessage, addReaction, markAsRead, isTyping } = useChatStore();

    useEffect(() => {
        // console.log("selectedUser", selectedUser);
        if (selectedUser) getChats(selectedUser._id);

        subscribeToMessages();

        // mark fetched chats as read
        const markRead = async () => {
            const messages = useChatStore.getState().chats || [];
            const myId = authUser._id;
            for (const m of messages) {
                if (String(m.receiverId) === String(myId) && !(m.readBy || []).find(id => id === myId)) {
                    await markAsRead(m._id);
                }
            }
        }
        markRead();

        return () => unsubscribeFromMessages();
    }, [selectedUser, getChats, subscribeToMessages, unsubscribeFromMessages]);
    // console.log(Array.isArray(chats), chats);

    useEffect(() => {
        if (messageEndRef.current) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chats]);

    if (isChatLoading) {
        return (
            <div className="flex flex-1 flex-col h-full overflow-auto">
                <ChatHeader />
                <MessageSkeleton />
                <MessageInput />
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col h-full overflow-auto">
            <ChatHeader />

            <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-live="polite" aria-atomic="false">
                {chats.map((chat, idx) => (
                    <MessageBubble key={chat._id} chat={chat} selectedUser={selectedUser} isLast={idx === chats.length - 1} />
                ))}
                {isTyping && (
                    <div className="p-2 text-sm opacity-70">Typing...</div>
                )}
            </div>

            <MessageInput />
        </div>
    );
}

export default ChatContainer