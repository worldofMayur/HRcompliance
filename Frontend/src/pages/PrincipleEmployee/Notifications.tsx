import React from "react";

const Notifications = () => {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Notifications</h1>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <p className="text-gray-600">
          No notifications available.
        </p>

        {/* 🔥 Later: show auditor comments / alerts */}
      </div>
    </div>
  );
};

export default Notifications;