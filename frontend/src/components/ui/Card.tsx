import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...CardProps }: CardProps) {
  return (
    <div className={`border-b border-gray-200 px-6 py-4 dark:border-gray-700 ${className}`} {...CardProps}>
      {children}
    </div>
  );
}

export function CardContent({ className = "", children, ...CardProps }: CardProps) {
  return (
    <div className={`px-6 py-4 ${className}`} {...CardProps}>
      {children}
    </div>
  );
}
