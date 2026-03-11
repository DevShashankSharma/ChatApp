import React, { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { formatMessageTime } from "../lib/utils";
import { Edit2, Trash2, Smile } from "lucide-react";

const MessageBubble = ({ chat, selectedUser, isLast }) => {
    const { authUser } = useAuthStore();
    const { editMessage, deleteMessage, addReaction } = useChatStore();
    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(chat.text || "");
    const ref = useRef(null);

    useEffect(() => {
        if (isLast && ref.current) {
            ref.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [isLast]);

    useEffect(() => {
        // mount animation
        if (ref.current) {
            ref.current.classList.add('animate-fade-up');
        }
    }, []);

    const isMine = String(chat.senderId) === String(authUser._id);
    const isUnread = String(chat.receiverId) === String(authUser._id) && !((chat.readBy || []).find(id => String(id) === String(authUser._id)));

    return (
        <div ref={ref} className={`chat ${isMine ? 'chat-end' : 'chat-start'} ${isUnread ? 'message-new' : ''}`}>
            <div className="chat-image avatar">
                <div className="size-10 rounded-full">
                    <img src={isMine ? authUser.profilePic || "/avatar.png" : selectedUser.profilePic || "/avatar.png"} alt={isMine ? authUser.name : selectedUser.name} />
                </div>
            </div>

            <div className="chat-header mb-1">
                <time className="text-xs opacity-50">{formatMessageTime(chat.createdAt)}</time>
            </div>

            <div className="chat flex flex-col">
                {chat.image && (
                    <img src={chat.image} alt="Attachment" className="rounded-md mb-2 sm:max-w-[200px] max-w-[150px]" />
                )}

                <div className="chat-text">
                    {chat.edited && <span className="text-xs opacity-60 mr-2">(edited)</span>}
                    {editing ? (
                        <div className="flex gap-2">
                            <input value={text} onChange={(e) => setText(e.target.value)} className="input input-sm" />
                            <button className="btn btn-sm" onClick={() => { editMessage(chat._id, text); setEditing(false); }}>Save</button>
                            <button className="btn btn-sm btn-ghost" onClick={() => { setEditing(false); setText(chat.text || ''); }}>Cancel</button>
                        </div>
                    ) : (
                        <>{chat.text}</>
                    )}

                    <div className="mt-1 flex items-center gap-2 text-xs opacity-70">
                        {Array.isArray(chat.reactions) && chat.reactions.length > 0 && (
                            <div className="flex gap-1">
                                {chat.reactions.map((r, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded-md bg-base-200">{r.emoji}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-1 flex gap-2 items-center">
                    {isMine && (
                        <>
                            <button title="Edit" className="btn btn-ghost btn-xs" onClick={() => { setEditing(true); }}>{<Edit2 size={14} />}</button>
                            <button title="Delete" className="btn btn-ghost btn-xs" onClick={() => deleteMessage(chat._id, true)}>{<Trash2 size={14} />}</button>
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
    )
}

export default MessageBubble;
