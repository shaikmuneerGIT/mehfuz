import { useState } from "react";

interface LogoProps {
  className?: string;
  imgClassName?: string;
  compact?: boolean;
  variant?: "header" | "footer" | "hero" | "admin" | "default";
}

export function Logo({
  className = "",
  imgClassName = "",
  compact = false,
  variant = "default",
}: LogoProps) {
  const [imgError, setImgError] = useState(false);

  // Default sizing based on variant & compact mode
  let defaultImgSize = "h-10 sm:h-12 w-auto";
  if (compact) {
    defaultImgSize = "h-8 w-auto";
  } else if (variant === "hero") {
    defaultImgSize = "h-24 sm:h-32 md:h-36 w-auto";
  } else if (variant === "footer") {
    defaultImgSize = "h-14 sm:h-16 w-auto";
  } else if (variant === "admin") {
    defaultImgSize = "h-10 w-auto";
  }

  if (!imgError) {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <img
          src="/images/logo.jpg"
          alt="MEHFUZ Premium Dry Fruits & Commodities"
          onError={() => setImgError(true)}
          className={`object-contain transition-transform duration-300 hover:scale-[1.02] ${variant === "header" ? "h-16 sm:h-22 w-auto py-1" : defaultImgSize
            } ${imgClassName}`}
        />
      </div>
    );
  }

  // Fallback text wordmark when image fails to load
  return (
    <span className={`flex flex-col items-center leading-none ${className}`}>
      <span
        className={`font-serif gold-gradient-text font-bold tracking-[0.14em] ${compact ? "text-xl" : "text-2xl sm:text-[28px]"
          }`}
      >
        MEHFUZ
      </span>
      <span className="mt-1 flex w-full items-center gap-1.5">
        <span className="h-px flex-1 bg-gold-500/50" />
        <span className="h-1 w-1 rotate-45 bg-gold-500/80" />
        <span className="h-px flex-1 bg-gold-500/50" />
      </span>
      <span
        className={`font-serif mt-1 whitespace-nowrap uppercase tracking-[0.2em] text-brown-700 ${compact ? "text-[7px]" : "text-[8px] sm:text-[9px]"
          }`}
      >
        Premium Dry Fruits &amp; Commodities
      </span>
    </span>
  );
}
