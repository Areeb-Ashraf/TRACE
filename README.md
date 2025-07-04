# TRACE - AI-Powered Educational Intelligence Platform

**TRACE** (Typing Rhythm & Authorship Certification Engine) is a comprehensive AI-powered educational platform that combines academic integrity monitoring with intelligent learning management. Built for the modern educational ecosystem, TRACE empowers educators with advanced analytics while enhancing the learning experience for students.

## 🚀 Platform Overview

TRACE is more than just monitoring—it's a complete educational intelligence platform that leverages agentic AI to transform how education is delivered, monitored, and optimized.

### 🎯 Core Capabilities

**Academic Integrity & Monitoring**
- Advanced keystroke dynamics analysis and behavioral pattern recognition
- Real-time AI content detection powered by GPTZero integration
- Comprehensive screen and browser activity tracking via Chrome extension
- Multi-dimensional risk assessment with statistical confidence scoring

**AI-Powered Content Creation**
- Intelligent lesson plan generation from topics or uploaded documents
- Dynamic assignment creation with customizable learning objectives
- Automated quiz generation with multiple choice and true/false questions
- Document parsing and content extraction (PDF, DOC, TXT)

**Learning Management System**
- Interactive lesson delivery with progress tracking
- Real-time chat assistance within lessons
- Comprehensive quiz taking and analysis platform
- Assignment submission and detailed review workflows

**Advanced Analytics & Insights**
- Behavioral analysis with confidence scoring and anomaly detection
- Detailed student progress tracking and performance analytics
- Professor dashboard with comprehensive submission reviews
- Risk-based filtering and evidence-based reporting

## 🛠️ Technology Stack

### Frontend & UI
- **Next.js 15.3.2** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Full type safety across the platform
- **TailwindCSS 4** - Modern utility-first styling
- **TipTap Editor** - Rich text editing capabilities
- **Zustand** - Lightweight state management

### Backend & AI
- **Next.js API Routes** - Server-side API endpoints
- **Prisma ORM** - Type-safe database operations
- **LangChain** - AI agent orchestration and workflows
- **OpenAI GPT** - Advanced language model integration
- **Anthropic Claude** - Multi-model AI capabilities
- **PDF.js** - Document processing and text extraction

### Database & Storage
- **PostgreSQL** (Neon.tech) - Primary database with full-text search
- **AWS S3** - Cloud storage for documents and session data
- **Prisma Client** - Optimized database queries with connection pooling

### Authentication & Security
- **NextAuth.js** - Secure authentication with multiple strategies
- **JWT** - Token-based session management
- **bcryptjs** - Password hashing and validation
- **Role-based Access Control** - Professor, Student, and Admin roles

### Browser Integration
- **Chrome Extension** - Comprehensive activity monitoring
- **Screen Tracking** - Window focus and URL monitoring
- **Keystroke Analysis** - Advanced typing pattern recognition

## 📊 Platform Features

### For Educators (Professors)

**AI-Powered Content Creation**
- Generate comprehensive lesson plans from simple prompts
- Create assignments with specific learning objectives and requirements
- Build quizzes automatically with proper answer explanations
- Upload documents and convert them into structured lessons

**Advanced Student Monitoring**
- Real-time behavioral analysis during assignments
- AI content detection with confidence scoring
- Comprehensive activity tracking and timeline analysis
- Risk-based submission filtering and detailed evidence reporting

**Learning Analytics**
- Student progress tracking across all activities
- Performance analytics with trend analysis
- Engagement metrics and learning outcome assessment
- Exportable reports for institutional requirements

### For Students

**Enhanced Learning Experience**
- Interactive lesson viewer with progress tracking
- Built-in AI chat assistant for lesson support
- Real-time feedback during assignment completion
- Calibration system for baseline establishment

**Transparent Monitoring**
- Clear visibility into what data is being collected
- Real-time activity statistics during assignments
- Post-assignment behavioral analysis and insights
- Privacy-focused data handling with educational compliance

### For Administrators

**System Management**
- User role management and permissions
- Platform analytics and usage statistics
- Data export and compliance reporting
- System health monitoring and maintenance

## 🔧 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon.tech recommended)
- AWS account for S3 storage
- OpenAI and/or Anthropic API keys

### Installation

1. **Clone and Setup**
   ```bash
   git clone [repository-url]
   cd trace
   npm install
   ```

2. **Environment Configuration**
   Create `.env.local` in the trace directory:
   ```env
   # Database
   DATABASE_URL="your-neon-database-url"
   
   # Authentication
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXTAUTH_URL="http://localhost:3000"
   
   # AI Services
   OPENAI_API_KEY="your-openai-api-key"
   ANTHROPIC_API_KEY="your-anthropic-api-key"
   
   # AWS Storage
   AWS_ACCESS_KEY_ID="your-aws-access-key"
   AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
   AWS_S3_BUCKET_NAME="your-bucket-name"
   AWS_REGION="us-east-1"
   
   # External Services
   GPTZERO_API_KEY="your-gptzero-api-key"
   JWT_SECRET="your-jwt-secret"
   ```

3. **Database Setup**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:migrate
   ```

4. **Development Server**
   ```bash
   npm run dev
   ```

5. **Browser Extension Setup**
   - Navigate to `chrome://extensions/`
   - Enable Developer mode
   - Load unpacked extension from `browser-extension/` directory
   - Configure extension to connect to your local instance

## 🎓 User Workflows

### Professor Workflow

1. **AI Lesson Creation**
   - Access AI Lesson Creator from professor dashboard
   - Choose manual input or document upload
   - Generate comprehensive lessons with sections, objectives, and resources
   - Review and publish lessons for student access

2. **Assignment Management**
   - Create assignments using AI Assistant with specific parameters
   - Set learning objectives, difficulty levels, and time requirements
   - Monitor student submissions with advanced analytics
   - Review behavioral analysis and AI detection results

3. **Quiz Development**
   - Build quizzes with multiple question types
   - Set timing, randomization, and review options
   - Analyze student performance and question effectiveness
   - Export results for grading systems

### Student Workflow

1. **Lesson Engagement**
   - Access assigned lessons with structured content
   - Interact with AI chat assistant for additional support
   - Track progress through lesson sections
   - Complete embedded assessments and checkpoints

2. **Assignment Completion**
   - Access assignments with integrated monitoring
   - Complete calibration for behavioral baseline
   - Work in monitored editor environment
   - Submit with comprehensive activity tracking

3. **Quiz Taking**
   - Complete timed assessments with real-time monitoring
   - Receive instant feedback and results
   - Review performance analytics
   - Access study resources and explanations

## 🔒 Privacy & Security

### Data Protection
- **FERPA Compliance** - Educational privacy standards adherence
- **GDPR Alignment** - European data protection compliance
- **Data Minimization** - Only necessary data collection
- **Encryption** - End-to-end data encryption for sensitive information

### Monitoring Transparency
- **Clear Disclosure** - Students informed of all monitoring activities
- **Consent Management** - Explicit consent for behavior tracking
- **Data Access** - Students can view their own monitoring data
- **Retention Policies** - Clear data retention and deletion schedules

### Academic Integrity
- **Evidence-Based** - All decisions backed by statistical evidence
- **False Positive Prevention** - Multiple validation layers
- **Human Review** - Final decisions always involve human oversight
- **Appeal Process** - Clear procedures for challenging results

## 🏗️ Architecture

### API Structure
```
/api/
├── ai/
│   ├── assignment-creator/     # AI assignment generation
│   ├── lesson-creator/         # AI lesson plan creation
│   └── parse-pdf/             # Document processing
├── analyze/                   # Behavioral analysis engine
├── assignments/               # Assignment management
├── lessons/                   # Lesson delivery system
├── quizzes/                   # Quiz platform
├── screen-tracking/           # Activity monitoring
└── submissions/               # Submission processing
```

### Component Architecture
```
src/components/
├── AIAssignmentCreator.tsx    # AI-powered assignment builder
├── AILessonCreator.tsx        # AI lesson generation interface
├── AnalysisDashboard.tsx      # Behavioral analysis visualization
├── QuizTaker.tsx              # Interactive quiz interface
├── ScreenTracker.tsx          # Real-time monitoring component
└── Editor.tsx                 # Monitored writing environment
```

### Database Schema
- **Users** - Authentication and role management
- **Assignments** - Assignment definitions and metadata
- **Lessons** - Structured lesson content and resources
- **Quizzes** - Question banks and quiz configurations
- **Submissions** - Student work and analysis results
- **Sessions** - Behavioral tracking and screen monitoring data

## 📈 Analytics & Reporting

### Behavioral Metrics
- **Keystroke Dynamics** - Timing patterns and rhythm consistency
- **Typing Speed** - Average WPM with statistical deviation analysis
- **Pause Patterns** - Natural vs. artificial pause detection
- **Correction Rates** - Deletion patterns and revision behavior
- **Focus Tracking** - Window focus and multitasking detection

### AI Detection Capabilities
- **GPTZero Integration** - Professional AI content detection
- **Multi-Model Analysis** - Cross-validation with multiple AI detectors
- **Confidence Scoring** - Statistical confidence in AI detection results
- **Sentence-Level Analysis** - Granular detection with highlighting
- **Provider Attribution** - Clear identification of detection methods

### Risk Assessment
- **Four-Tier Classification** - Low, Medium, High, Critical risk levels
- **Evidence Aggregation** - Comprehensive evidence collection
- **Statistical Significance** - Confidence intervals and p-values
- **Timeline Analysis** - Chronological activity reconstruction
- **Anomaly Detection** - Statistical deviation from normal patterns

## 🚀 Deployment

### Production Environment
```bash
# Build for production
npm run build

# Start production server
npm run start
```

### Environment Variables (Production)
```env
# Production Database
DATABASE_URL="postgresql://[production-db-url]"

# Production Keys
NEXTAUTH_SECRET="[secure-production-secret]"
OPENAI_API_KEY="[production-openai-key]"
ANTHROPIC_API_KEY="[production-anthropic-key]"
GPTZERO_API_KEY="[production-gptzero-key]"

# AWS Production
AWS_ACCESS_KEY_ID="[production-aws-key]"
AWS_SECRET_ACCESS_KEY="[production-aws-secret]"
AWS_S3_BUCKET_NAME="[production-bucket]"
```

### Monitoring & Maintenance
- **Health Checks** - Automated system health monitoring
- **Performance Metrics** - Response time and throughput tracking
- **Error Tracking** - Comprehensive error logging and alerting
- **Database Monitoring** - Query performance and connection tracking
- **API Usage** - External service consumption monitoring

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `npm install`
4. Set up environment variables
5. Run database migrations: `npm run db:migrate`
6. Start development server: `npm run dev`

### Code Standards
- **TypeScript** - Strict typing required
- **ESLint** - Code quality enforcement
- **Prettier** - Consistent code formatting
- **Testing** - Unit tests for all new features
- **Documentation** - Comprehensive inline documentation

### Pull Request Process
1. Update documentation for any new features
2. Add tests for new functionality
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Submit pull request with detailed description

## 📞 Support

### Documentation
- **API Documentation** - Comprehensive API reference
- **User Guides** - Step-by-step tutorials for all user types
- **Video Tutorials** - Visual learning resources
- **FAQ** - Common questions and solutions

### Community
- **GitHub Issues** - Bug reports and feature requests
- **Discussions** - Community support and ideas
- **Contributing Guide** - How to contribute to the project
- **Code of Conduct** - Community interaction guidelines

---

**TRACE** - Transforming education through intelligent monitoring and AI-powered content creation.

Built with ❤️ for educators who demand excellence and transparency in academic assessment.

