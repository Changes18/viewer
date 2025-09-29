import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  LogOut, 
  Moon, 
  Sun,
  Menu,
  X,
  FileText,
  TrendingUp,
  Clock,
  Award,
  Star,
  ThumbsUp,
  AlertCircle,
  GraduationCap,
  Calendar,
  Bot,
  Search,
  SortAsc,
  SortDesc,
  User,
  Users
} from 'lucide-react'
import useSWR from 'swr'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/components/ThemeProvider'
import { Submission, Stats } from '@/types'
import { submissionsAPI } from '@/lib/api'
import { StudentSubmissionCard } from '@/components/StudentSubmissionCard'
import { DraggableGrade } from '@/components/DraggableGrade'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'grade'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Тестовые пользователи для демонстрации
  const testUsers = [
    { username: 'teacher', displayName: 'Преподаватель', role: 'teacher' },
    { username: 'student1', displayName: 'Студент 1', role: 'student' },
    { username: 'student2', displayName: 'Студент 2', role: 'student' },
    { username: 'student3', displayName: 'Студент 3', role: 'student' }
  ]

  const switchUser = async (username: string) => {
    try {
      // Временная авторизация для тестирования
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: 'admin123'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        window.location.reload() // Перезагружаем страницу для обновления контекста
      }
    } catch (error) {
      console.error('Error switching user:', error)
    }
  }

  // Получение данных
  const { data: stats, mutate: mutateStats } = useSWR<Stats>('/api/stats')
  const { data: submissions, mutate: mutateSubmissions } = useSWR<Submission[]>('/api/submissions')

  const handleLogout = () => {
    logout()
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    // Устанавливаем информацию о перетаскиваемой оценке
    const gradeData = event.active.data.current
    if (gradeData?.gradeNumber) {
      // Можем добавить дополнительную логику если нужно
    }
  }
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveId(null)

    if (over && active.data.current?.grade && over.data.current?.submission) {
      const gradeData = active.data.current
      const submission = over.data.current.submission as Submission

      try {
        // Определяем числовую оценку на основе системы 1-3
        let teacherGrade: number
        switch (gradeData.grade) {
          case 'excellent': // Оценка 1
            teacherGrade = Math.floor(Math.random() * 11) + 90 // 90-100
            break
          case 'good': // Оценка 2
            teacherGrade = Math.floor(Math.random() * 11) + 80 // 80-90
            break
          case 'needs_work': // Оценка 3
            teacherGrade = Math.floor(Math.random() * 11) + 70 // 70-80
            break
          default:
            teacherGrade = 75
        }

        // Создаем новую оценку от текущего преподавателя
        const newTeacherGrade = {
          id: `${submission.id}-${Date.now()}`,
          teacherName: user?.username || 'Преподаватель',
          grade: teacherGrade,
          gradeLevel: gradeData.grade,
          comment: `Оценка ${gradeData.gradeNumber}/3 - ${
            gradeData.grade === 'excellent' ? 'Отличная работа!' : 
            gradeData.grade === 'good' ? 'Хорошее выполнение' : 
            'Требует доработки'
          }`,
          assessedAt: new Date().toISOString()
        }

        // Отправляем оценку на сервер
        await submissionsAPI.assess(submission.id, {
          status: gradeData.grade,
          teacherGrade,
          teacherComment: newTeacherGrade.comment,
          newGrade: newTeacherGrade // Добавляем информацию о новой оценке
        })

        mutateSubmissions()
        mutateStats()

        const gradeLabels = {
          excellent: '1 (Отлично)',
          good: '2 (Хорошо)', 
          needs_work: '3 (Доработать)'
        }
        
        toast.success(
          `Работе "${submission.studentName}" выставлена оценка ${gradeLabels[gradeData.grade as keyof typeof gradeLabels]} от ${user?.username}`,
          { duration: 4000 }
        )
      } catch (error) {
        console.error('Error grading submission:', error)
        toast.error('Ошибка при выставлении оценки')      }
    }
  }

  // Обработчик удаления работы
  const handleDelete = async (submissionId: string) => {
    try {
      // Обновляем данные после удаления
      await mutateSubmissions()
      await mutateStats()
      
      toast.success('Работа успешно удалена', { duration: 3000 })
    } catch (error) {
      console.error('Error handling deletion:', error)
      toast.error('Ошибка при обновлении данных после удаления')
    }
  }

  // Фильтрация и сортировка
  const filteredAndSortedSubmissions = submissions
    ?.filter(submission => {
      const matchesSearch = submission.studentName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filterStatus === 'all' || submission.status === filterStatus
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.studentName.localeCompare(b.studentName)
          break
        case 'grade':
          comparison = (a.teacherGrade || 0) - (b.teacherGrade || 0)
          break
        case 'date':
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  if (!user) return null

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-background flex">
        {/* Мобильное меню overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ x: sidebarOpen ? 0 : '-100%' }}
          className="fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold gradient-text">
                Анализ работ
              </h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <div className="flex items-center p-3 rounded-lg bg-primary/10 text-primary">
              <LayoutDashboard className="mr-3 h-4 w-4" />
              Панель управления
            </div>
          </nav>          {/* User info and controls */}
          <div className="p-4 border-t space-y-4">
            {/* Переключатель пользователей для тестирования */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Переключить пользователя</span>
              </div>
              <Select 
                value={user?.username || 'teacher'} 
                onValueChange={switchUser}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите пользователя" />
                </SelectTrigger>
                <SelectContent>
                  {testUsers.map((testUser) => (
                    <SelectItem key={testUser.username} value={testUser.username}>
                      <div className="flex items-center space-x-2">
                        <User className="h-3 w-3" />
                        <span>{testUser.displayName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Current user info */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.username}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.role === 'teacher' ? 'Преподаватель' : 'Студент'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleLogout}
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Выход
              </Button>
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="bg-card border-b p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden"
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">
                    Панель управления
                  </h1>                  <p className="text-muted-foreground">
                    Добро пожаловать, {user?.username}! Система анализа студенческих работ
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-sm">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date().toLocaleDateString('ru-RU')}
                </Badge>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <main className="flex-1 p-6 space-y-6 overflow-auto">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Всего работ
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalSubmissions || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      За всё время
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Проверенные
                    </CardTitle>
                    <ThumbsUp className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats?.gradedSubmissions || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Оценки выставлены
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Ждут проверки
                    </CardTitle>
                    <Clock className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{stats?.pendingSubmissions || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Требуют внимания
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Средний балл
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{stats?.averageGrade?.toFixed(1) || '0.0'}</div>
                    <p className="text-xs text-muted-foreground">
                      Из 100 баллов
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Поиск и фильтры
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Поиск по имени студента..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Статус" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все статусы</SelectItem>
                        <SelectItem value="pending">Ожидает</SelectItem>
                        <SelectItem value="excellent">Отлично</SelectItem>
                        <SelectItem value="good">Хорошо</SelectItem>
                        <SelectItem value="needs_work">Доработать</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={sortBy} onValueChange={(value: 'date' | 'name' | 'grade') => setSortBy(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Сортировка" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">По дате</SelectItem>
                        <SelectItem value="name">По имени</SelectItem>
                        <SelectItem value="grade">По оценке</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Grading Interface */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Student Submissions */}
              <div className="xl:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <GraduationCap className="h-5 w-5 mr-2" />
                      Студенческие работы
                      <Badge variant="secondary" className="ml-2">
                        {filteredAndSortedSubmissions?.length || 0}
                      </Badge>
                    </CardTitle>                    <CardDescription>
                      Перетащите оценки справа на карточки студенческих работ для выставления баллов
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {filteredAndSortedSubmissions && filteredAndSortedSubmissions.length > 0 ? (                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">                        {filteredAndSortedSubmissions.map((submission, index) => (
                          <StudentSubmissionCard 
                            key={submission.id} 
                            submission={submission} 
                            index={index}
                            onDelete={handleDelete}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Нет работ для показа</h3>
                        <p className="text-muted-foreground mb-4">
                          {searchTerm || filterStatus !== 'all' 
                            ? 'Попробуйте изменить критерии поиска' 
                            : 'Студенты еще не отправили работы через Telegram бот'}
                        </p>
                        {(!searchTerm && filterStatus === 'all') && (
                          <Badge variant="outline" className="mt-2">
                            <Calendar className="h-3 w-3 mr-1" />
                            Бот готов к приему работ
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Grading Drop Zones */}
              <div className="xl:col-span-1">
                <Card className="sticky top-6">
                  <CardHeader>                    <CardTitle className="flex items-center">
                      <Award className="h-5 w-5 mr-2" />
                      Оценки
                    </CardTitle>
                    <CardDescription>
                      Перетащите оценки на работы студентов
                    </CardDescription>
                  </CardHeader>                  <CardContent className="space-y-4">
                    <DraggableGrade
                      grade="1"
                      title="Отлично"
                      subtitle="Превосходная работа"
                      color="green"
                      icon={<Star className="h-5 w-5" />}
                    />
                    <DraggableGrade
                      grade="2"
                      title="Хорошо"
                      subtitle="Качественное выполнение"
                      color="blue"
                      icon={<ThumbsUp className="h-5 w-5" />}
                    />
                    <DraggableGrade
                      grade="3"
                      title="Доработать"
                      subtitle="Требует улучшения"
                      color="yellow"
                      icon={<AlertCircle className="h-5 w-5" />}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>        {/* Drag Overlay */}
        <DragOverlay>
          {activeId && activeId.startsWith('grade-') ? (
            <div className="transform rotate-5 scale-110 opacity-90">
              <div className="p-3 bg-white border-2 border-primary rounded-lg shadow-lg">
                <div className="text-lg font-bold text-primary">
                  Оценка {activeId.replace('grade-', '')}
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  )
}
