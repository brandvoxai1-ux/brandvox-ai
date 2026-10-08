// client/src/components/ui/Input.jsx
import React from 'react';

/**
 * Premium Text Input Component
 */
export function Input({
  label = '',
  type = 'text',
  placeholder = '',
  error = '',
  className = '',
  id,
  name,
  ...props
}) {
  const generatedId = id || (label ? `input-${label.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}` : undefined);
  const inputName = name || generatedId;

  return (
    <div className={`flex flex-col space-y-1.5 w-full ${className}`}>
      {label && generatedId && (
        <label 
          htmlFor={generatedId} 
          className="text-xs font-bold text-white/75 uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <input
        type={type}
        id={generatedId}
        name={inputName}
        placeholder={placeholder}
        className={`bg-surface-elevated text-white border border-white/10 rounded-lg px-4 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder-white/50 ${
          error ? 'border-error/60 focus:ring-error/20' : ''
        }`}
        {...props}
      />
      {error && <span className="text-xs text-error font-semibold">{error}</span>}
    </div>
  );
}

/**
 * Premium Resizable Textarea Component
 */
export function Textarea({
  label = '',
  placeholder = '',
  error = '',
  className = '',
  rows = 4,
  id,
  name,
  ...props
}) {
  const generatedId = id || (label ? `textarea-${label.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}` : undefined);
  const textareaName = name || generatedId;

  return (
    <div className={`flex flex-col space-y-1.5 w-full ${className}`}>
      {label && generatedId && (
        <label 
          htmlFor={generatedId} 
          className="text-xs font-bold text-white/75 uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <textarea
        id={generatedId}
        name={textareaName}
        placeholder={placeholder}
        rows={rows}
        className={`bg-surface-elevated text-white border border-white/10 rounded-lg px-4 py-3 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder-white/50 resize-none ${
          error ? 'border-error/60 focus:ring-error/20' : ''
        }`}
        {...props}
      />
      {error && <span className="text-xs text-error font-semibold">{error}</span>}
    </div>
  );
}

/**
 * Premium Custom Dropdown Component
 */
export function Select({
  label = '',
  options = [],
  error = '',
  className = '',
  id,
  name,
  ...props
}) {
  const generatedId = id || (label ? `select-${label.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}` : undefined);
  const selectName = name || generatedId;

  return (
    <div className={`flex flex-col space-y-1.5 w-full ${className}`}>
      {label && generatedId && (
        <label 
          htmlFor={generatedId} 
          className="text-xs font-bold text-white/50 uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <select
        id={generatedId}
        name={selectName}
        className={`bg-surface-elevated text-white border border-white/10 rounded-lg px-4 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          error ? 'border-error/60 focus:ring-error/20' : ''
        }`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-surface-elevated text-white">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-error font-semibold">{error}</span>}
    </div>
  );
}
