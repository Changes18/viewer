import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter,
  SortAsc,
  SortDesc,
  FileImage,
  FileText,
  User,
  Calendar,
  Star
} from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Submission } from '../types'
import { formatDate, formatScore, getStatusColor, getStatusLabel } from '../lib/utils'

interface SubmissionsViewProps {
  submissions: Submission[]
  onSubmissionSelect: (submissions: Submission[]) => void
}

export default function SubmissionsView({ submissions, onSubmissionSelect }: SubmissionsViewProps) {
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>(submissions)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'name'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    let filtered = [...submissions]

    // Поиск
    if (searchTerm) {
      filtered = filtered.filter(submission =>
        submission.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.fileName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Фильтрация по статусу
    if (statusFilter !== 'all') {
      filtered = filtered.filter(submission => submission.status === statusFilter)
    }

    // Сортировка
    filtered.sort((a, b) => {
      let valueA: any, valueB: any

      switch (sortBy) {
        case 'name':
          valueA = a.studentName
          valueB = b.studentName
          break
        case 'score':
          valueA = a.aiScore
          valueB = b.aiScore
          break
        case 'date':
        default:
          valueA = new Date(a.createdAt)
          valueB = new Date(b.createdAt)
          break
      }

      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1
      } else {
        return valueA < valueB ? 1 : -1
      }
    })

    setFilteredSubmissions(filtered)
  }, [submissions, searchTerm, statusFilter, sortBy, sortOrder])

  const handleCardClick = (submission: Submission, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Множественный выбор
      const newSelected = new Set(selectedIds)
      if (newSelected.has(submission.id)) {
        newSelected.delete(submission.id)
      } else {
        newSelected.add(submission.id)
      }
      setSelectedIds(newSelected)
      
      const selectedSubmissions = submissions.filter(s => newSelected.has(s.id))
      onSubmissionSelect(selectedSubmissions)
    } else {
      // Одиночный выбор
      setSelectedIds(new Set([submission.id]))
      onSubmissionSelect([submission])
    }
  }

  const toggleSort = () => {
    setSortOrder(current => current === 'asc' ? 'desc' : 'asc')
  }

  return (
    <div className="h-full flex flex-col">
      {/* Панель управления */}
      <div className="p-4 border-b bg-card space-y-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени студента или названию файла..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">Все статусы</option>
            <option value="pending">Ожидает</option>
            <option value="excellent">Отлично</option>
            <option value="good">Хорошо</option>
            <option value="needs_work">Требует доработки</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortBy('date')}
              className={sortBy === 'date' ? 'bg-primary/10' : ''}
            >
              <Calendar className="mr-1 h-3 w-3" />
              Дата
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortBy('name')}
              className={sortBy === 'name' ? 'bg-primary/10' : ''}
            >
              <User className="mr-1 h-3 w-3" />
              Имя
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortBy('score')}
              className={sortBy === 'score' ? 'bg-primary/10' : ''}
            >
              <Star className="mr-1 h-3 w-3" />
              Оценка
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSort}
            >
              {sortOrder === 'asc' ? (
                <SortAsc className="h-3 w-3" />
              ) : (
                <SortDesc className="h-3 w-3" />
              )}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            {filteredSubmissions.length} из {submissions.length} работ
            {selectedIds.size > 0 && ` • ${selectedIds.size} выбрано`}
          </div>
        </div>
      </div>

      {/* Список работ */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubmissions.map((submission, index) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              index={index}
              isSelected={selectedIds.has(submission.id)}
              onClick={handleCardClick}
            />
          ))}
        </div>

        {filteredSubmissions.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-sm font-semibold text-muted-foreground">
                Нет работ
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchTerm || statusFilter !== 'all'
                  ? 'Попробуйте изменить критерии поиска'
                  : 'Студенты пока не загрузили свои работы'
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Компонент карточки работы с поддержкой drag & drop
interface SubmissionCardProps {
  submission: Submission
  index: number
  isSelected: boolean
  onClick: (submission: Submission, event: React.MouseEvent) => void
}

function SubmissionCard({ submission, index, isSelected, onClick }: SubmissionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: submission.id,
    data: { submission }
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  const scoreInfo = formatScore(submission.aiScore)

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`
        submission-card cursor-pointer
        ${isSelected ? 'ring-2 ring-primary' : ''}
        ${isDragging ? 'drag-overlay' : ''}
      `}
      onClick={(e) => onClick(submission, e)}
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              {submission.fileType === 'image' ? (
                <FileImage className="h-4 w-4 text-blue-500" />
              ) : (
                <FileText className="h-4 w-4 text-green-500" />
              )}
              <CardTitle className="text-sm truncate">
                {submission.studentName}
              </CardTitle>
            </div>
            <Badge className={getStatusColor(submission.status)}>
              {getStatusLabel(submission.status)}
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground truncate">
            {submission.fileName}
          </p>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Предварительный просмотр */}
          {submission.fileType === 'image' && (
            <div className="mb-3 aspect-video bg-muted rounded-md overflow-hidden">
              <img
                src={`http://localhost:3001${submission.fileUrl}`}
                alt={submission.fileName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTkgMTJoNm0tNiAwdjZoNnYtNmgtNnoiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+'
                }}
              />
            </div>
          )}

          {/* Информация об оценке */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Оценка ИИ:</span>
              <span className={`text-sm font-medium ${scoreInfo.color}`}>
                {submission.aiScore}/100
              </span>
            </div>
            
            {submission.teacherGrade && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Преподаватель:</span>
                <span className="text-sm font-medium">
                  {submission.teacherGrade}/100
                </span>
              </div>
            )}

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                {formatDate(submission.createdAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
