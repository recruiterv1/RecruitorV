import { X, FileText, Percent, Wallet, ExternalLink } from "lucide-react";
import { getRoleTerms } from "../lib/agreementTerms";

// Short, role-wise summary of the Terms shown when a user clicks the
// "Terms & Conditions" text on the registration form. Links out to the full
// agreement page for the selected role.
const TermsModal = ({ role, onClose }) => {
  const terms = getRoleTerms(role);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-blue-600" />
            <h2 className="font-bold text-gray-900">Terms &amp; Conditions</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {!terms ? (
            <p className="text-sm text-gray-500">
              Please select your role first to see the terms that apply to you.
            </p>
          ) : (
            <>
              {/* Role + headline percentage */}
              <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-orange-50 border-2 border-blue-100 mb-5">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your role</p>
                  <p className="font-bold text-gray-900">{terms.label}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">You earn</p>
                  <p className="text-xl font-extrabold text-orange-600">{terms.headline}</p>
                </div>
              </div>

              {/* Earnings */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <Percent size={15} className="text-blue-600" />
                  <h3 className="font-bold text-gray-900 text-sm">Earnings Structure</h3>
                </div>
                <ul className="space-y-1.5">
                  {terms.earnings.map((line, i) => (
                    <li key={i} className="text-sm text-gray-600 flex gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Payout */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet size={15} className="text-blue-600" />
                  <h3 className="font-bold text-gray-900 text-sm">Payout Structure</h3>
                </div>
                <ul className="space-y-1.5">
                  {terms.payout.map((line, i) => (
                    <li key={i} className="text-sm text-gray-600 flex gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {terms.note && (
                <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3 mb-5">
                  {terms.note}
                </p>
              )}

              {/* Full agreement link */}
              <a
                href={terms.agreementPath}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white py-3 rounded-xl font-semibold text-sm transition-all"
              >
                View full agreement <ExternalLink size={15} />
              </a>
              <p className="text-[11px] text-gray-400 text-center mt-2">
                This is a summary. The full agreement for your role governs in all cases.
              </p>
            </>
          )}

          <button
            onClick={onClose}
            className="w-full mt-3 border-2 border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-all text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
