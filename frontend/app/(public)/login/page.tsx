'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/components/Logo';

// Mock image import (replace with actual path)
const desertImage = '/images/desert-bg.jpg'; // Update with your image path

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  // Handle email validation and form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    // Add login logic here (e.g., API call)
    console.log('Logging in with:', email);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white overflow-hidden">
      {/* Left Side: Login Form */}
      <div className="w-full lg:w-1/2 p-6 lg:p-12 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center">
            <Logo className="h-12 mb-6" /> {/* Assuming Logo is a custom component */}
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Login</h2>
            <p className="text-sm text-gray-600 mb-6">Please enter your email</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder-gray-400"
                placeholder="you@example.com"
                aria-describedby="email-error"
                required
              />
              {error && <p id="email-error" className="mt-1 text-sm text-red-600">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300"
            >
              Next
            </button>

            <p className="text-center text-sm text-gray-600">
              Click <Link href="/signup" className="text-blue-600 hover:text-blue-500 font-medium">here</Link> if you’re a new client
            </p>
          </form>

          <p className="mt-6 text-xs text-gray-500 text-center">
            © 2025 Exilex. All rights reserved. | <Link href="/privacy" className="underline">Privacy</Link> | <Link href="/terms" className="underline">Terms</Link>
          </p>
        </div>
      </div>

      {/* Right Side: Background Image */}
      <div className="hidden lg:block lg:w-1/2 h-screen relative">
        <div className="w-full h-full relative rounded-l-[1.5rem] overflow-hidden">
          <Image
            src={desertImage}
            alt="Desert background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-l from-blue-400/30 to-blue-200/20 rounded-l-[1.5rem]" />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;