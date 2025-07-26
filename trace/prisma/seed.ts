import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create test professor
  const professorPassword = await bcrypt.hash('professor123', 12)
  const professor = await prisma.user.upsert({
    where: { email: 'professor@test.com' },
    update: {},
    create: {
      email: 'professor@test.com',
      name: 'Dr. Smith',
      password: professorPassword,
      role: 'PROFESSOR',
    },
  })

  // Create test students
  const studentPassword = await bcrypt.hash('student123', 12)
  const student1 = await prisma.user.upsert({
    where: { email: 'student1@test.com' },
    update: {},
    create: {
      email: 'student1@test.com',
      name: 'Alice Johnson',
      password: studentPassword,
      role: 'STUDENT',
    },
  })

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@test.com' },
    update: {},
    create: {
      email: 'student2@test.com',
      name: 'Bob Wilson',
      password: studentPassword,
      role: 'STUDENT',
    },
  })

  // Create test classes
  const class1 = await prisma.class.upsert({
    where: { id: 'test-class-1' },
    update: {},
    create: {
      id: 'test-class-1',
      name: 'Introduction to Environmental Science',
      description: 'A comprehensive course covering the fundamentals of environmental science and sustainability.',
      professorId: professor.id,
    },
  })

  const class2 = await prisma.class.upsert({
    where: { id: 'test-class-2' },
    update: {},
    create: {
      id: 'test-class-2',
      name: 'Advanced Literature Studies',
      description: 'An in-depth exploration of classic and contemporary literature with focus on critical analysis.',
      professorId: professor.id,
    },
  })

  // Create test assignments
  const assignment1 = await prisma.assignment.upsert({
    where: { id: 'test-assignment-1' },
    update: {},
    create: {
      id: 'test-assignment-1',
      title: 'Essay on Climate Change',
      description: 'Write a comprehensive essay discussing the impacts of climate change on global agriculture and potential solutions.',
      instructions: 'Your essay should be well-structured with an introduction, body paragraphs, and conclusion. Use specific examples and cite your sources.',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      estimatedTime: 90,
      minWords: 800,
      maxWords: 1200,
      status: 'PUBLISHED',
      professorId: professor.id,
      classId: class1.id,
    },
  })

  const assignment2 = await prisma.assignment.upsert({
    where: { id: 'test-assignment-2' },
    update: {},
    create: {
      id: 'test-assignment-2',
      title: 'Literature Analysis: To Kill a Mockingbird',
      description: 'Analyze the themes and literary devices used in Harper Lee\'s "To Kill a Mockingbird".',
      instructions: 'Focus on the themes of racial injustice, moral growth, and loss of innocence. Provide specific examples from the text.',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      estimatedTime: 120,
      minWords: 1000,
      maxWords: 1500,
      status: 'PUBLISHED',
      professorId: professor.id,
      classId: class2.id,
    },
  })

  const assignment3 = await prisma.assignment.upsert({
    where: { id: 'test-assignment-3' },
    update: {},
    create: {
      id: 'test-assignment-3',
      title: 'Historical Research Paper',
      description: 'Research and write about the causes and effects of World War I on European society.',
      instructions: 'Use at least 5 credible sources and include proper citations. Focus on social, economic, and political impacts.',
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
      estimatedTime: 180,
      minWords: 1200,
      maxWords: 2000,
      status: 'DRAFT', // This one is still a draft
      professorId: professor.id,
      classId: class1.id,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log('📧 Test accounts created:')
  console.log('   Professor: professor@test.com / professor123')
  console.log('   Student 1: student1@test.com / student123')
  console.log('   Student 2: student2@test.com / student123')
  console.log('🏫 Test classes created:')
  console.log(`   - ${class1.name}`)
  console.log(`   - ${class2.name}`)
  console.log('📝 Test assignments created:')
  console.log(`   - ${assignment1.title} (Published)`)
  console.log(`   - ${assignment2.title} (Published)`)
  console.log(`   - ${assignment3.title} (Draft)`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  }) 