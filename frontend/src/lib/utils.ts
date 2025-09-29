import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

export function formatScore(score: number) {
  if (score >= 90) return { color: 'text-green-600', label: 'Отлично' }
  if (score >= 80) return { color: 'text-blue-600', label: 'Хорошо' }
  if (score >= 70) return { color: 'text-yellow-600', label: 'Удовлетворительно' }
  return { color: 'text-red-600', label: 'Требует доработки' }
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'excellent': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'good': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'needs_work': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case 'excellent': return 'Отлично'
    case 'good': return 'Хорошо'
    case 'needs_work': return 'Требует доработки'
    case 'pending': return 'Ожидает оценки'
    default: return 'Неизвестно'
  }
}
