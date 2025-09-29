import { useState } from 'react'
import { motion } from 'framer-motion'
import { useDroppable } from '@dnd-kit/core'
import { 
  Star,
  MessageSquare, 
  Save,
  Award,
  ThumbsUp,
  AlertCircle,
  FileText,
  User,
  Calendar,
  Bot
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Submission } from '../types'
import { formatDate, getStatusColor, getStatusLabel } from '../lib/utils'
import { submissionsAPI } from '../lib/api'
import { useToast } from '../hooks/use-toast'

interface AssessmentPanelProps {
  selectedSubmissions: Submission[]
  onAssessmentUpdate: () => void
}

interface DropZone {
  id: string
  label: string
  description: string
  status: 'excellent' | 'good' | 'needs_work'
  icon: React.ComponentType<any>
  color: string
}

const dropZones: DropZone[] = [
  {
    id: 'excellent',
    label: 'Отлично',
    description: 'Превосходная работа',
    status: 'excellent',
    icon: Award,
    color: 'text-green-600'
  },
  {
    id: 'good', 
    label: 'Хорошо',
    description: 'Качественное выполнение',
    status: 'good',
    icon: ThumbsUp,
    color: 'text-blue-600'
  },
  {
    id: 'needs_work',
    label: 'Требует доработки',
    description: 'Нужно улучшить',
    status: 'needs_work',
    icon: AlertCircle,
    color: 'text-yellow-600'
  }
]

export default function AssessmentPanel({ selectedSubmissions, onAssessmentUpdate }: AssessmentPanelProps) {
  const [assessments, setAssessments] = useState<{[key: string]: {grade: string, comment: string}}>({})
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleGradeChange = (submissionId: string, grade: string) => {
    setAssessments(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        grade
      }
    }))
  }

  const handleCommentChange = (submissionId: string, comment: string) => {
    setAssessments(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        comment
      }
    }))
  }

  const handleSaveAssessment = async (submission: Submission, status?: string) => {
    setIsLoading(true)
    try {
      const assessment = assessments[submission.id] || {}
      const grade = assessment.grade ? parseInt(assessment.grade) : undefined

      await submissionsAPI.assess(submission.id, {
        teacherGrade: grade,
        teacherComment: assessment.comment,
        status: status || submission.status
      })

      toast({
        title: 'Оценка сохранена',
        description: `Работа ${submission.studentName} оценена`
      })

      onAssessmentUpdate()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка сохранения',
        description: 'Не удалось сохранить оценку'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (selectedSubmissions.length === 0) {
    return (
      <div className="h-full p-4">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="mr-2 h-5 w-5" />
              Панель оценивания
            </CardTitle>
            <CardDescription>
              Выберите работы для оценки или перетащите их в зоны оценки
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Drop zones */}
            {dropZones.map((zone, index) => (
              <DropZone
                key={zone.id}
                zone={zone}
                index={index}
                onDrop={(submission) => handleSaveAssessment(submission, zone.status)}
              />
            ))}
            
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center">
                💡 Совет: Используйте Ctrl+Click для выбора нескольких работ
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full p-4 overflow-auto">
      <div className="space-y-4">
        {/* Drop zones когда есть выбранные работы */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Быстрая оценка</CardTitle>
            <CardDescription>
              Перетащите работы в зоны для быстрого оценивания
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dropZones.map((zone, index) => (
              <DropZone
                key={zone.id}
                zone={zone}
                index={index}
                compact
                onDrop={(submission) => handleSaveAssessment(submission, zone.status)}
              />
            ))}
          </CardContent>
        </Card>

        {/* Детальная оценка выбранных работ */}
        {selectedSubmissions.map((submission, index) => (
          <motion.div
            key={submission.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center text-base">
                      <User className="mr-2 h-4 w-4" />
                      {submission.studentName}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {submission.fileName}
                    </p>
                  </div>
                  <Badge className={getStatusColor(submission.status)}>
                    {getStatusLabel(submission.status)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Информация о работе */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Загружено:</span>
                    <p className="flex items-center mt-1">
                      <Calendar className="mr-1 h-3 w-3" />
                      {formatDate(submission.createdAt)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Оценка ИИ:</span>
                    <p className="flex items-center mt-1">
                      <Bot className="mr-1 h-3 w-3" />
                      {submission.aiScore}/100
                    </p>
                  </div>
                </div>

                {/* Отзыв ИИ */}
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Анализ ИИ:</p>
                  <p className="text-sm">{submission.aiComment}</p>
                </div>

                {/* Оценка преподавателя */}
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Ваша оценка (0-100):</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={assessments[submission.id]?.grade || submission.teacherGrade || ''}
                      onChange={(e) => handleGradeChange(submission.id, e.target.value)}
                      className="mt-1"
                      placeholder="Введите оценку"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Комментарий:</label>
                    <textarea
                      value={assessments[submission.id]?.comment || submission.teacherComment || ''}
                      onChange={(e) => handleCommentChange(submission.id, e.target.value)}
                      className="mt-1 w-full min-h-[80px] px-3 py-2 border border-input rounded-md text-sm resize-none"
                      placeholder="Ваш отзыв о работе..."
                    />
                  </div>

                  <Button
                    onClick={() => handleSaveAssessment(submission)}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                        Сохраняю...
                      </div>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Сохранить оценку
                      </>
                    )}
                  </Button>
                </div>

                {/* История оценок */}
                {(submission.assessedAt && submission.assessedBy) && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Последняя оценка: {formatDate(submission.assessedAt)} 
                      {submission.assessedBy && ` • ${submission.assessedBy}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Компонент зоны перетаскивания
interface DropZoneProps {
  zone: DropZone
  index: number
  compact?: boolean
  onDrop: (submission: Submission) => void
}

function DropZone({ zone, index, compact = false, onDrop }: DropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: zone.id,
    data: { 
      accepts: ['submission'],
      onDrop: (data: any) => {
        if (data.submission) {
          onDrop(data.submission)
        }
      }
    }
  })

  const Icon = zone.icon

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`
        drop-zone ${isOver ? 'active' : ''} 
        ${compact ? 'p-3' : 'p-4'}
      `}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-full bg-background ${zone.color}`}>
          <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} />
        </div>
        <div>
          <p className={`font-medium ${compact ? 'text-sm' : ''}`}>
            {zone.label}
          </p>
          {!compact && (
            <p className="text-xs text-muted-foreground">
              {zone.description}
            </p>
          )}
        </div>
      </div>
      
      {isOver && (
        <div className="mt-2 text-xs text-primary font-medium">
          Отпустите для оценки как "{zone.label}"
        </div>
      )}
    </motion.div>
  )
}
