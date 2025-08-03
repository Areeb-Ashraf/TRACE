"use client"

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Header from "@/components/Header";

// Add these testimonial data objects at the top of the file, after the imports
const testimonials = [
  {
    id: 1,
    text: "TRACE has revolutionized my teaching workflow. The AI generates complete lesson plans from my uploaded documents in minutes, and the keystroke dynamics analysis provides unprecedented insights into student behavior. It's like having a research assistant and integrity expert combined.",
    author: "Dr. Sarah Martinez",
    role: "Professor of Computer Science, Stanford University",
    initials: "SM"
  },
  {
    id: 2,
    text: "The behavioral analysis is incredibly sophisticated. It's helped me identify students who need additional support while maintaining the highest standards of academic integrity.",
    author: "Prof. Michael Johnson",
    role: "Department of Psychology, Harvard University",
    initials: "MJ"
  },
  {
    id: 3,
    text: "As an administrator, TRACE has given us institutional-level insights that have improved our academic integrity policies campus-wide. The compliance features are excellent.",
    author: "Lisa Davis",
    role: "VP Academic Affairs, MIT",
    initials: "LD"
  },
  {
    id: 4,
    text: "The AI-powered content creation has saved me countless hours. What used to take days now takes minutes, and the quality of the generated materials is consistently high. This tool is a game-changer for educators.",
    author: "Dr. James Wilson",
    role: "Department Chair, UC Berkeley",
    initials: "JW"
  },
  {
    id: 5,
    text: "TRACE's integration with our existing LMS was seamless. The analytics provide deep insights into student engagement and learning patterns that we never had access to before.",
    author: "Prof. Emily Chen",
    role: "Educational Technology, Yale University",
    initials: "EC"
  },
  {
    id: 6,
    text: "The Chrome extension is brilliant. It provides real-time monitoring without being intrusive, and the behavioral analysis helps us identify students who might need additional support early on.",
    author: "Dr. Robert Taylor",
    role: "Computer Science Department, Princeton",
    initials: "RT"
  }
];

const TRANSITION_DURATION = 1000; // milliseconds - increased from 700 to make animation more noticeable

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  // --- New Carousel Logic ---
  const extendedTestimonials = useMemo(() => {
    const clonesStart = testimonials.slice(-3);
    const clonesEnd = testimonials.slice(0, 3);
    return [...clonesStart, ...testimonials, ...clonesEnd];
  }, []);

  const [currentIndex, setCurrentIndex] = useState(3);
  const [transitionEnabled, setTransitionEnabled] = useState(true);

  const handleNext = () => {
    setCurrentIndex(prevIndex => prevIndex + 1);
  };

  const handlePrev = () => {
    setCurrentIndex(prevIndex => prevIndex - 1);
  };

  const handleTransitionEnd = () => {
    // After sliding to the 'clones' at the end of the list,
    // jump back to the beginning of the real list.
    if (currentIndex === testimonials.length + 3) {
      setTransitionEnabled(false);
      setCurrentIndex(3);
    }

    // After sliding to the 'clones' at the beginning of the list,
    // jump back to the end of the real list.
    if (currentIndex === 2) {
      setTransitionEnabled(false);
      setCurrentIndex(testimonials.length + 2);
    }
  };

  useEffect(() => {
    if (!transitionEnabled) {
      const timeout = setTimeout(() => {
        setTransitionEnabled(true);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [transitionEnabled]);

  // Autoplay
  useEffect(() => {
    const autoPlay = setInterval(handleNext, 4000);
    return () => clearInterval(autoPlay);
  }, []);
  // --- End New Carousel Logic ---

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

  // DELETE THE OLD `getVisibleTestimonials` and `handleTestimonialChange` functions
  // Old state like activeTestimonial, isTransitioning, slideDirection are no longer needed.
  // The old useEffect for auto-rotation should also be removed.

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="flex flex-col items-center justify-center w-full">
          <div className="relative mb-6" style={{ width: '128px', height: '128px', transform: 'translate(-20px, -16px)' }}>
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-blue-200 absolute top-0 left-0"></div>
            <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-blue-600 absolute top-0 left-0"></div>
            <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(20px, 16px)' }}>
              <img src="/trace_logo.png" alt="Trace" className="h-16 w-16" />
            </div>
          </div>
          <p className="text-xl text-gray-600 font-medium">Loading Trace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Show global header for authenticated users, landing page nav for unauthenticated */}
      {session ? (
        <Header />
      ) : (
        <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <img src="/trace_logo.png" alt="TRACE" className="h-8 w-8 mr-3" />
                <h1 className="text-2xl font-bold text-[#222e3e]">TRACE</h1>
              </div>
              <div className="hidden md:flex items-center space-x-8">
                <a href="#features" className="text-[#767e8b] hover:text-[#222e3e] transition-colors">Features</a>
                <a href="#benefits" className="text-[#767e8b] hover:text-[#222e3e] transition-colors">Benefits</a>
                <a href="#testimonials" className="text-[#767e8b] hover:text-[#222e3e] transition-colors">Testimonials</a>
                <Link href="/about" className="text-[#767e8b] hover:text-[#222e3e] transition-colors">About Us</Link>
                <Link href="/contact" className="text-[#767e8b] hover:text-[#222e3e] transition-colors">Contact Us</Link>
                <Link href="/auth/signin" className="text-[#767e8b] hover:text-[#222e3e] transition-colors">Sign In</Link>
                <Link href="/auth/signup" className="bg-[#222e3e] text-white px-6 py-2 rounded-lg hover:bg-[#1a242f] transition-colors">Get Started</Link>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Hero Section */}
      <section className={`${session ? 'pt-20' : 'pt-32'} pb-20 px-4 sm:px-6 lg:px-8`}>
        <div className="max-w-7xl mx-auto text-center">
                      <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h1 className="text-5xl md:text-7xl font-bold text-[#222e3e] mb-6 leading-tight">
              AI-Powered Education 
              <span className="block text-[#767e8b]">Intelligence Platform</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              The complete solution for modern education: AI content creation, behavioral monitoring, learning management, and academic integrity — all in one intelligent platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/auth/signup" className="bg-[#222e3e] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#1a242f] transition-all transform hover:scale-105">
                Start Free Trial
              </Link>
              <button className="border-2 border-[#767e8b] text-[#767e8b] px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#767e8b] hover:text-white transition-all">
                Watch Demo
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                No Setup Required
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                14-Day Free Trial
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Cancel Anytime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-[#222e3e] mb-6">
              Everything you need for modern education
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive AI-powered tools that transform teaching, learning, and academic integrity monitoring
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI Content Creation */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 group border border-gray-100">
              <div className="w-14 h-14 bg-[#222e3e] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#222e3e] mb-4">AI Content Creation</h3>
              <p className="text-gray-600 mb-4">Generate comprehensive lessons, assignments, and quizzes instantly using advanced AI models</p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Lesson plan generation
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Document-based content creation
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Automated quiz generation
                </li>
              </ul>
            </div>

            {/* Behavioral Monitoring */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 group border border-gray-100">
              <div className="w-14 h-14 bg-[#767e8b] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#222e3e] mb-4">Advanced Behavioral Analysis</h3>
              <p className="text-gray-600 mb-4">Comprehensive keystroke dynamics and typing pattern analysis with AI-powered insights</p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Real-time keystroke analysis
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Screen activity monitoring
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Statistical confidence scoring
                </li>
              </ul>
            </div>

            {/* AI Detection */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 group border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-r from-[#222e3e] to-[#767e8b] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#222e3e] mb-4">AI Content Detection</h3>
              <p className="text-gray-600 mb-4">State-of-the-art AI detection powered by GPTZero and custom machine learning models</p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  GPTZero integration
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Multi-model analysis
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Detailed confidence metrics
                </li>
              </ul>
            </div>

            {/* Learning Management */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 group border border-gray-100">
              <div className="w-14 h-14 bg-[#222e3e] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#222e3e] mb-4">Smart Learning Management</h3>
              <p className="text-gray-600 mb-4">Complete LMS with interactive lessons, progress tracking, and AI-powered chat assistance</p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Interactive lesson delivery
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Progress tracking
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  AI chat assistance
                </li>
              </ul>
            </div>

            {/* Analytics Dashboard */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 group border border-gray-100">
              <div className="w-14 h-14 bg-[#767e8b] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#222e3e] mb-4">Advanced Analytics</h3>
              <p className="text-gray-600 mb-4">Comprehensive insights and reporting with risk assessment and performance analytics</p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Risk-based filtering
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Detailed evidence reports
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Performance tracking
                </li>
              </ul>
            </div>

            {/* Browser Extension */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 group border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-r from-[#222e3e] to-[#767e8b] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#222e3e] mb-4">Chrome Extension</h3>
              <p className="text-gray-600 mb-4">Seamless browser integration for comprehensive activity monitoring and data collection</p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Window focus tracking
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  URL monitoring
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Real-time data sync
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-[#222e3e] mb-6">
              Why educators choose TRACE
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of educators who trust TRACE to enhance their teaching and maintain academic integrity
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#222e3e] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#222e3e] mb-2">Save 90% of Prep Time</h3>
                    <p className="text-gray-600">Generate comprehensive lesson plans, assignments, and quizzes in minutes, not hours. Focus on teaching, not planning.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#767e8b] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#222e3e] mb-2">99.2% Accuracy Rate</h3>
                    <p className="text-gray-600">Industry-leading AI detection combined with behavioral analysis provides unmatched accuracy in identifying academic integrity issues.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#222e3e] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#222e3e] mb-2">FERPA & GDPR Compliant</h3>
                    <p className="text-gray-600">Built with privacy by design. All data is encrypted, secure, and compliant with educational privacy standards.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#767e8b] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 010 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 010-2h4z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#222e3e] mb-2">Easy Integration</h3>
                    <p className="text-gray-600">Works seamlessly with existing LMS platforms. No complex setup or training required. Get started in minutes.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-100">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-[#222e3e] mb-4">Trusted by Leading Institutions</h3>
                <p className="text-gray-600">Join 500+ educational institutions worldwide</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                  <div className="text-3xl font-bold text-[#222e3e]">50,000+</div>
                  <div className="text-sm text-gray-600">Students Monitored</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                  <div className="text-3xl font-bold text-[#767e8b]">2,500+</div>
                  <div className="text-sm text-gray-600">Educators</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                  <div className="text-3xl font-bold text-[#222e3e]">1M+</div>
                  <div className="text-sm text-gray-600">Assignments Analyzed</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                  <div className="text-3xl font-bold text-[#767e8b]">99.2%</div>
                  <div className="text-sm text-gray-600">Accuracy Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-gray-50 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className={`text-center mb-16 transform transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-[#222e3e] mb-6">
              What educators are saying
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real feedback from educators who have transformed their teaching with TRACE
            </p>
          </div>

          <div className="relative">
            <div className="overflow-hidden">
              <div 
                className="flex"
                onTransitionEnd={handleTransitionEnd}
                style={{
                  transform: `translateX(-${currentIndex * (100 / 3)}%)`,
                  transition: transitionEnabled ? `transform ${TRANSITION_DURATION}ms ease-in-out` : 'none',
                }}
              >
                {extendedTestimonials.map((testimonial, index) => (
                  <div
                    key={`${testimonial.id}-${index}`}
                    className="flex-shrink-0"
                    style={{ width: `${100 / 3}%`, padding: '0 1rem' }}
                  >
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                      <div className="flex items-center mb-4">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                          </svg>
                        ))}
                      </div>
                      <div className="flex-grow">
                        <p className="text-gray-600 mb-6 italic text-lg line-clamp-4">&ldquo;{testimonial.text}&rdquo;</p>
                      </div>
                      <div className="flex items-center mt-4">
                        <div className="w-12 h-12 bg-[#222e3e] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                          {testimonial.initials}
                        </div>
                        <div className="ml-4 min-w-0">
                          <h4 className="font-bold text-[#222e3e] truncate">{testimonial.author}</h4>
                          <p className="text-gray-500 text-sm truncate">{testimonial.role}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index + 3)}
                  disabled={!transitionEnabled}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${index === (currentIndex - 3) % testimonials.length ? 'bg-[#222e3e] w-6' : 'bg-gray-300 hover:bg-gray-400'}`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            {/* Navigation Arrows */}
            <button onClick={handlePrev} disabled={!transitionEnabled} className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-[#222e3e] hover:bg-gray-50 transition-all focus:outline-none" aria-label="Previous testimonial">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={handleNext} disabled={!transitionEnabled} className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-[#222e3e] hover:bg-gray-50 transition-all focus:outline-none" aria-label="Next testimonial">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </section>
      
      {/* Call to Action Section */}
      <section className="py-20 bg-[#222e3e]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`transform transition-all duration-1000 delay-900 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to transform your classroom?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of educators who trust TRACE to enhance their teaching and maintain academic integrity. Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/auth/signup" className="bg-white text-[#222e3e] px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105">
                Start Free Trial
              </Link>
              <button className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-[#222e3e] transition-all">
                Schedule Demo
              </button>
            </div>
            <div className="text-gray-400 text-sm">
              ✓ 14-day free trial &nbsp;&nbsp; ✓ No credit card required &nbsp;&nbsp; ✓ Full feature access
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center">
                <img src="/trace_logo.png" alt="TRACE" className="h-8 w-8 mr-3" />
                <h3 className="text-2xl font-bold text-[#222e3e]">TRACE</h3>
              </div>
              <p className="text-gray-600">
                AI-powered educational intelligence platform transforming how you teach and learn.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-[#222e3e] rounded-lg flex items-center justify-center text-white hover:bg-[#767e8b] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-[#222e3e] rounded-lg flex items-center justify-center text-white hover:bg-[#767e8b] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-[#222e3e] mb-4">Product</h4>
              <ul className="space-y-3 text-gray-600">
                <li><a href="#features" className="hover:text-[#222e3e] transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-[#222e3e] transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-[#222e3e] transition-colors">Integration</a></li>
                <li><a href="#" className="hover:text-[#222e3e] transition-colors">Chrome Extension</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-[#222e3e] mb-4">Company</h4>
              <ul className="space-y-3 text-gray-600">
                <li><Link href="/about" className="hover:text-[#222e3e] transition-colors">About Us</Link></li>
                <li><a href="#" className="hover:text-[#222e3e] transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-[#222e3e] transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-[#222e3e] transition-colors">Press</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-[#222e3e] mb-4">Support</h4>
              <ul className="space-y-3 text-gray-600">
                <li><a href="#" className="hover:text-[#222e3e] transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-[#222e3e] transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-[#222e3e] transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-[#222e3e] transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 text-sm">
              © 2024 TRACE. All rights reserved.
            </p>
            <p className="text-gray-500 text-sm mt-4 md:mt-0">
              Transforming education through intelligent monitoring and AI-powered learning enhancement.
            </p>
          </div>
        </div>
      </footer>
      
      {/* Hidden demo links for functionality */}
      <div style={{ display: 'none' }}>
        <Link href="/student">Student Dashboard</Link>
        <Link href="/professor">Professor Dashboard</Link>
        <Link href="/editor">Editor Demo</Link>
      </div>
    </div>
  );
}
