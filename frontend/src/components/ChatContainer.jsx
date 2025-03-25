import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore"
import ChatHeader from "./ChatHeader"
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
    const { chats, getChats, isChatLoading, selectedUser } = useChatStore();
    const { authUser } = useAuthStore()

    useEffect(() => {
        // console.log("selectedUser", selectedUser);
        if (selectedUser) getChats(selectedUser._id);
    }, [selectedUser, getChats,  ]);
    // console.log(Array.isArray(chats), chats);

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

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chats.map((chat) => (
                    <div
                        key={chat._id}
                        className={`chat ${chat.senderId === authUser._id ? "chat-end" : "chat-start"}`}
                    >
                        <div className="chat-image avatar">
                            <div className="size-10 rounded-full">
                                <img
                                    src={chat.senderId === authUser._id ? authUser.profilePic || "/avatar.png" : selectedUser.profilePic || "/avatar.png"}
                                    alt={chat.senderId === authUser._id ? authUser.name : selectedUser.name}
                                />
                            </div>
                        </div>
                        <div className="chat-header mb-1">
                            <time className="text-xs opacity-50">{formatMessageTime(chat.createdAt)}</time>
                        </div>
                        <div className="chat flex flex-col">
                            {chat.image && (
                                <img
                                    src={chat.image}
                                    alt="Attachment"
                                    className="rounded-md mb-2 sm:max-w-[200px] max-w-[150px]"
                                />
                            )}
                            <div className="chat-text">{chat.text}</div>
                        </div>
                    </div>
                ))}
            </div>

            <MessageInput />
        </div>
    );
}

export default ChatContainer