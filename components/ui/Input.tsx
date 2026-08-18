// Reusable Input component
import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, id, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full px-4 py-2.5 rounded-lg border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
          error
            ? "border-red-400 bg-red-50"
            : "border-slate-300 bg-white"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}
