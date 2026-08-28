import React, { useState, useEffect } from 'react';
import { getInitials, getAvatarGradient } from '../../utils/imageCompressor';

export interface UserAvatarProps {
  avatar?: string | null;
  name?: string;
  role?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  rounded?: string;
  showBadge?: boolean;
}

const SIZE_MAP = {
  xs: {
    container: 'w-6 h-6 text-[10px]',
    rounded: 'rounded-lg',
  },
  sm: {
    container: 'w-8 h-8 text-xs',
    rounded: 'rounded-xl',
  },
  md: {
    container: 'w-10 h-10 text-sm',
    rounded: 'rounded-xl',
  },
  lg: {
    container: 'w-12 h-12 text-base',
    rounded: 'rounded-2xl',
  },
  xl: {
    container: 'w-16 h-16 text-xl',
    rounded: 'rounded-2xl',
  },
  '2xl': {
    container: 'w-20 h-20 text-2xl',
    rounded: 'rounded-3xl',
  },
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatar,
  name,
  role,
  size = 'md',
  className = '',
  rounded,
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [avatar]);

  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;
  const radiusClass = rounded || sizeConfig.rounded;
  const initials = getInitials(name);
  const gradientClass = getAvatarGradient(name, role);

  const hasCustomPhoto = Boolean(avatar && avatar.trim() && !imgError);

  if (hasCustomPhoto) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden ${sizeConfig.container} ${radiusClass} border border-slate-200/80 shadow-xs bg-slate-100 ${className}`}
      >
        <img
          src={avatar!}
          alt={name || 'User'}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  // Tampilan Avatar Inisial (Hybrid 0 KB)
  return (
    <div
      title={name || 'Pengguna'}
      className={`relative shrink-0 flex items-center justify-center font-black tracking-tight select-none bg-gradient-to-br ${gradientClass} ${sizeConfig.container} ${radiusClass} border border-white/20 shadow-xs ${className}`}
    >
      <span className="font-heading uppercase leading-none drop-shadow-xs">
        {initials}
      </span>
    </div>
  );
};
