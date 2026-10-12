// client/src/components/ui/Button.jsx
import React from 'react';
import { Spinner } from './Spinner';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  icon: Icon = null,
  ...props
}) {
  const baseStyle = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-40 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover active:scale-[0.98] shadow-md shadow-primary/10 hover:shadow-primary/20',
    purple: 'bg-gradient-purple text-white hover:opacity-95 shadow-glow active:scale-[0.98]',
    secondary: 'bg-surface-elevated hover:bg-surface-hover text-white border border-white/5 active:scale-[0.98]',
    outline: 'border border-primary/40 hover:border-primary text-primary-hover hover:bg-primary/10 active:scale-[0.98]',
    danger: 'bg-error hover:bg-red-600 text-white shadow-md shadow-error/10 active:scale-[0.98]',
    ghost: 'bg-transparent text-white/60 hover:text-white hover:bg-white/5 active:scale-[0.98]'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Spinner size="sm" className="mr-2" />
      ) : Icon ? (
        <Icon className="w-4 h-4 mr-2" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
