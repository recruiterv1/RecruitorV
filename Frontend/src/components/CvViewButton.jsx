import React, { useState } from 'react';
import { Eye, X } from 'lucide-react';
import CvPreview from './CvPreview';

/**
 * "View" button that opens the CV inside an in-app modal (works in the native
 * app where window.open is unreliable). Renders PDF and DOCX via CvPreview.
 */
const CvViewButton = ({ url, label = 'View', className = '' }) => {
  const [open, setOpen] = useState(false);
  if (!url) return <span className="text-gray-400 text-sm">—</span>;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className || 'inline-flex items-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all font-medium text-sm'}
      >
        <Eye size={16} /> {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 flex items-stretch sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white w-full h-full sm:h-[88vh] sm:max-w-3xl sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="font-bold text-gray-800 text-sm">Candidate CV</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <CvPreview url={url} height="100%" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CvViewButton;
