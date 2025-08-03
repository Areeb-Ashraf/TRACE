import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { LessonCreatorService } from "@/lib/ai/lesson-creator"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PROFESSOR") {
      return NextResponse.json({ error: "Only professors can create lessons" }, { status: 403 })
    }

    const body = await req.json()
    const { action, data } = body

    const lessonService = new LessonCreatorService()

    if (action === 'create_lesson') {
      try {
        const lesson = await lessonService.createLesson(data)
        
        return NextResponse.json({
          success: true,
          lesson
        })
      } catch (error: any) {
        console.error('Lesson creation error:', error)
        return NextResponse.json({
          success: false,
          error: error.message || 'Failed to create lesson'
        }, { status: 400 })
      }
    }

    if (action === 'create_lesson_from_document') {
      try {
        if (!data.documentContent) {
          return NextResponse.json({
            success: false,
            error: 'Document content is required'
          }, { status: 400 })
        }

        const lesson = await lessonService.createLesson({
          ...data,
          documentContent: data.documentContent
        })
        
        return NextResponse.json({
          success: true,
          lesson
        })
      } catch (error: any) {
        console.error('Document lesson creation error:', error)
        return NextResponse.json({
          success: false,
          error: error.message || 'Failed to create lesson from document'
        }, { status: 400 })
      }
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action' 
    }, { status: 400 })

  } catch (error) {
    console.error('Lesson creator API error:', error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Handle file uploads for document-based lesson creation
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PROFESSOR") {
      return NextResponse.json({ error: "Only professors can upload documents" }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('document') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload PDF, DOC, DOCX, or TXT files.' 
      }, { status: 400 })
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'File too large. Please upload files smaller than 10MB.' 
      }, { status: 400 })
    }

    const lessonService = new LessonCreatorService()
    
    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      let extractedText = ''

      if (file.type === 'application/pdf') {
        extractedText = await lessonService.extractTextFromPDF(buffer)
      } else if (file.type === 'text/plain') {
        extractedText = buffer.toString('utf-8')
      } else {
        // For DOC/DOCX files, you might want to use a library like mammoth
        // For now, return error for unsupported formats
        return NextResponse.json({ 
          error: 'Document format not yet supported. Please use PDF or TXT files.' 
        }, { status: 400 })
      }

      if (!extractedText.trim()) {
        return NextResponse.json({ 
          error: 'No text could be extracted from the document.' 
        }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        documentContent: extractedText,
        fileName: file.name,
        fileSize: file.size
      })

    } catch (error: any) {
      console.error('Document extraction error:', error)
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to extract text from document'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Document upload API error:', error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
} 