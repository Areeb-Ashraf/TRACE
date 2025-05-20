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
          <div className="text-center">
            <Link
              href="/editor"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Try the Editor Demo
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
