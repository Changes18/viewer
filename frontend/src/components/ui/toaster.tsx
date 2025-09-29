import { toast as hotToast, Toaster as HotToaster } from 'react-hot-toast'

export function toast({ title, description, variant = 'default' }: {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}) {
  const message = title && description ? `${title}: ${description}` : title || description || ''
  
  if (variant === 'destructive') {
    hotToast.error(message)
  } else {
    hotToast.success(message)
  }
}

export function Toaster() {
  return <HotToaster position="top-right" />
}
