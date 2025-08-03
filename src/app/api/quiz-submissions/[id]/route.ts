import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const submission = await prisma.quizSubmission.findUnique({
      where: { id: params.id },
      include: {
        quiz: {
          include: {
            professor: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            questions: {
              include: {
                options: {
                  orderBy: { order: 'asc' }
                }
              },
              orderBy: { order: 'asc' }
            }
          }
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        answers: {
          include: {
            question: {
              include: {
                options: true
              }
            },
            option: true
          }
        },
        screenTrackings: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Check permissions
    if (session.user.role === "STUDENT" && submission.studentId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    if (session.user.role === "PROFESSOR" && submission.quiz.professorId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error("Get quiz submission error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const submission = await prisma.quizSubmission.findUnique({
      where: { id: params.id },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                options: true
              }
            }
          }
        }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    const { action, answers, grade, feedback, timeSpent } = await req.json()

    if (action === "save_answers") {
      // Only students can save answers
      if (session.user.role !== "STUDENT" || submission.studentId !== session.user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }

      if (submission.status === "SUBMITTED") {
        return NextResponse.json({ error: "Cannot modify submitted quiz" }, { status: 400 })
      }

      // Save/update answers
      for (const answer of answers) {
        const { questionId, optionId, timeSpent: questionTimeSpent } = answer

        // Verify question belongs to this quiz
        const question = submission.quiz.questions.find(q => q.id === questionId)
        if (!question) {
          continue
        }

        // Verify option belongs to this question (if provided)
        if (optionId) {
          const option = question.options.find(o => o.id === optionId)
          if (!option) {
            continue
          }
        }

        await prisma.quizAnswer.upsert({
          where: {
            submissionId_questionId: {
              submissionId: params.id,
              questionId: questionId
            }
          },
          update: {
            optionId: optionId || null,
            timeSpent: questionTimeSpent
          },
          create: {
            submissionId: params.id,
            questionId: questionId,
            optionId: optionId || null,
            timeSpent: questionTimeSpent
          }
        })
      }

      // Update submission time spent
      if (timeSpent !== undefined) {
        await prisma.quizSubmission.update({
          where: { id: params.id },
          data: { timeSpent }
        })
      }

      return NextResponse.json({ message: "Answers saved successfully" })

    } else if (action === "submit") {
      // Only students can submit
      if (session.user.role !== "STUDENT" || submission.studentId !== session.user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }

      if (submission.status === "SUBMITTED") {
        return NextResponse.json({ error: "Quiz already submitted" }, { status: 400 })
      }

      // Calculate score
      const allAnswers = await prisma.quizAnswer.findMany({
        where: { submissionId: params.id },
        include: {
          question: {
            include: {
              options: true
            }
          },
          option: true
        }
      })

      console.log(`📊 Found ${allAnswers.length} answers to score for submission ${params.id}`)
      
      let earnedPoints = 0
      
      // Update answer correctness and points - ENHANCED DEBUGGING
      for (const answer of allAnswers) {
        console.log(`\n🔍 Scoring Question ${answer.question.id}:`)
        console.log(`  - Question: "${answer.question.question.substring(0, 50)}..."`)
        console.log(`  - Question Points: ${answer.question.points}`)
        console.log(`  - Student Selected Option ID: ${answer.optionId}`)
        console.log(`  - Selected Option:`, answer.option)
        
        // Find all options for this question to see correct answers
        const allQuestionOptions = answer.question.options;
        console.log(`  - All Question Options:`)
        allQuestionOptions.forEach(opt => {
          console.log(`    * ID: ${opt.id}, Text: "${opt.text}", isCorrect: ${opt.isCorrect}`)
        })
        
        let isCorrect = false
        let pointsEarned = 0
        
        if (answer.option) {
          isCorrect = answer.option.isCorrect === true
          pointsEarned = isCorrect ? answer.question.points : 0
          
          console.log(`  - Selected Option Details:`)
          console.log(`    * Text: "${answer.option.text}"`)
          console.log(`    * isCorrect: ${answer.option.isCorrect}`)
          console.log(`    * Type of isCorrect: ${typeof answer.option.isCorrect}`)
        } else {
          console.log(`  - ❌ No option selected`)
        }
        
        console.log(`  - Final Result: isCorrect=${isCorrect}, pointsEarned=${pointsEarned}/${answer.question.points}`)
        
        await prisma.quizAnswer.update({
          where: { id: answer.id },
          data: {
            isCorrect,
            pointsEarned
          }
        })

        earnedPoints += pointsEarned
      }

      console.log(`\n📈 SCORING SUMMARY:`)
      console.log(`  - Total earned points: ${earnedPoints}`)
      console.log(`  - Total possible points: ${submission.totalPoints}`)
      
      const score = submission.totalPoints ? (earnedPoints / submission.totalPoints) * 100 : 0
      console.log(`  - Final percentage score: ${score}%`)

      // Update submission
      const updatedSubmission = await prisma.quizSubmission.update({
        where: { id: params.id },
        data: {
          status: "SUBMITTED",
          submittedAt: new Date(),
          earnedPoints,
          score,
          timeSpent: timeSpent || submission.timeSpent
        },
        include: {
          quiz: {
            include: {
              questions: {
                include: {
                  options: true
                }
              }
            }
          },
          answers: {
            include: {
              question: true,
              option: true
            }
          },
          screenTrackings: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      })

      console.log(`✅ Submission updated with final score: ${score}%`)

      return NextResponse.json({
        message: "Quiz submitted successfully",
        submission: updatedSubmission
      })

    } else if (action === "grade") {
      // Only professors can grade
      if (session.user.role !== "PROFESSOR" || submission.quiz.professorId !== session.user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }

      if (submission.status !== "SUBMITTED") {
        return NextResponse.json({ error: "Can only grade submitted quizzes" }, { status: 400 })
      }

      const updatedSubmission = await prisma.quizSubmission.update({
        where: { id: params.id },
        data: {
          status: "GRADED",
          grade,
          feedback
        },
        include: {
          quiz: true,
          student: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          answers: {
            include: {
              question: true,
              option: true
            }
          }
        }
      })

      return NextResponse.json({
        message: "Quiz graded successfully",
        submission: updatedSubmission
      })

    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

  } catch (error) {
    console.error("Update quiz submission error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 