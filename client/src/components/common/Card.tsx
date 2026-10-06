import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hover = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur ${
        hover ? 'hover:border-slate-700 hover:shadow-brand-500/5 transition cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
