
function ChatMessages({
  messages,
  username,
  Toaster
}) {
  return (
    <div className="flex-1 overflow-y-auto p-5">

      <Toaster/>

      <div className="space-y-3">

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg max-w-[300px] w-fit
            ${
              msg.username === username
                ? "ml-auto bg-black text-white"
                : "bg-white"
            }`}
          >

            <p className="font-bold">
              {msg.username}
            </p>

            <p>{msg.message}</p>

          </div>
        ))}

      </div>
    </div>
  );
}

export default ChatMessages;