function Sidebar({ users }) {
  return (
    <div className="w-[250px] bg-white border-r p-5">
      <h2 className="text-xl font-bold mb-4">
        Users
      </h2>

      <div className="space-y-2">

        {Object.entries(users).map(([id, user]) => (
          <div
            key={id}
            className="flex items-center justify-between bg-gray-100 p-2 rounded-lg"
          >
            <span>{user.username}</span>

            <span
              className={`w-3 h-3 rounded-full ${
                user.status === "online"
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            />
          </div>
        ))}

      </div>
    </div>
  );
}

export default Sidebar;