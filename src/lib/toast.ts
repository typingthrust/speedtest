import { toast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Info, AlertCircle } from "lucide-react";
import React from "react";

type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertCircle,
};

export const showToast = (variant: ToastVariant, options: ToastOptions = {}) => {
  const { title, description } = options;
  const Icon = toastIcons[variant];

  // Use theme-aware classes that adapt to the current theme
  // Using HSL color values that work with CSS variables for better theme compatibility
  const variantClasses = {
    success: "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400 backdrop-blur-sm",
    error: "", // Will use destructive variant
    info: "border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400 backdrop-blur-sm",
    warning: "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 backdrop-blur-sm",
  };

  const toastConfig: any = {
    title: title ? React.createElement(
      'div',
      { className: 'flex items-center gap-2' },
      React.createElement(Icon, { className: 'h-4 w-4 flex-shrink-0' }),
      React.createElement('span', null, title)
    ) : undefined,
    description,
  };

  if (variant === "error") {
    toastConfig.variant = "destructive";
  } else {
    // Apply custom className for theme-aware styling
    toastConfig.className = variantClasses[variant];
  }

  toast(toastConfig);
};

// Convenience functions
export const toastSuccess = (message: string, description?: string) => {
  showToast("success", { title: message, description });
};

export const toastError = (message: string, description?: string) => {
  showToast("error", { title: message, description });
};

export const toastInfo = (message: string, description?: string) => {
  showToast("info", { title: message, description });
};

export const toastWarning = (message: string, description?: string) => {
  showToast("warning", { title: message, description });
};

