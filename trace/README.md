# TRACE - Academic Integrity Monitoring System

TRACE is a comprehensive academic integrity monitoring system that tracks student typing behavior to detect AI-generated content and ensure authentic work submission. The system now features advanced behavioral analysis with sophisticated anomaly detection and proper error handling.

## Features

### Real-time Behavior Monitoring
- **Keystroke Dynamics**: Captures timing between keystrokes, dwell times, and flight times
- **Advanced Metrics**: Measures typing speed variability, burstiness, rhythm consistency
- **Pause Analysis**: Categorizes pauses (short, medium, long) and analyzes patterns
- **Editing Behavior**: Tracks corrections, deletions, backtracking, and cursor movements
- **Temporal Analysis**: Monitors typing acceleration and fatigue indicators

### AI Content Detection
- **GPTzero Integration**: Professional AI detection with proper error handling
- **Confidence Scoring**: Detailed AI detection scores with provider attribution
- **Error Management**: Clear error messages when API is unavailable instead of fake scores

### Student Dashboard
- **Assignment Management**: View and start monitored assignments
- **Real-time Statistics**: Track progress with word count, time spent, actions recorded
- **Calibration System**: Establish personal typing baseline before assignments
- **Workflow Guidance**: Step-by-step process (Calibration → Writing → Analysis)

### Professor Dashboard
- **Comprehensive Analysis**: Detailed review of student submissions with risk levels
- **Suspicious Activity Detection**: Categorized alerts (paste, speed anomaly, rhythm anomaly, etc.)
- **Advanced Filtering**: Filter by risk level (low, medium, high, critical)
- **Detailed Reporting**: Evidence-based analysis with confidence scores and timelines

### Enhanced Analysis Engine
- **Sophisticated Confidence Scoring**: Multi-factor analysis with weighted behavioral and content scores
- **Reference Comparison**: Statistical comparison with calibration data
- **Anomaly Detection**: Context-aware detection of suspicious patterns
- **Risk Assessment**: Four-tier risk classification (low, medium, high, critical)
- **Timeline Analysis**: Chronological view of suspicious activities

## Setup Instructions

### 1. Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

### 2. Environment Configuration

---

### 3. Usage

1. **Homepage**: Navigate to `http://localhost:3000` to see the main landing page
2. **Student Portal**: Click "Enter Student Dashboard" to access student assignments
3. **Professor Portal**: Click "Enter Professor Dashboard" to review submissions
4. **Practice Mode**: Use "Try Editor Demo" to test the monitoring system

## User Workflows

### Student Workflow
1. **Access Dashboard**: Navigate to `/student` to view assignments
2. **Start Assignment**: Click "Start Assignment" to begin monitored work
3. **Calibration**: Complete typing calibration to establish baseline (multiple samples recommended)
4. **Writing**: Complete assignment in monitored editor with real-time statistics
5. **Analysis**: Review behavioral analysis results
6. **Submission**: Submit work after reviewing analysis

### Professor Workflow
1. **Access Dashboard**: Navigate to `/professor` to review submissions
2. **Filter Submissions**: Use risk-level filters (All, Suspicious, Verified)
3. **Review Analysis**: Click "View Details" for comprehensive analysis including:
   - **Behavioral Metrics**: Speed, rhythm, consistency, pause patterns
   - **Suspicious Activities**: Detailed evidence with severity levels
   - **AI Detection**: Content analysis results or error messages
   - **Reference Comparison**: Statistical comparison with student's calibration
   - **Timeline**: Chronological view of session events
4. **Make Decisions**: Use comprehensive data for academic integrity assessment

## Technical Details

### Enhanced Monitoring Capabilities
- **Keystroke Dynamics**: Advanced timing analysis with flight/dwell time calculation
- **Behavioral Patterns**: Burstiness, consistency scoring, fatigue detection
- **Paste Detection**: Sophisticated detection with confidence scoring and content analysis
- **Rhythm Analysis**: Mathematical consistency measurement with statistical significance
- **Temporal Patterns**: Typing acceleration and fatigue indicators over time

### Sophisticated Analysis Metrics
- **Typing Speed**: Average, standard deviation, words per minute
- **Rhythm Consistency**: Statistical measurement of keystroke timing regularity
- **Pause Analysis**: Categorized pause detection with pattern recognition
- **Correction Patterns**: Deletion rates, backtracking frequency, revision analysis
- **Behavioral Scoring**: Multi-dimensional consistency and authenticity scoring

### Risk Assessment System
- **Four-Tier Classification**: Low, Medium, High, Critical risk levels
- **Evidence-Based Scoring**: Detailed evidence for each suspicious activity
- **Confidence Metrics**: Separate behavioral and content confidence scores
- **Statistical Significance**: Calibration comparison with significance testing

### AI Detection Integration
- **Professional API**: GPTzero integration with proper authentication
- **Error Handling**: Clear error messages instead of mock responses
- **Confidence Scoring**: Detailed AI detection probability scores
- **Provider Attribution**: Clear identification of detection service used

## Development

### Project Structure
```
src/
├── app/
│   ├── api/analyze/          # Enhanced analysis API with sophisticated algorithms
│   ├── student/              # Student dashboard with assignment management
│   ├── professor/            # Professor dashboard with detailed analysis
│   ├── editor/               # Monitored editor with workflow management
│   └── page.tsx              # Homepage with role-based navigation
├── components/
│   ├── Editor.tsx            # Rich text editor with advanced monitoring
│   ├── Calibration.tsx       # Typing calibration with multiple samples
│   └── AnalysisDashboard.tsx # Comprehensive analysis results display
└── store/
    └── editorStore.ts        # State management for typing actions
```

### API Endpoints
- `POST /api/analyze` - Advanced analysis with behavioral scoring and AI detection
- `POST /api/actions` - Save typing actions with session management

### Analysis Algorithm Features
- **Statistical Comparison**: Advanced reference data comparison with tolerance bands
- **Anomaly Detection**: Context-aware pattern recognition
- **Confidence Calculation**: Multi-factor weighted scoring system
- **Timeline Generation**: Chronological event tracking with risk assessment
- **Error Handling**: Comprehensive error management for external services

## Security and Privacy

- **Data Protection**: Typing behavior data is processed locally for analysis
- **API Security**: Secure integration with external AI detection services
- **Error Transparency**: Clear communication when services are unavailable
- **Statistical Privacy**: Anonymized behavioral pattern analysis

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement improvements to analysis algorithms
4. Test thoroughly with various typing patterns
5. Submit a pull request with detailed documentation

## Support

For technical issues or questions about academic integrity monitoring:
- **API Configuration**: Ensure GPTzero API key is properly configured
- **Analysis Questions**: Review the detailed metrics and evidence provided
- **Integration Support**: Contact the development team for assistance

## License

This project is licensed under the MIT License.
