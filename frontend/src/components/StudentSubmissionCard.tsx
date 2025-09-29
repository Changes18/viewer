import { useDroppable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { 
  FileImage, 
  FileText, 
  User, 
  Calendar, 
  Bot,
  Star,
  Award,
  ThumbsUp,
  AlertCircle,
  MessageCircle,
  Users,
  Trash2
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Submission, TeacherGrade } from '@/types'
import { formatDate } from '@/lib/utils'
import { submissionsAPI } from '@/lib/api'
import { useState } from 'react'

interface StudentSubmissionCardProps {
  submission: Submission
  index: number
  onDelete?: (submissionId: string) => void
}

export function StudentSubmissionCard({ submission, index, onDelete }: StudentSubmissionCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  
  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id: `submission-${submission.id}`,
    data: { submission }
  })
  const handleDelete = async () => {
    if (!window.confirm(`Вы уверены, что хотите удалить работу ${submission.studentName}?`)) {
      return
    }

    setIsDeleting(true)
    try {
      await submissionsAPI.delete(submission.id)
      if (onDelete) {
        onDelete(submission.id.toString())
      }
    } catch (error) {
      console.error('Error deleting submission:', error)
      alert('Ошибка при удалении работы')
    } finally {
      setIsDeleting(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50'
    if (score >= 80) return 'text-blue-600 bg-blue-50'  
    if (score >= 70) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getGradeColor = (gradeLevel: string) => {
    switch (gradeLevel) {
      case 'excellent':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'good':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'needs_work':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getGradeNumber = (gradeLevel: string) => {
    switch (gradeLevel) {
      case 'excellent': return '1'
      case 'good': return '2'
      case 'needs_work': return '3'
      default: return '?'
    }
  }

  const getGradeIcon = (gradeLevel: string) => {
    switch (gradeLevel) {
      case 'excellent': return Star
      case 'good': return ThumbsUp
      case 'needs_work': return AlertCircle
      default: return MessageCircle
    }
  }

  // Получаем последнюю оценку для основного отображения
  const latestGrade = submission.teacherGrades?.length > 0 
    ? submission.teacherGrades[submission.teacherGrades.length - 1]
    : null

  const MainGradeIcon = latestGrade ? getGradeIcon(latestGrade.gradeLevel) : MessageCircle

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`relative ${isOver ? 'scale-105 shadow-lg' : ''}`}
    >
      <Card className={`h-full transition-all duration-300 ${
        isOver 
          ? 'border-primary shadow-lg ring-2 ring-primary/20' 
          : 'hover:shadow-md'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">
                  {submission.studentName}
                </CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(submission.createdAt)}
                </CardDescription>
              </div>
            </div>
              {/* Последняя оценка или статус ожидания */}
            <div className="flex items-start space-x-2">
              <div className="flex flex-col items-end space-y-2">
                <Badge 
                  variant="outline" 
                  className={`text-2xl font-bold px-3 py-1 ${
                    latestGrade ? getGradeColor(latestGrade.gradeLevel) : 'bg-gray-50 text-gray-700 border-gray-200'
                  }`}
                >
                  {latestGrade ? getGradeNumber(latestGrade.gradeLevel) : '?'}
                </Badge>
                <MainGradeIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              
              {/* Кнопка удаления */}
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className={`h-4 w-4 ${isDeleting ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>        <CardContent className="space-y-4">
          {/* Превью изображения - делаем его более заметным */}
          {submission.fileType === 'image' && submission.fileUrl && (
            <div className="w-full">
              <div className="relative group">
                <img 
                  src={`http://localhost:3001${submission.fileUrl}`}
                  alt={`Работа ${submission.studentName}`}
                  className="w-full h-64 object-cover rounded-lg border-2 border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-200"
                  onLoad={(e) => {
                    console.log('Image loaded successfully:', submission.fileUrl)
                    e.currentTarget.style.display = 'block'
                  }}                  onError={(e) => {
                    console.error('Error loading image:', `http://localhost:3001${submission.fileUrl}`)
                    const errorDiv = document.createElement('div')
                    errorDiv.className = 'w-full h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center'
                    errorDiv.innerHTML = `
                      <div class="text-center text-gray-500">
                        <svg class="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p class="text-sm">Ошибка загрузки изображения</p>
                        <p class="text-xs text-gray-400">${submission.fileName}</p>
                      </div>
                    `
                    const parentNode = e.currentTarget.parentNode
                    if (parentNode) {
                      parentNode.replaceChild(errorDiv, e.currentTarget)
                    }
                  }}
                />
                {/* Overlay с информацией о файле */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-3 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex items-center space-x-2">
                    <FileImage className="h-4 w-4" />
                    <span className="text-sm font-medium">{submission.fileName}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Информация о файле для non-image типов */}
          {submission.fileType !== 'image' && (
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <FileText className="h-5 w-5 text-green-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {submission.fileName}
                </p>
                <p className="text-xs text-muted-foreground">Документ</p>
              </div>
            </div>
          )}{/* AI анализ */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Bot className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">AI Анализ</span>
              <Badge 
                variant="secondary" 
                className={getScoreColor(submission.aiScore)}
              >
                {submission.aiScore}/100
              </Badge>
            </div>
            
            {submission.aiComment && (
              <p className="text-sm text-muted-foreground bg-purple-50/50 p-3 rounded-lg border-l-2 border-purple-200">
                {submission.aiComment}
              </p>
            )}            {/* Критерии оценки AI */}
            <div className="bg-purple-25/25 p-3 rounded-lg border border-purple-100">
              <h4 className="text-xs font-medium text-purple-700 mb-2">Критерии оценки AI:</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Четкий рисунок / ровные края / отсутствие подтеков:</span>
                  <span className="font-medium">{Math.floor(submission.aiScore * 0.25)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Полнота нанесения (отсутствие пропусков):</span>
                  <span className="font-medium">{Math.floor(submission.aiScore * 0.25)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Отсутствие трещин:</span>
                  <span className="font-medium">{Math.floor(submission.aiScore * 0.2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Отсутствие отслоений:</span>
                  <span className="font-medium">{Math.floor(submission.aiScore * 0.15)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Общее впечатление / эстетика:</span>
                  <span className="font-medium">{Math.floor(submission.aiScore * 0.15)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Множественные оценки преподавателей */}
          {submission.teacherGrades && submission.teacherGrades.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Оценки</span>
                <Badge variant="secondary">{submission.teacherGrades.length}</Badge>
              </div>
              
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {submission.teacherGrades.map((grade, gradeIndex) => {
                  const GradeIcon = getGradeIcon(grade.gradeLevel)
                  return (
                    <div 
                      key={grade.id || gradeIndex}
                      className={`p-2 rounded-lg border-l-2 ${getGradeColor(grade.gradeLevel)}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <GradeIcon className="h-3 w-3" />
                          <span className="text-xs font-medium">{grade.teacherName}</span>
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {getGradeNumber(grade.gradeLevel)}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(grade.assessedAt)}
                        </span>
                      </div>
                      {grade.comment && (
                        <p className="text-xs text-muted-foreground">
                          {grade.comment}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}          {/* Статус */}
          <div className="pt-2 border-t">
            <Badge 
              variant="outline" 
              className={`w-full justify-center py-2 ${
                latestGrade ? getGradeColor(latestGrade.gradeLevel) : 'bg-gray-50 text-gray-700 border-gray-200'
              }`}
            >
              <MainGradeIcon className="h-4 w-4 mr-2" />
              {latestGrade 
                ? `Последняя оценка: ${getGradeNumber(latestGrade.gradeLevel)} (${latestGrade.teacherName})`
                : 'Ожидает оценки'
              }
            </Badge>
          </div>
        </CardContent>

        {/* Индикатор для drag-and-drop */}
        {isOver && (
          <div className="absolute inset-0 bg-primary/5 border-2 border-dashed border-primary rounded-lg flex items-center justify-center">
            <div className="bg-primary/10 px-4 py-2 rounded-lg">
              <p className="text-sm font-medium text-primary">
                Отпустите для выставления оценки
              </p>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  )
}
