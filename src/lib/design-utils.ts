import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Color variants for consistent styling
export const colorVariants = {
  primary: "bg-blue-50 border-blue-200 text-blue-800",
  success: "bg-green-50 border-green-200 text-green-800", 
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  error: "bg-red-50 border-red-200 text-red-800",
  neutral: "bg-gray-50 border-gray-200 text-gray-800"
}

// Stat card variants
export const statVariants = {
  blue: "text-blue-600",
  green: "text-green-600", 
  orange: "text-orange-600",
  purple: "text-purple-600",
  red: "text-red-600"
}
