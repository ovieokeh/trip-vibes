import React from "react";
import { TouchableOpacity, TouchableOpacityProps } from "react-native";

type IconButtonVariant = "default" | "primary" | "ghost" | "outline";
type IconButtonSize = "sm" | "md" | "lg";

interface IconButtonProps extends TouchableOpacityProps {
  icon: React.ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  rounded?: boolean;
  className?: string;
}

export function IconButton({
  icon,
  variant = "default",
  size = "md",
  rounded = true,
  disabled,
  className = "",
  style,
  ...props
}: IconButtonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return "bg-primary";
      case "ghost":
        return "bg-transparent";
      case "outline":
        return "bg-transparent border border-border";
      default:
        return "bg-muted";
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "w-8 h-8";
      case "lg":
        return "w-12 h-12";
      default:
        return "w-10 h-10";
    }
  };

  const baseClasses = `items-center justify-center ${getVariantClasses()} ${getSizeClasses()} ${
    rounded ? "rounded-full" : "rounded-md"
  } ${disabled ? "opacity-50" : ""} ${className}`;

  return (
    <TouchableOpacity className={baseClasses} style={style} disabled={disabled} activeOpacity={0.7} {...props}>
      {icon}
    </TouchableOpacity>
  );
}
