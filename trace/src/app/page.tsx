import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <main className="max-w-4xl w-full">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold">TRACE</h1>
          <p className="text-gray-600 mt-2">Behavior Tracking System</p>
        </div>
        
        <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg w-full">
          <h2 className="text-2xl font-bold mb-6">Editor Behavior Tracking Demo</h2>
          <p className="mb-6">This project demonstrates how to track user behavior in a rich text editor, including:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-700 p-4 rounded shadow-sm">
              <h3 className="font-semibold mb-2">Keystroke Capture</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Records every key pressed by the user in real-time</p>
            </div>
            <div className="bg-white dark:bg-gray-700 p-4 rounded shadow-sm">
              <h3 className="font-semibold mb-2">Pause Measurement</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Detects and timestamps pauses in typing activity</p>
            </div>
            <div className="bg-white dark:bg-gray-700 p-4 rounded shadow-sm">
              <h3 className="font-semibold mb-2">Cursor Movement</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Tracks cursor position changes throughout the document</p>
            </div>
            <div className="bg-white dark:bg-gray-700 p-4 rounded shadow-sm">
              <h3 className="font-semibold mb-2">Timestamped Changes</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Every action is recorded with precise timing information</p>
            </div>
          </div>
          
          <div className="new-feature bg-blue-50 dark:bg-blue-900 p-4 rounded shadow-sm mb-8">
            <h3 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">New: AI-Powered Behavior Analysis</h3>
            <p className="text-sm text-blue-600 dark:text-blue-200 mb-3">
              Our system now analyzes typing behavior to detect if text was written by a human or generated/pasted by AI.
              The analysis considers typing rhythm, pauses, corrections, and more.
            </p>
            <ul className="list-disc pl-5 text-sm text-blue-600 dark:text-blue-200 mb-3">
              <li>Record a reference sample to calibrate to your typing style</li>
              <li>Submit your text for cheating detection analysis</li>
              <li>View detailed metrics about your typing behavior</li>
              <li>Compare sessions in the admin dashboard</li>
            </ul>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/editor"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors text-center"
            >
              Try the Editor Demo
            </Link>
            <Link
              href="/dashboard"
              className="inline-block bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors text-center"
            >
              View Dashboard
            </Link>
          </div>
        </div>
        
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>TRACE - Behavior Tracking System &copy; {new Date().getFullYear()}</p>
        </footer>
      </main>
    </div>
  );
}
