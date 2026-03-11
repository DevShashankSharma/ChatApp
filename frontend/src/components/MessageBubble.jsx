import React, { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useThemeStore } from "../store/useThemeStore";
import { formatMessageTime } from "../lib/utils";
import { Edit2, Trash2, Smile } from "lucide-react";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

const MessageBubble = ({
    chat,
    selectedUser,
    isLast,
    editingId,
    setEditingId,
    editingText,
    setEditingText
}) => {
    const { authUser } = useAuthStore();
    const { editMessage, deleteMessage, addReaction } = useChatStore();
    const { theme } = useThemeStore();

    const ref = useRef(null);
    const [showReactions, setShowReactions] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isMine = String(chat.senderId) === String(authUser._id);

    useEffect(() => {
        if (isLast && ref.current) {
            ref.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [isLast]);

    const reactionCounts = Array.isArray(chat.reactions)
        ? chat.reactions.reduce((acc, r) => {
            const emoji = r.emoji || String(r);
            acc[emoji] = (acc[emoji] || 0) + 1;
            return acc;
        }, {})
        : {};

    return (
        <div
            ref={ref}
            data-theme={theme}
            className={`chat w-full ${isMine ? "chat-end" : "chat-start"}`}
        >

            {/* Avatar */}
            <div className="chat-image avatar">
                <div className="w-10 rounded-full">
                    <img
                        src={
                            isMine
                                ? authUser.profilePic || "/avatar.png"
                                : selectedUser.profilePic || "/avatar.png"
                        }
                        alt="avatar"
                    />
                </div>
            </div>

            {/* Time */}
            <div className="chat-header text-xs opacity-50 mb-1">
                {formatMessageTime(chat.createdAt)}
            </div>

            <div className="flex flex-col gap-1">

                {/* Message Bubble */}
                <div
                    className={`rounded-xl px-4 py-2 shadow-sm min-w-50 text-end
          ${isMine
                            ? "bg-primary text-primary-content"
                            : "bg-base-200 text-base-content"}
          max-w-[80%] sm:max-w-[65%] md:max-w-[55%] lg:max-w-[45%]`}
                >

                    {/* Image */}
                    {chat.image && (
                        <img
                            src={chat.image}
                            alt="attachment"
                            className="rounded-md mb-2 max-h-60 object-cover"
                        />
                    )}

                    {/* Edit Mode */}
                    {editingId === chat._id ? (
                        <div className="flex flex-col gap-2 w-full">

                            <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="textarea textarea-bordered w-full min-h-[80px] resize-none"
                                autoFocus
                            />

                            <div className="flex gap-2 justify-end">
                                <button
                                    className="btn btn-xs btn-success"
                                    onClick={async () => {
                                        await editMessage(chat._id, editingText);
                                        setEditingId(null);
                                        setEditingText("");
                                    }}
                                >
                                    Save
                                </button>

                                <button
                                    className="btn btn-xs btn-ghost"
                                    onClick={() => setEditingId(null)}
                                >
                                    Cancel
                                </button>
                            </div>

                        </div>
                    ) : (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {chat.text}
                        </p>
                    )}

                    {chat.edited && (
                        <span className="text-[10px] opacity-60">(edited)</span>
                    )}

                    {/* Reaction Display */}
                    {Object.keys(reactionCounts).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {Object.entries(reactionCounts).map(([emoji, count]) => (
                                <div
                                    key={emoji}
                                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-base-100 border text-sm"
                                >
                                    <span>{emoji}</span>
                                    <span className="text-xs opacity-70">{count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-1">

                    {/* Reaction Button */}
                    <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => setShowReactions(!showReactions)}
                    >
                        <Smile size={16} />
                    </button>

                    {/* Edit + Delete */}
                    {isMine && (
                        <>
                            <button
                                className="btn btn-ghost btn-xs"
                                onClick={() => {
                                    setEditingId(chat._id);
                                    setEditingText(chat.text || "");
                                }}
                            >
                                <Edit2 size={14} />
                            </button>

                            <button
                                className="btn btn-ghost btn-xs"
                                onClick={async () => {
                                    // confirm and choose delete mode
                                    const everyone = confirm('Delete for everyone? OK = yes, Cancel = no (delete for me)');
                                    try {
                                        setIsDeleting(true);
                                        await deleteMessage(chat._id, everyone);
                                    } catch (err) {
                                        // error handled in store; keep UI stable
                                    } finally {
                                        setIsDeleting(false);
                                    }
                                }}
                                disabled={isDeleting}
                            >
                                {isDeleting ? <span className="loading loading-spinner loading-sm" /> : <Trash2 size={14} />}
                            </button>
                        </>
                    )}
                </div>

                {/* Reaction Picker */}
                <div className="h-10 flex items-center">
                    {showReactions && (
                        <div className="flex gap-2 px-3 py-1 bg-base-200 rounded-full shadow">
                            {EMOJIS.map((emoji) => (
                                <button
                                    key={emoji}
                                    className="text-lg hover:scale-125 transition"
                                    onClick={() => {
                                        addReaction(chat._id, emoji);
                                        setShowReactions(false);
                                    }}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default MessageBubble;