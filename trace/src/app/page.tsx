"use client"

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (session) {
      // Redirect authenticated users to their respective dashboards
      if (session.user.role === "PROFESSOR") {
        router.push("/professor");
      } else {
        router.push("/student");
      }
    }
  }, [session, router]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-blue-200"></div>
            <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-blue-600 absolute top-0 left-0"></div>
          </div>
          <p className="mt-6 text-xl text-gray-600 font-medium">Loading TRACE...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-8">
          <main className="max-w-7xl w-full">
            {/* Hero Content */}
            <div className={`text-center mb-16 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="mb-8">
                <h1 className="text-7xl md:text-8xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-gradient-x">
                  TRACE
                </h1>
                <div className="text-2xl md:text-3xl text-gray-700 dark:text-gray-300 mb-2 font-semibold">
                  <span className="inline-block animate-pulse">T</span>yping{' '}
                  <span className="inline-block animate-pulse animation-delay-200">R</span>hythm{' '}
                  <span className="inline-block animate-pulse animation-delay-400">&</span>{' '}
                  <span className="inline-block animate-pulse animation-delay-600">A</span>uthorship{' '}
                  <span className="inline-block animate-pulse animation-delay-800">C</span>ertification{' '}
                  <span className="inline-block animate-pulse animation-delay-1000">E</span>ngine
                </div>
                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8 max-w-4xl mx-auto">
                  Evolved into a comprehensive AI-powered academic integrity platform for educators and students
                </p>
                <div className="flex flex-wrap justify-center gap-3 text-sm md:text-base">
                  <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full animate-bounce animation-delay-1000">
                    Behavioral Analysis
                  </span>
                  <span className="px-4 py-2 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full animate-bounce animation-delay-1200">
                    AI Detection
                  </span>
                  <span className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full animate-bounce animation-delay-1400">
                    Activity Monitoring
                  </span>
                  <span className="px-4 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full animate-bounce animation-delay-1600">
                    Chrome Extension
                  </span>
                </div>
              </div>
            </div>

            {/* Core Features Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-blue-200 dark:border-blue-700">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 mx-auto animate-pulse">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                  </svg>
                </div>
                <h3 className="font-bold text-lg text-center mb-2 text-blue-700 dark:text-blue-300">Keystroke Analysis</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 text-center">Real-time typing pattern and rhythm monitoring through our Chrome extension</p>
              </div>

              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-purple-200 dark:border-purple-700">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 mx-auto animate-pulse animation-delay-200">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                </div>
                <h3 className="font-bold text-lg text-center mb-2 text-purple-700 dark:text-purple-300">AI Content Detection</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 text-center">Advanced AI detection powered by GPTZero and custom ML models</p>
              </div>

              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-indigo-200 dark:border-indigo-700">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4 mx-auto animate-pulse animation-delay-400">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                </div>
                <h3 className="font-bold text-lg text-center mb-2 text-indigo-700 dark:text-indigo-300">Activity Monitoring</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 text-center">Window focus, tab switching, and URL tracking via Chrome extension</p>
              </div>

              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-green-200 dark:border-green-700">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4 mx-auto animate-pulse animation-delay-600">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                </div>
                <h3 className="font-bold text-lg text-center mb-2 text-green-700 dark:text-green-300">Comprehensive Reports</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 text-center">Detailed analytics and insights for educators with AI-powered assistance</p>
              </div>
            </div>

            {/* Future Features Section */}
            <div className={`bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 mb-16 text-white transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">Coming Soon: AI-Powered Education Tools</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2">AI Grading Assistant</h3>
                  <p className="text-white/90">Machine learning powered automated grading with detailed feedback</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce animation-delay-200">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Smart Assignment Creator</h3>
                  <p className="text-white/90">AI-generated assignments and tests tailored to your curriculum</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce animation-delay-400">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Computer Vision Monitoring</h3>
                  <p className="text-white/90">Advanced behavioral monitoring using computer vision technology</p>
                </div>
              </div>
            </div>

            {/* Privacy & Consent Section */}
            <div className={`bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-xl p-8 mb-12 transform transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center animate-pulse">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-amber-800 dark:text-amber-200 mb-3">
                    Important: Data Collection & Privacy Notice
                  </h3>
                  <div className="text-amber-700 dark:text-amber-300 space-y-2">
                    <p className="font-semibold">By creating an account and using TRACE, you consent to the following data collection:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Keystroke Logging:</strong> All typing patterns, speed, and timing through our Chrome extension</li>
                      <li><strong>Window Activity:</strong> Focus changes, tab switching, and active application monitoring</li>
                      <li><strong>URL Tracking:</strong> Websites visited and navigation patterns during monitored sessions</li>
                      <li><strong>Behavioral Data:</strong> Mouse movements, scroll patterns, and interaction timing</li>
                    </ul>
                    <p className="text-sm mt-4 font-medium">
                      This data is used exclusively for academic integrity monitoring and analysis. 
                      All data is encrypted and securely stored in compliance with educational privacy standards.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sign In/Sign Up Section */}
            {!session && (
              <div className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-indigo-200 dark:border-indigo-700 mb-12 transform transition-all duration-1000 delay-900 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <div className="text-center">
                  <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Ready to Get Started?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
                    Join thousands of educators using TRACE for academic integrity monitoring
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href="/auth/signin"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Sign In to Your Account
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Create New Account
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* User Portals */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 transform transition-all duration-1000 delay-1100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              {/* Student Portal */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-8 shadow-xl border-2 border-blue-200 dark:border-blue-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253z"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-300">Student Portal</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
                    Access assignments, complete monitored work sessions, and view your progress
                  </p>
                  <div className="space-y-2 mb-6 text-sm text-gray-500 dark:text-gray-400">
                    <p>✓ Real-time assignment tracking</p>
                    <p>✓ Secure work environment</p>
                    <p>✓ Progress analytics</p>
                  </div>
                </div>
                <Link
                  href={session ? "/student" : "/auth/signin"}
                  className="w-full inline-block bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 text-center shadow-lg"
                >
                  {session ? "Enter Student Dashboard" : "Access Student Portal"}
                </Link>
              </div>

              {/* Professor Portal */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-8 shadow-xl border-2 border-green-200 dark:border-green-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse animation-delay-200">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-green-700 dark:text-green-300">Professor Portal</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
                    Create assignments, monitor student activity, and analyze submission authenticity
                  </p>
                  <div className="space-y-2 mb-6 text-sm text-gray-500 dark:text-gray-400">
                    <p>✓ Advanced analytics dashboard</p>
                    <p>✓ AI-powered insights</p>
                    <p>✓ Comprehensive reporting</p>
                  </div>
                </div>
                <Link
                  href={session ? "/professor" : "/auth/signin"}
                  className="w-full inline-block bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 text-center shadow-lg"
                >
                  {session ? "Enter Professor Dashboard" : "Access Professor Portal"}
                </Link>
              </div>
            </div>

            {/* Demo Section */}
            <div className={`text-center mb-12 transform transition-all duration-1000 delay-1300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 inline-block">
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 font-medium">
                  Want to experience the core monitoring technology?
                </p>
                <Link
                  href="/editor"
                  className="inline-block bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Try Interactive Demo
                </Link>
              </div>
            </div>
            
            <footer className="text-center text-gray-500 text-sm">
              <p>TRACE - Academic Integrity Monitoring Platform &copy; {new Date().getFullYear()}</p>
              <p className="mt-2">Empowering educators with AI-powered academic integrity tools</p>
            </footer>
          </main>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes gradient-x {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animate-gradient-x {
          animation: gradient-x 6s ease infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }

        .animation-delay-400 {
          animation-delay: 400ms;
        }

        .animation-delay-600 {
          animation-delay: 600ms;
        }

        .animation-delay-800 {
          animation-delay: 800ms;
        }

        .animation-delay-1000 {
          animation-delay: 1000ms;
        }

        .animation-delay-1200 {
          animation-delay: 1200ms;
        }

        .animation-delay-1400 {
          animation-delay: 1400ms;
        }

        .animation-delay-1600 {
          animation-delay: 1600ms;
        }
      `}</style>
    </div>
  );
}
