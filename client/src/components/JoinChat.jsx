function JoinChat({
  username,
  setUsername,
  joinChat,
}) {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white p-8 rounded-xl shadow-md w-[350px]">

        <h1 className="text-2xl font-bold text-center mb-5">
          Chat App
        </h1>

        <input
          type="text"
          placeholder="Enter Username"
          className="w-full border p-3 rounded-lg mb-4 outline-none"
          value={username}
          onChange={(e) =>
            setUsername(e.target.value)
          }
        />

        <button
          onClick={joinChat}
          className="w-full bg-black text-white py-3 rounded-lg"
        >
          Join Chat
        </button>

      </div>
    </div>
  );
}

export default JoinChat;