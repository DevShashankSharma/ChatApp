import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { X, Send, Image } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";

const MessageInput = ({
  editingId,
  setEditingId,
  editingText,
  setEditingText,
  editMessage,
}) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { sendMessage, startTyping, stopTyping } = useChatStore();
  const { authUser } = useAuthStore();

  /* ---------------- IMAGE HANDLING ---------------- */

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ---------------- TYPING STATUS ---------------- */

  const handleTyping = (value) => {
    setText(value);

    const receiverId = useChatStore.getState().selectedUser?._id;
    if (!receiverId || !authUser) return;

    startTyping(receiverId);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(receiverId);
    }, 1500);
  };

  /* ---------------- SEND / EDIT MESSAGE ---------------- */

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!text.trim() && !imagePreview) return;

    try {
      if (editingId) {
        await editMessage(editingId, text.trim());
        setEditingId(null);
        setEditingText("");
      } else {
        await sendMessage({
          text: text.trim(),
          image: imagePreview,
        });
      }

      setText("");
      setImagePreview(null);

      if (fileInputRef.current) fileInputRef.current.value = "";

      const receiverId = useChatStore.getState().selectedUser?._id;
      if (receiverId) stopTyping(receiverId);

    } catch (error) {
      console.error("Failed sending message", error);
      toast.error("Failed to send message");
    }
  };

  /* ---------------- SYNC EDIT TEXT ---------------- */

  useEffect(() => {
    if (editingId) {
      setText(editingText || "");
    }
  }, [editingId, editingText]);

  /* ---------------- AUTO EXPAND TEXTAREA ---------------- */

  const autoResize = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  return (
    <div className="p-4 w-full border-t bg-base-100">

      {/* Image preview */}
      {imagePreview && (
        <div className="mb-3 flex items-center gap-3">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 rounded-lg object-cover border"
            />

            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 btn btn-circle btn-xs"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Edit indicator */}
      {editingId && (
        <div className="text-xs text-warning mb-2 flex justify-between">
          <span>Editing message...</span>

          <button
            className="text-error"
            onClick={() => {
              setEditingId(null);
              setText("");
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Message form */}
      <form
        onSubmit={handleSendMessage}
        className="flex items-end gap-2"
      >

        {/* Text area */}
        <textarea
          rows={1}
          value={text}
          placeholder="Type a message..."
          className="textarea textarea-bordered w-full resize-none"
          onChange={(e) => handleTyping(e.target.value)}
          onInput={autoResize}
        />

        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />

        {/* Image button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`btn btn-circle btn-ghost ${
            imagePreview ? "text-success" : ""
          }`}
        >
          <Image size={20} />
        </button>

        {/* Send button */}
        <button
          type="submit"
          disabled={!text.trim() && !imagePreview}
          className="btn btn-circle btn-primary"
        >
          <Send size={18} />
        </button>

      </form>
    </div>
  );
};

export default MessageInput;