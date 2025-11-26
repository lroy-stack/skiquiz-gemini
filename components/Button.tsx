import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  size = 'md',
  className = '',
  icon,
  ...props 
}) => {
  const baseStyles = "relative font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg";
  
  const variants = {
    primary: "bg-blue-500 hover:bg-blue-400 text-white shadow-blue-900/50 border-b-4 border-blue-700 active:border-b-0 active:translate-y-1",
    secondary: "bg-slate-700 hover:bg-slate-600 text-white shadow-slate-900/50 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1",
    danger: "bg-red-500 hover:bg-red-400 text-white shadow-red-900/50 border-b-4 border-red-700 active:border-b-0 active:translate-y-1",
    success: "bg-green-500 hover:bg-green-400 text-white shadow-green-900/50 border-b-4 border-green-700 active:border-b-0 active:translate-y-1",
    ghost: "bg-transparent hover:bg-white/10 text-blue-200 shadow-none border-none",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button 
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${fullWidth ? 'w-full' : ''} 
        ${className}
      `}
      {...props}
    >
      {icon && <span className="opacity-90">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
