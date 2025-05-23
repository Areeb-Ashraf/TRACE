import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <main className="max-w-4xl w-full">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold mb-2">TRACE</h1>
          <p className="text-xl text-gray-600 mb-8">Academic Integrity Monitoring System</p>
          <p className="text-lg text-gray-500">Ensuring authentic student work through behavioral analysis</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700 p-8 rounded-lg w-full mb-8">
          <h2 className="text-3xl font-bold mb-6 text-center">How TRACE Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-600 p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-3 text-lg text-blue-600">Real-time Monitoring</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Tracks typing patterns, pauses, corrections, and cursor movements as students work</p>
            </div>
            <div className="bg-white dark:bg-gray-600 p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-3 text-lg text-green-600">Behavioral Analysis</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Analyzes typing rhythm, speed consistency, and editing patterns to detect authenticity</p>
            </div>
            <div className="bg-white dark:bg-gray-600 p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-3 text-lg text-purple-600">AI Detection</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Integrates with GPTzero to identify AI-generated content in submissions</p>
            </div>
            <div className="bg-white dark:bg-gray-600 p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-3 text-lg text-orange-600">Detailed Reports</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Provides comprehensive analysis reports for professors to review student work authenticity</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Student Portal */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border-2 border-blue-200 dark:border-blue-700">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">Student Portal</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">Access your assignments and complete monitored work sessions</p>
            </div>
            <Link
              href="/student"
              className="w-full inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors text-center"
            >
              Enter Student Dashboard
            </Link>
          </div>

          {/* Professor Portal */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border-2 border-green-200 dark:border-green-700">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">Professor Portal</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">Review student submissions and analyze work authenticity</p>
            </div>
            <Link
              href="/professor"
              className="w-full inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors text-center"
            >
              Enter Professor Dashboard
            </Link>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            Interested in testing the core monitoring technology?
          </p>
          <Link
            href="/editor"
            className="inline-block bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
          >
            Try Editor Demo
          </Link>
        </div>
        
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>TRACE - Academic Integrity Monitoring System &copy; {new Date().getFullYear()}</p>
        </footer>
      </main>
    </div>
  );
}
