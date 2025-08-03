"use client"

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AboutPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <img src="/trace_logo.png" alt="TRACE" className="h-8 w-8 mr-3" />
                <h1 className="text-2xl font-bold text-[#222e3e]">TRACE</h1>
              </Link>
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

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-[#222e3e] mb-6">
              Transforming Education Through Innovation
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              TRACE is pioneering the future of academic integrity with AI-powered solutions that empower educators and students alike.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#222e3e] mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                At TRACE, we're committed to preserving academic integrity in the AI era. We believe that education should reward genuine effort and understanding, not shortcuts. Our mission is to provide educators with unprecedented visibility into the learning process while fostering an environment of trust and authenticity.
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#222e3e] rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-[#222e3e]">99.2% Accuracy</h3>
                  <p className="text-gray-600">In detecting academic integrity concerns</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="font-semibold text-[#222e3e] mb-2">Vision</h3>
                <p className="text-gray-600">To create a future where technology enhances academic integrity rather than challenges it.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="font-semibold text-[#222e3e] mb-2">Values</h3>
                <p className="text-gray-600">Innovation, integrity, and transparency in everything we do.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="font-semibold text-[#222e3e] mb-2">Impact</h3>
                <p className="text-gray-600">Supporting over 500+ institutions worldwide.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="font-semibold text-[#222e3e] mb-2">Innovation</h3>
                <p className="text-gray-600">Pioneering AI-powered educational tools.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold text-[#222e3e] mb-6">Our Story</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Founded by a team of educators, engineers, and AI experts, TRACE emerged from a simple observation: the rise of AI in education created both challenges and opportunities. We saw the need for a solution that would not just detect AI usage, but fundamentally transform how we approach academic integrity in the digital age.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-[#222e3e] rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#222e3e] mb-4">The Challenge</h3>
              <p className="text-gray-600">Traditional academic integrity tools weren't equipped for the AI era, leaving educators struggling to adapt.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-[#767e8b] rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#222e3e] mb-4">The Solution</h3>
              <p className="text-gray-600">We developed cutting-edge behavioral analysis and AI detection technology specifically for education.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-gradient-to-r from-[#222e3e] to-[#767e8b] rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#222e3e] mb-4">The Impact</h3>
              <p className="text-gray-600">Today, TRACE helps thousands of educators maintain academic integrity while embracing educational innovation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-[#222e3e] mb-6">Meet Our Leadership</h2>
            <p className="text-lg text-gray-600">
              Our diverse team brings together expertise in education, technology, and academic integrity to drive innovation in learning.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Houston Parker */}
            <div className="text-center">
              <div className="mb-6">
                <a href="https://www.linkedin.com/in/houston-parkerr/" target="_blank" rel="noopener noreferrer">
                  <div className="w-32 h-32 mx-auto rounded-full border-4 border-[#222e3e] mb-4 flex items-center justify-center bg-gray-100 text-2xl font-bold text-[#222e3e]">
                    HP
                  </div>
                </a>
                <h3 className="text-xl font-bold text-[#222e3e]">Houston Parker</h3>
                <p className="text-gray-600 mb-4">Co-Founder & CEO</p>
                <a href="https://www.linkedin.com/in/houston-parkerr/" target="_blank" rel="noopener noreferrer" 
                   className="inline-flex items-center text-blue-600 hover:text-blue-700">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  LinkedIn
                </a>
              </div>
            </div>
            {/* Pearl Kapoor */}
            <div className="text-center">
              <div className="mb-6">
                <a href="https://www.linkedin.com/in/pearl-kapoor-9714a7216/" target="_blank" rel="noopener noreferrer">
                  <div className="w-32 h-32 mx-auto rounded-full border-4 border-[#222e3e] mb-4 flex items-center justify-center bg-gray-100 text-2xl font-bold text-[#222e3e]">
                    PK
                  </div>
                </a>
                <h3 className="text-xl font-bold text-[#222e3e]">Pearl Kapoor</h3>
                <p className="text-gray-600 mb-4">Co-Founder & CTO</p>
                <a href="https://www.linkedin.com/in/pearl-kapoor-9714a7216/" target="_blank" rel="noopener noreferrer" 
                   className="inline-flex items-center text-blue-600 hover:text-blue-700">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  LinkedIn
                </a>
              </div>
            </div>
            {/* Areeb Ashraf */}
            <div className="text-center">
              <div className="mb-6">
                <a href="https://www.linkedin.com/in/areeb-ashraf/" target="_blank" rel="noopener noreferrer">
                  <div className="w-32 h-32 mx-auto rounded-full border-4 border-[#222e3e] mb-4 flex items-center justify-center bg-gray-100 text-2xl font-bold text-[#222e3e]">
                    AA
                  </div>
                </a>
                <h3 className="text-xl font-bold text-[#222e3e]">Areeb Ashraf</h3>
                <p className="text-gray-600 mb-4">Co-Founder & COO</p>
                <a href="https://www.linkedin.com/in/areeb-ashraf/" target="_blank" rel="noopener noreferrer" 
                   className="inline-flex items-center text-blue-600 hover:text-blue-700">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-[#222e3e] mb-6">Our Impact</h2>
            <p className="text-lg text-gray-600">
              We're proud to be making a difference in education worldwide.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#222e3e] mb-2">500+</div>
              <p className="text-gray-600">Educational Institutions</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#222e3e] mb-2">50k+</div>
              <p className="text-gray-600">Students Monitored</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#222e3e] mb-2">99.2%</div>
              <p className="text-gray-600">Accuracy Rate</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#222e3e] mb-2">1M+</div>
              <p className="text-gray-600">Assignments Analyzed</p>
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
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.4-.75 1.38-1.54 2.84-1.54 3.04 0 3.6 2 3.6 4.59v4.72zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
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
                <li><Link href="/contact" className="hover:text-[#222e3e] transition-colors">Contact</Link></li>
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
    </main>
  );
}
