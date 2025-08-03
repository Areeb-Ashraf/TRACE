import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { LessonCreatorService } from "@/lib/ai/lesson-creator"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can chat about lessons" }, { status: 403 })
    }

    const { id: lessonId } = await params
    const { question, messages = [] } = await req.json()

    if (!question || !question.trim()) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    // Get the lesson content
    const lesson = await prisma.lesson.findUnique({
      where: { 
        id: lessonId,
        status: "PUBLISHED" // Students can only chat about published lessons
      },
      include: {
        sections: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found or not available" }, { status: 404 })
    }

    // Create lesson content for AI context
    const lessonContent = `
    Title: ${lesson.title}
    Description: ${lesson.description}
    Subject: ${lesson.subject || 'Not specified'}
    Topic: ${lesson.topic || 'Not specified'}
    
    Main Content:
    ${lesson.content}
    
    Sections:
    ${lesson.sections.map(section => `
    ${section.title}:
    ${section.content}
    `).join('\n')}
    
    Learning Objectives:
    ${lesson.learningObjectives.join('\n- ')}
    
    Resources:
    ${lesson.resources.join('\n- ')}
    `

    const lessonService = new LessonCreatorService()
    
    try {
      const aiResponse = await lessonService.chatWithAI({
        lessonContent,
        learningObjectives: lesson.learningObjectives,
        question: question.trim()
      })

      // Create the new message objects
      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: question.trim(),
        timestamp: new Date().toISOString()
      }

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      }

      const updatedMessages = [...messages, userMessage, aiMessage]

      // Save or update chat history
      await prisma.lessonChatHistory.upsert({
        where: {
          lessonId_studentId: {
            lessonId: lessonId,
            studentId: session.user.id
          }
        },
        update: {
          messages: updatedMessages
        },
        create: {
          lessonId: lessonId,
          studentId: session.user.id,
          messages: updatedMessages
        }
      })

      // Update lesson progress to track engagement
      await prisma.lessonProgress.upsert({
        where: {
          lessonId_studentId: {
            lessonId: lessonId,
            studentId: session.user.id
          }
        },
        update: {
          lastAccessAt: new Date(),
          progressData: {
            chatEngagement: true,
            lastChatAt: new Date().toISOString()
          }
        },
        create: {
          lessonId: lessonId,
          studentId: session.user.id,
          status: 'IN_PROGRESS',
          lastAccessAt: new Date(),
          progressData: {
            chatEngagement: true,
            lastChatAt: new Date().toISOString()
          }
        }
      })

      return NextResponse.json({
        success: true,
        response: aiResponse,
        messages: updatedMessages
      })

    } catch (error: any) {
      console.error('AI chat error:', error)
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to get AI response'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Lesson chat API error:', error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Get chat history for a lesson
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can access chat history" }, { status: 403 })
    }

    const { id: lessonId } = await params

    // Verify lesson exists and is accessible
    const lesson = await prisma.lesson.findUnique({
      where: { 
        id: lessonId,
        status: "PUBLISHED"
      },
      select: { id: true, title: true }
    })

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found or not available" }, { status: 404 })
    }

    // Get chat history
    const chatHistory = await prisma.lessonChatHistory.findUnique({
      where: {
        lessonId_studentId: {
          lessonId: lessonId,
          studentId: session.user.id
        }
      },
      select: {
        messages: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      messages: chatHistory?.messages || [],
      lastUpdated: chatHistory?.updatedAt
    })

  } catch (error) {
    console.error('Get chat history error:', error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
} 