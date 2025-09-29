export interface TeacherGrade {
  id: string
  teacherName: string
  grade: number
  gradeLevel: 'excellent' | 'good' | 'needs_work'
  comment: string
  assessedAt: string
}

export interface Submission {
  id: string
  studentId: string
  studentName: string
  fileName: string
  fileUrl: string
  fileType: 'image' | 'document'
  extractedText: string
  aiScore: number
  aiComment: string
  teacherGrades: TeacherGrade[]
  teacherGrade?: number
  teacherComment?: string
  status: 'pending' | 'excellent' | 'good' | 'needs_work'
  createdAt: string
  assessedAt?: string
  assessedBy?: string
  telegramFileId: string
}

export interface User {
  id: number
  username: string
  role: string
}

export interface Stats {
  totalSubmissions: number
  pendingReview: number
  gradedSubmissions: number
  pendingSubmissions: number
  averageAiScore: number
  averageGrade: number
  recentSubmissions: Submission[]
}

export interface AuthContext {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}
