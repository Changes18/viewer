import { toast as hotToast } from 'react-hot-toast'

export function useToast() {
  const toast = ({ title, description, variant = 'default' }: {
    title?: string
    description?: string
    variant?: 'default' | 'destructive'
  }) => {
    const message = title && description ? `${title}: ${description}` : title || description || ''
    
    if (variant === 'destructive') {
      hotToast.error(message)
    } else {
      hotToast.success(message)
    }
  }

  return { toast }
}
