"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
  warningText?: string;
  deleting?: boolean;
  confirmLabel?: string;
  error?: string | null;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  warningText = "This action cannot be undone.",
  deleting = false,
  confirmLabel = "Delete",
  error = null,
}: ConfirmDeleteModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={() => {
        if (!deleting) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-slate-900 border border-white/20 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col justify-between my-auto max-h-[90vh] text-slate-100 relative z-[10000] fade-up"
      >
        {/* Modal Header */}
        <div>
          <div className="flex items-start justify-between mb-5">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shadow-inner">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              aria-label="Close modal"
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h2 id="modal-title" className="text-xl sm:text-2xl font-extrabold text-white mb-2">
            {title}
          </h2>

          <p className="text-slate-300 text-sm leading-relaxed mb-2">
            Are you sure you want to delete{" "}
            <span className="text-white font-bold">&quot;{itemName}&quot;</span>?
          </p>

          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            {warningText}
          </p>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs font-semibold text-center fade-up">
              {error}
            </div>
          )}
        </div>

        {/* Modal Footer Actions - Always visible at bottom */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-sm transition-all border border-white/10 disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-lg shadow-red-950/50 disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            {deleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
