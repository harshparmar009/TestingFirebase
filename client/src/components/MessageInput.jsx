function MessageInput({
  message,
  setMessage,
  sendMessage,
}) {
  return (
    <div className="bg-white p-5 border-t flex gap-3">

      <input
        type="text"
        placeholder="Type message..."
        className="flex-1 border p-3 rounded-lg outline-none"
        value={message}
        onChange={(e) =>
          setMessage(e.target.value)
        }
      />

      <button
        onClick={sendMessage}
        className="bg-black text-white px-6 rounded-lg"
      >
        Send
      </button>

    </div>
  );
}

export default MessageInput;