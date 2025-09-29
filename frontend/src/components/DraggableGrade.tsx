import { useDraggable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { Star, ThumbsUp, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface DraggableGradeProps {
  grade: '1' | '2' | '3'
  title: string
  subtitle: string
  color: string
  icon: React.ReactNode
}

export function DraggableGrade({ grade, title, subtitle, color, icon }: DraggableGradeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `grade-${grade}`,
    data: { 
      grade: grade === '1' ? 'excellent' : grade === '2' ? 'good' : 'needs_work',
      gradeNumber: grade
    }
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000
  } : undefined

  const colorClasses = {
    'green': 'bg-green-50 border-green-200 hover:bg-green-100 text-green-700',
    'blue': 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700',
    'yellow': 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 text-yellow-700'
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`cursor-grab ${isDragging ? 'opacity-50' : ''}`}
    >
      <Card className={`border-2 border-dashed transition-all duration-200 ${colorClasses[color as keyof typeof colorClasses]} ${
        isDragging ? 'scale-105 shadow-lg' : 'hover:scale-105'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="text-3xl font-bold">
              {grade}
            </div>
            <div className="flex-1">
              <div className="font-medium">{title}</div>
              <div className="text-sm opacity-75">{subtitle}</div>
            </div>
            <div className="text-xl">
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
