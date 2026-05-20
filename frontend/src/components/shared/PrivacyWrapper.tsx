import React from 'react';
import { usePrivacy } from '@/context/PrivacyContext';
import { Lock, Unlock } from 'lucide-react';

interface PrivacyWrapperProps {
  keyName: string;
  children: React.ReactNode;
  inline?: boolean;
  placeholder?: React.ReactNode;
  className?: string;
  highlightClassName?: string;
}

export const PrivacyWrapper: React.FC<PrivacyWrapperProps> = ({
  keyName,
  children,
  inline = false,
  placeholder,
  className = '',
  highlightClassName = '',
}) => {
  const { isMasked, isEditMode, privacySettings, toggleKeyMask } = usePrivacy();

  const isCurrentKeyMasked = !!privacySettings[keyName];

  // Element class wrapper depending on block vs inline
  const Tag = inline ? 'span' : 'div';

  const handleClick = (e: React.MouseEvent) => {
    if (isEditMode) {
      e.preventDefault();
      e.stopPropagation();
      toggleKeyMask(keyName);
    }
  };

  if (isEditMode) {
    return (
      <Tag
        onClick={handleClick}
        className={`relative inline-block cursor-pointer transition-all duration-300 border-2 rounded p-1 group z-50 ${
          isCurrentKeyMasked
            ? 'border-rose-500 bg-rose-500/10 hover:bg-rose-500/20'
            : 'border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20'
        } ${className} ${highlightClassName}`}
        title={`Click to ${isCurrentKeyMasked ? 'show' : 'mask'} this element when privacy is active`}
      >
        <span className="opacity-80 pointer-events-none">{children}</span>
        
        {/* Floating status icon */}
        <span
          className={`absolute -top-3.5 -right-2 px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 shadow-md transition-all duration-300 z-[100] ${
            isCurrentKeyMasked
              ? 'bg-rose-600 text-white'
              : 'bg-emerald-600 text-white'
          }`}
        >
          {isCurrentKeyMasked ? (
            <>
              <Lock className="w-2.5 h-2.5" />
              <span>Masked</span>
            </>
          ) : (
            <>
              <Unlock className="w-2.5 h-2.5" />
              <span>Visible</span>
            </>
          )}
        </span>
      </Tag>
    );
  }

  // Normal mode
  const masked = isMasked(keyName);

  if (masked) {
    if (placeholder !== undefined) {
      return <Tag className={className}>{placeholder}</Tag>;
    }
    // Default blur and low opacity styling
    return (
      <Tag
        className={`inline-block select-none pointer-events-none filter blur-[5px] opacity-35 transition-all duration-300 ${className}`}
      >
        {children}
      </Tag>
    );
  }

  return <Tag className={className}>{children}</Tag>;
};
