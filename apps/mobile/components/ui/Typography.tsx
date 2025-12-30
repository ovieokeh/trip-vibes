import React from "react";
import { Text as RNText, TextProps as RNTextProps, TextStyle } from "react-native";

type TypographyVariant = "h1" | "h2" | "h3" | "h4" | "body" | "bodyLarge" | "bodySm" | "caption" | "label" | "overline";

type TypographyColor = "default" | "muted" | "primary" | "secondary" | "error" | "success";

interface TypographyProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: TypographyColor;
  weight?: "regular" | "medium" | "semibold" | "bold";
  center?: boolean;
}

const variantStyles: Record<TypographyVariant, string> = {
  h1: "text-4xl font-bold leading-tight",
  h2: "text-3xl font-bold leading-tight",
  h3: "text-2xl font-semibold leading-snug",
  h4: "text-xl font-semibold leading-snug",
  body: "text-base leading-relaxed",
  bodyLarge: "text-lg leading-relaxed",
  bodySm: "text-sm leading-relaxed",
  caption: "text-xs leading-normal",
  label: "text-sm font-medium leading-normal",
  overline: "text-[11px] font-bold uppercase tracking-widest",
};

const colorStyles: Record<TypographyColor, string> = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  primary: "text-primary",
  secondary: "text-secondary",
  error: "text-error",
  success: "text-success",
};

const weightStyles: Record<NonNullable<TypographyProps["weight"]>, string> = {
  regular: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

export function Typography({
  variant = "body",
  color = "default",
  weight,
  center = false,
  className = "",
  children,
  ...props
}: TypographyProps & { className?: string }) {
  const classes = [
    variantStyles[variant],
    colorStyles[color],
    weight ? weightStyles[weight] : "",
    center ? "text-center" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <RNText className={classes} {...props}>
      {children}
    </RNText>
  );
}

// Convenience components
export function H1(props: Omit<TypographyProps, "variant"> & { className?: string }) {
  return <Typography variant="h1" {...props} />;
}

export function H2(props: Omit<TypographyProps, "variant"> & { className?: string }) {
  return <Typography variant="h2" {...props} />;
}

export function H3(props: Omit<TypographyProps, "variant"> & { className?: string }) {
  return <Typography variant="h3" {...props} />;
}

export function H4(props: Omit<TypographyProps, "variant"> & { className?: string }) {
  return <Typography variant="h4" {...props} />;
}

export function Body(props: Omit<TypographyProps, "variant"> & { className?: string }) {
  return <Typography variant="body" {...props} />;
}

export function Caption(props: Omit<TypographyProps, "variant"> & { className?: string }) {
  return <Typography variant="caption" {...props} />;
}

export function Label(props: Omit<TypographyProps, "variant"> & { className?: string }) {
  return <Typography variant="label" {...props} />;
}

export function Overline(props: Omit<TypographyProps, "variant"> & { className?: string }) {
  return <Typography variant="overline" {...props} />;
}
