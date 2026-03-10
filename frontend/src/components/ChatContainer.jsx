import { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore"
import ChatHeader from "./ChatHeader"
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils"; 
import { MoreVertical, Edit2, Trash2, Smile } from "lucide-react";
import { useState } from "react";

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

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chats.map((chat) => (
                    <div
                        key={chat._id}
                        className={`chat ${chat.senderId === authUser._id ? "chat-end" : "chat-start"}`}
                        ref={messageEndRef}
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
                            <div className="chat-text">
                                {chat.edited && <span className="text-xs opacity-60 mr-2">(edited)</span>}
                                {editingId === chat._id ? (
                                    <div className="flex gap-2">
                                        <input value={editingText} onChange={(e) => setEditingText(e.target.value)} className="input input-sm" />
                                        <button className="btn btn-sm" onClick={() => { editMessage(chat._id, editingText); setEditingId(null); }}>Save</button>
                                        <button className="btn btn-sm btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
                                    </div>
                                ) : (
                                    <>
                                        {chat.text}
                                        <div className="mt-1 flex items-center gap-2 text-xs opacity-70">
                                            {Array.isArray(chat.reactions) && chat.reactions.length > 0 && (
                                                <div className="flex gap-1">
                                                    {chat.reactions.map((r, i) => (
                                                        <span key={i} className="px-2 py-0.5 rounded-md bg-base-200">{r.emoji}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="mt-1 flex gap-2 items-center">
                                {String(chat.senderId) === String(authUser._id) && (
                                    <>
                                        <button title="Edit" className="btn btn-ghost btn-xs" onClick={() => { setEditingId(chat._id); setEditingText(chat.text || ""); }}><Edit2 size={14} /></button>
                                        <button title="Delete" className="btn btn-ghost btn-xs" onClick={() => deleteMessage(chat._id, true)}><Trash2 size={14} /></button>
                                    </>
                                )}
                                <div className="dropdown dropdown-hover dropdown-end">
                                    <label tabIndex={0} className="btn btn-ghost btn-xs"> <Smile size={14} /> </label>
                                    <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40">
                                        {['👍','❤️','😂','😮','😢','🎉'].map(e => (
                                            <li key={e}><button onClick={() => addReaction(chat._id, e)}>{e}</button></li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
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