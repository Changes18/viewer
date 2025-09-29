import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { Award, ThumbsUp, AlertCircle, User, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Submission } from '@/types'
import { submissionsAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface GradingDropZoneProps {
  onGradeAssigned: () => void
}

type GradeLevel = {
  id: string
  number: string
  label: string
  description: string
  color: string
  bgColor: string
  hoverColor: string
  icon: React.ComponentType<any>
  status: 'excellent' | 'good' | 'needs_work'
}

const gradeLevels: GradeLevel[] = [
  {
    id: 'grade-1',
    number: '1',
    label: 'Отлично',
    description: 'Превосходная работа',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    hoverColor: 'hover:bg-green-100 hover:border-green-300',
    icon: Award,
    status: 'excellent'
  },
  {
    id: 'grade-2', 
    number: '2',
    label: 'Хорошо',
    description: 'Качественное выполнение',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    hoverColor: 'hover:bg-blue-100 hover:border-blue-300',
    icon: ThumbsUp,
    status: 'good'
  },
  {
    id: 'grade-3',
    number: '3', 
    label: 'Доработать',
    description: 'Требует улучшений',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
    hoverColor: 'hover:bg-yellow-100 hover:border-yellow-300',
    icon: AlertCircle,
    status: 'needs_work'
  }
]

interface DropZoneProps {
  grade: GradeLevel
  onDrop: (submission: Submission) => void
}

function GradeDropZone({ grade, onDrop }: DropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: grade.id,
    data: { 
      accepts: ['submission'],
      grade: grade.status
    }
  })

  const Icon = grade.icon

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`
        relative border-2 border-dashed rounded-xl p-6 transition-all duration-200
        ${grade.bgColor} ${grade.hoverColor}
        ${isOver ? 'scale-105 shadow-lg border-solid' : ''}
      `}
    >
      {/* Номер оценки */}
      <div className="flex items-center justify-center mb-4">
        <div className={`
          w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold
          ${isOver ? 'bg-white shadow-md' : 'bg-white/50'}
          ${grade.color}
        `}>
          {grade.number}
        </div>
      </div>

      {/* Информация об оценке */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <Icon className={`h-5 w-5 ${grade.color}`} />
          <h3 className={`font-semibold ${grade.color}`}>
            {grade.label}
          </h3>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {grade.description}
        </p>
      </div>

      {/* Состояние при наведении */}
      {isOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 rounded-xl bg-white/20 border-2 border-solid border-current flex items-center justify-center"
        >
          <div className="text-center">
            <CheckCircle className={`h-8 w-8 mx-auto mb-2 ${grade.color}`} />
            <p className={`font-medium ${grade.color}`}>
              Поставить оценку "{grade.label}"
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export function GradingDropZone({ onGradeAssigned }: GradingDropZoneProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [recentlyGraded, setRecentlyGraded] = useState<string[]>([])

  const handleDrop = async (submission: Submission, gradeStatus: string) => {
    setIsLoading(true)
    
    try {
      // Определяем числовую оценку на основе статуса
      let teacherGrade: number
      switch (gradeStatus) {
        case 'excellent':
          teacherGrade = Math.floor(Math.random() * 11) + 90 // 90-100
          break
        case 'good':
          teacherGrade = Math.floor(Math.random() * 11) + 80 // 80-90
          break
        case 'needs_work':
          teacherGrade = Math.floor(Math.random() * 11) + 70 // 70-80
          break
        default:
          teacherGrade = 75
      }

      await submissionsAPI.assess(submission.id, {
        status: gradeStatus as any,
        teacherGrade,
        teacherComment: `Оценка преподавателя: ${gradeStatus === 'excellent' ? 'Отличная работа!' : gradeStatus === 'good' ? 'Хорошее выполнение' : 'Требует доработки'}`
      })

      // Показываем успешное уведомление
      const gradeInfo = gradeLevels.find(g => g.status === gradeStatus)
      toast.success(
        `Работа "${submission.studentName}" оценена как "${gradeInfo?.label}" (${teacherGrade}/100)`,
        { duration: 4000 }
      )

      // Добавляем в список недавно оцененных
      setRecentlyGraded(prev => [...prev, submission.id])
      setTimeout(() => {
        setRecentlyGraded(prev => prev.filter(id => id !== submission.id))
      }, 3000)

      onGradeAssigned()
      
    } catch (error) {
      console.error('Error grading submission:', error)
      toast.error('Ошибка при выставлении оценки')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
          Панель оценивания
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Перетащите работу студента в одну из зон для выставления оценки
        </p>
      </div>

      {/* Зоны для оценок */}
      <div className="space-y-4">
        {gradeLevels.map((grade) => (
          <GradeDropZone
            key={grade.id}
            grade={grade}
            onDrop={(submission) => handleDrop(submission, grade.status)}
          />
        ))}
      </div>

      {/* Подсказки */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg">
        <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
          💡 Как пользоваться:
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Возьмите карточку работы студента</li>
          <li>• Перетащите её в нужную зону оценки (1, 2 или 3)</li>
          <li>• Оценка автоматически сохранится</li>
        </ul>
      </div>

      {/* Индикатор загрузки */}
      {isLoading && (
        <div className="flex items-center justify-center p-4">
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Сохранение оценки...</span>
          </div>
        </div>
      )}
    </div>
  )
}
