import React from "react";

const ApplyModal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-[90%] md:w-[70%] max-h-[90vh] overflow-y-auto p-6 border border-blue-200 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full shadow-md bg-red-500 text-white hover:bg-red-600 transition-transform hover:scale-110"
        >
          ✖
        </button>

        {children}
      </div>
    </div>
  );
};

export default ApplyModal;

