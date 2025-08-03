export const AI_CONFIG = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4-turbo-preview',
    maxTokens: 4000,
    temperature: 0.7
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-sonnet-20240229',
    maxTokens: 4000,
    temperature: 0.7
  }
};

export const ASSIGNMENT_PROMPTS = {
  system: `You are an expert educational content creator with deep knowledge of pedagogy and curriculum design. 
  Your task is to create high-quality, engaging assignments that align with learning objectives and educational standards.
  
  When creating assignments, you must:
  1. Ensure alignment with provided learning objectives
  2. Create clear, actionable instructions
  3. Include appropriate difficulty levels
  4. Provide comprehensive rubrics for grading
  5. Suggest relevant resources and materials
  6. Consider diverse learning styles and accessibility
  7. Include estimated completion times
  8. Provide learning outcomes and assessment criteria
  
  Always structure your response in a clear, organized format that can be easily parsed and integrated into an educational platform.`,
  
  assignment: `Create a comprehensive assignment based on the following information:
  
  Subject: {subject}
  Topic: {topic}
  Learning Objectives: {learningObjectives}
  Difficulty Level: {difficulty}
  Assignment Type: {type}
  Estimated Duration: {duration} minutes
  Additional Requirements: {requirements}
  
  Please provide:
  1. A compelling title
  2. Clear description and context
  3. Detailed step-by-step instructions (as an array of steps)
  4. Comprehensive grading rubric
  5. Required resources and materials
  6. Learning outcomes and assessment criteria
  7. Tips for students
  8. Extension activities (optional)
  
  Format your response as JSON with the following structure:
  {
    "title": "Assignment Title",
    "description": "Clear description of what students need to do",
    "instructions": [
      "Step 1: First action students should take",
      "Step 2: Second action students should take",
      "Step 3: Third action students should take"
    ],
    "rubric": {
      "criteria": [
        {
          "name": "Criterion Name",
          "excellent": "Description of excellent work",
          "good": "Description of good work", 
          "satisfactory": "Description of satisfactory work",
          "needsImprovement": "Description of work needing improvement",
          "points": 25
        }
      ],
      "totalPoints": 100
    },
    "resources": ["List of required resources"],
    "learningOutcomes": ["Specific learning outcomes"],
    "tips": ["Helpful tips for students"],
    "extensions": ["Optional extension activities"],
    "estimatedTime": 60
  }`,
  
  chapterAssignment: `Create a comprehensive assignment based on the following chapter content:
  
  Chapter Content: {chapterContent}
  Subject: {subject}
  Topic: {topic}
  Learning Objectives: {learningObjectives}
  Difficulty Level: {difficulty}
  Assignment Type: {type}
  Estimated Duration: {duration} minutes
  Additional Requirements: {requirements}
  
  Analyze the chapter content and create an assignment that:
  1. Tests understanding of key concepts from the chapter
  2. Encourages critical thinking about the material
  3. Applies knowledge in practical scenarios
  4. Connects to real-world applications
  5. Promotes deeper engagement with the content
  
  Please provide:
  1. A compelling title that reflects the chapter content
  2. Clear description connecting to the chapter material
  3. Detailed step-by-step instructions (as an array of steps)
  4. Comprehensive grading rubric
  5. Required resources and materials (including chapter references)
  6. Learning outcomes and assessment criteria
  7. Tips for students based on chapter content
  8. Extension activities (optional)
  
  Format your response as JSON with the following structure:
  {
    "title": "Assignment Title",
    "description": "Clear description connecting to chapter content",
    "instructions": [
      "Step 1: First action students should take",
      "Step 2: Second action students should take",
      "Step 3: Third action students should take"
    ],
    "rubric": {
      "criteria": [
        {
          "name": "Criterion Name",
          "excellent": "Description of excellent work",
          "good": "Description of good work", 
          "satisfactory": "Description of satisfactory work",
          "needsImprovement": "Description of work needing improvement",
          "points": 25
        }
      ],
      "totalPoints": 100
    },
    "resources": ["List of required resources including chapter references"],
    "learningOutcomes": ["Specific learning outcomes"],
    "tips": ["Helpful tips for students based on chapter content"],
    "extensions": ["Optional extension activities"],
    "estimatedTime": 60
  }`,
  
  syllabus: `Analyze the following syllabus/curriculum and extract key information:
  
  Syllabus Content: {syllabus}
  
  Please extract and organize:
  1. Main topics and subtopics
  2. Learning objectives for each topic
  3. Prerequisites and assumed knowledge
  4. Assessment methods mentioned
  5. Required resources and materials
  6. Course structure and timeline
  
  Format as JSON:
  {
    "topics": [
      {
        "name": "Topic Name",
        "learningObjectives": ["Objective 1", "Objective 2"],
        "prerequisites": ["Prerequisite 1"],
        "estimatedDuration": 120,
        "assessmentMethods": ["Method 1"]
      }
    ],
    "courseStructure": {
      "totalWeeks": 16,
      "sessionsPerWeek": 3,
      "totalHours": 48
    },
    "resources": ["Resource 1", "Resource 2"]
  }`,

  lesson: `Create a comprehensive lesson based on the following information:
  
  Subject: {subject}
  Topic: {topic}
  Learning Objectives: {learningObjectives}
  Difficulty Level: {difficulty}
  Estimated Duration: {duration} minutes
  Additional Requirements: {requirements}
  
  Create an engaging, interactive lesson that:
  1. Introduces the topic with clear context
  2. Breaks down complex concepts into digestible sections
  3. Includes practical examples and applications
  4. Provides interactive elements and checkpoints
  5. Encourages critical thinking and reflection
  6. Connects to real-world applications
  
  Format your response as JSON:
  {
    "title": "Engaging Lesson Title",
    "description": "Clear lesson overview and what students will learn",
    "content": "Main lesson content with rich formatting, examples, and explanations",
    "sections": [
      {
        "title": "Section Title",
        "content": "Section content with examples and explanations",
        "sectionType": "content",
        "order": 1,
        "metadata": {
          "keyPoints": ["Point 1", "Point 2"],
          "examples": ["Example 1"],
          "checkpointQuestion": "What did you learn from this section?"
        }
      }
    ],
    "learningObjectives": ["Specific learning outcomes"],
    "resources": ["Additional resources and references"],
    "estimatedTime": 60,
    "keyTakeaways": ["Main points students should remember"]
  }`,

  lessonFromDocument: `Create a comprehensive lesson based on the following document content:
  
  Document Content: {documentContent}
  Subject: {subject}
  Topic: {topic}
  Learning Objectives: {learningObjectives}
  Difficulty Level: {difficulty}
  Estimated Duration: {duration} minutes
  Additional Requirements: {requirements}
  
  Analyze the document and create an engaging lesson that:
  1. Extracts key concepts and information from the document
  2. Organizes content into logical, digestible sections
  3. Adds explanations and context where needed
  4. Creates interactive elements and knowledge checks
  5. Connects document content to practical applications
  6. Ensures alignment with learning objectives
  
  Format your response as JSON:
  {
    "title": "Lesson Title Based on Document",
    "description": "Clear lesson overview derived from document content",
    "content": "Main lesson content synthesized from document with explanations",
    "sections": [
      {
        "title": "Section Title",
        "content": "Section content based on document with additional explanations",
        "sectionType": "content",
        "order": 1,
        "metadata": {
          "keyPoints": ["Key concepts from document"],
          "examples": ["Examples from or related to document"],
          "checkpointQuestion": "Understanding check question",
          "documentReferences": ["Page numbers or sections referenced"]
        }
      }
    ],
    "learningObjectives": ["Learning outcomes based on document content"],
    "resources": ["Document references and additional resources"],
    "estimatedTime": 60,
    "keyTakeaways": ["Main concepts students should understand from document"]
  }`,

  lessonChat: `You are an AI tutor helping a student understand a lesson. You have access to the full lesson content and should provide helpful, encouraging responses.

  Lesson Context: {lessonContent}
  Learning Objectives: {learningObjectives}
  
  Guidelines for responses:
  1. Always be encouraging and supportive
  2. Provide clear, concise explanations
  3. Use examples from the lesson content when relevant
  4. Ask follow-up questions to check understanding
  5. Break down complex concepts into simpler parts
  6. Relate concepts to real-world applications
  7. If the question is outside the lesson scope, gently redirect to lesson content
  8. Use an encouraging, friendly tone suitable for learning
  
  Student Question: {question}
  
  Provide a helpful response that aids the student's understanding of the lesson.`
};

export const ERROR_MESSAGES = {
  API_KEY_MISSING: 'AI API key not configured. Please check your environment variables.',
  API_ERROR: 'Error communicating with AI service. Please try again.',
  INVALID_INPUT: 'Invalid input provided. Please check your request.',
  RATE_LIMIT: 'Rate limit exceeded. Please wait a moment and try again.',
  CONTENT_TOO_LONG: 'Content too long for processing. Please shorten your input.',
  GENERATION_FAILED: 'Failed to generate content. Please try again with different parameters.'
}; 