import { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
// import { motion, AnimatePresence } from "framer-motion"; // Add this package

const ChatContainer = () => {
    const { chats, getChats, isChatLoading, selectedUser, subscribeToMessages, unsubscribeFromMessages, isTyping } = useChatStore();
    const { authUser } = useAuthStore();
    const messageEndRef = useRef(null);

    useEffect(() => {
        if (selectedUser) getChats(selectedUser._id);
        subscribeToMessages();
        return () => unsubscribeFromMessages();
    }, [selectedUser, getChats, subscribeToMessages, unsubscribeFromMessages]);

    useEffect(() => {
        if (messageEndRef.current && chats) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chats, isTyping]); // Scroll when typing starts too

    if (isChatLoading) {
        return (
            <div className="flex flex-1 flex-col h-full overflow-hidden">
                <ChatHeader />
                <MessageSkeleton />
                <MessageInput />
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col h-full overflow-hidden">
            <ChatHeader />

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                    {chats.map((chat) => (
                        <motion.div
                            key={chat._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`chat ${chat.senderId === authUser._id ? "chat-end" : "chat-start"}`}
                        >
                            <div className="chat-image avatar">
                                <div className="size-10 rounded-full border border-base-300">
                                    <img
                                        src={chat.senderId === authUser._id ? authUser.profilePic || "/avatar.png" : selectedUser.profilePic || "/avatar.png"}
                                        alt="profile"
                                    />
                                </div>
                            </div>
                            <div className="chat-header mb-1">
                                <time className="text-xs opacity-50 ml-1">{formatMessageTime(chat.createdAt)}</time>
                            </div>
                            <div className={`chat-bubble flex flex-col ${chat.senderId === authUser._id ? "bg-primary text-primary-content" : "bg-base-200"}`}>
                                {chat.image && (
                                    <img
                                        src={chat.image}
                                        alt="Attachment"
                                        className="sm:max-w-[200px] rounded-md mb-2 cursor-pointer hover:scale-105 transition-transform"
                                        onClick={() => window.open(chat.image, '_blank')}
                                    />
                                )}
                                {chat.text && <p>{chat.text}</p>}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Typing Indicator */}
                {isTyping && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="chat chat-start"
                    >
                        <div className="chat-image avatar">
                            <div className="size-10 rounded-full">
                                <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.name} />
                            </div>
                        </div>
                        <div className="chat-bubble bg-base-200 text-xs italic opacity-70">
                            <span className="loading loading-dots loading-xs"></span>
                        </div>
                    </motion.div>
                )}
                
                <div ref={messageEndRef} />
            </div>

            <MessageInput />
        </div>
    );
};

export default ChatContainer;