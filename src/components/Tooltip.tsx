'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  maxWidth?: string;
  interactive?: boolean;
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  className = '',
  maxWidth = 'max-w-xs',
  interactive = false
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsVisible(true), 80);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsVisible(false), 120);
  };

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(prev => !prev);
  };

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: Event) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsVisible(false);
      }
    }
    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isVisible]);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[#191919] border-x-transparent border-b-transparent border-t-4 border-x-4 border-b-0',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[#191919] border-x-transparent border-t-transparent border-b-4 border-x-4 border-t-0',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[#191919] border-y-transparent border-r-transparent border-l-4 border-y-4 border-r-0',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[#191919] border-y-transparent border-l-transparent border-r-4 border-y-4 border-l-0'
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={toggle}
    >
      {children}

      {isVisible && (
        <div
          role="tooltip"
          onMouseEnter={interactive ? show : undefined}
          onMouseLeave={interactive ? hide : undefined}
          className={`absolute z-50 px-2.5 py-1.5 bg-[#191919] text-white text-xs rounded-lg shadow-xl border border-slate-700/60 pointer-events-auto leading-relaxed animate-fadeIn ${maxWidth} ${positionClasses[position]}`}
        >
          {content}
          <div className={`absolute w-0 h-0 pointer-events-none ${arrowClasses[position]}`} />
        </div>
      )}
    </div>
  );
}

/**
 * Convenient standalone info icon button that triggers a tooltip
 */
export function InfoTooltip({
  content,
  position = 'top',
  className = '',
  maxWidth = 'max-w-xs',
  size = 13
}: {
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  maxWidth?: string;
  size?: number;
}) {
  return (
    <Tooltip content={content} position={position} maxWidth={maxWidth} className={className}>
      <span
        tabIndex={0}
        aria-label="Información adicional"
        className="inline-flex items-center justify-center p-0.5 rounded-full text-slate-400 hover:text-[#F6911E] hover:bg-orange-50 focus:outline-none focus:ring-1 focus:ring-[#F6911E] transition-colors cursor-help"
      >
        <Info style={{ width: size, height: size }} />
      </span>
    </Tooltip>
  );
}
