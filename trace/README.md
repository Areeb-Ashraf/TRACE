# TRACE - Academic Integrity Monitoring System

TRACE is a comprehensive academic integrity monitoring system that tracks student typing behavior to detect AI-generated content and ensure authentic work submission.

## Features

- **Real-time Behavior Monitoring**: Tracks typing patterns, pauses, corrections, and cursor movements
- **AI Content Detection**: Integrates with GPTzero to identify AI-generated text
- **Student Dashboard**: Students can view assignments and complete monitored work sessions
- **Professor Dashboard**: Professors can review submissions and analyze work authenticity
- **Calibration System**: Establishes baseline typing patterns for each student
- **Detailed Analytics**: Comprehensive reports on typing behavior and authenticity metrics

## Setup Instructions

### 1. Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

### 2. Usage

1. **Homepage**: Navigate to `http://localhost:3000` to see the main landing page
2. **Student Portal**: Click "Enter Student Dashboard" to access student assignments
3. **Professor Portal**: Click "Enter Professor Dashboard" to review submissions
4. **Practice Mode**: Use "Try Editor Demo" to test the monitoring system

## User Workflows

### Student Workflow
1. Access the Student Dashboard at `/student`
2. View available assignments
3. Click "Start Assignment" to begin monitored work
4. Complete calibration process (establishes typing baseline)
5. Write assignment in the monitored editor
6. Submit work for analysis

### Professor Workflow
1. Access the Professor Dashboard at `/professor`
2. Review student submissions with authenticity scores
3. Filter by suspicious/verified submissions
4. View detailed analysis including:
   - Typing speed and rhythm patterns
   - AI detection results
   - Behavioral anomalies
   - Full submission content

## Technical Details

### Monitoring Capabilities
- **Keystroke Dynamics**: Timing between keystrokes, dwell times
- **Pause Analysis**: Detection and measurement of typing pauses
- **Editing Patterns**: Deletions, corrections, cursor movements
- **Paste Detection**: Identification of copy-paste operations
- **AI Text Analysis**: Content analysis using GPTzero API

### Analysis Metrics
- Average typing speed (CPM)
- Pause frequency and patterns
- Deletion/correction rates
- Rhythm consistency
- Cursor movement frequency
- Confidence scores for authenticity

## Development

### Project Structure
```
src/
├── app/
│   ├── api/analyze/          # Analysis API endpoint
│   ├── student/              # Student dashboard
│   ├── professor/            # Professor dashboard
│   ├── editor/               # Monitored editor
│   └── page.tsx              # Homepage
├── components/
│   ├── Editor.tsx            # Rich text editor with monitoring
│   ├── Calibration.tsx       # Typing calibration component
│   └── AnalysisDashboard.tsx # Analysis results display
└── store/
    └── editorStore.ts        # State management for actions
```

### API Endpoints
- `POST /api/analyze` - Analyze typing behavior and detect AI content
- `POST /api/actions` - Save typing actions to server

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For technical issues or questions about academic integrity monitoring, please contact the development team.
