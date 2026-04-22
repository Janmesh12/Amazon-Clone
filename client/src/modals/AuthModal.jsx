import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, login, register } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false); // prevent double-submit

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Hard guard: ignore if already submitting
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      if (isLogin) {
        const success = await login(email, password);
        if (success) {
          setIsAuthModalOpen(false);
          setEmail('');
          setPassword('');
        }
      } else {
        const success = await register(name, email, password, mobile);
        if (success) {
          setIsAuthModalOpen(false);
          setName(''); setEmail(''); setPassword(''); setMobile('');
        }
      }
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  };

  return (
    // Backdrop / Overlay with Backdrop Blur
    <div className="fixed inset-0 z-[2000] bg-black/60 flex items-center justify-center p-4">
      {/* Modal Container */}
      <div className="bg-white rounded w-full max-w-[400px] p-6 relative">
        
        {/* Close Button (X) */}
        <button 
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold text-lg"
        >
          ✕
        </button>

        {/* Modal Header: Amazon Logo & Title */}
        <div className="flex flex-col items-center mb-6">
          <span className="text-[28px] font-extrabold tracking-tighter text-amazon-dark mb-2">amazon<span className="text-amazon-orange">.in</span></span>
          <h2 className="text-[26px] self-start font-normal mb-2">{isLogin ? 'Sign-In' : 'Create Account'}</h2>
        </div>
        
        {/* Verification Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* REGISTRATION ONLY FIELDS: Shown only when creating an account */}
          {!isLogin && (
            <>
              {/* Full Name Input */}
              <div className="flex flex-col">
                <label className="text-[13px] font-bold mb-1">Your name</label>
                <input 
                  type="text" required value={name} onChange={e=>setName(e.target.value)}
                  placeholder="First and last name"
                  maxLength="50"
                  pattern="^[a-zA-Z\s]+$"
                  title="Only letters and spaces allowed"
                  className="border border-gray-400 rounded px-3 py-1.5 focus:border-amazon-orange focus:ring-1 focus:ring-amazon-orange focus:outline-none transition-shadow"
                />
              </div>
              {/* Mobile Number Input */}
              <div className="flex flex-col">
                <label className="text-[13px] font-bold mb-1">Mobile number</label>
                <input 
                  type="tel" required value={mobile} onChange={e=>setMobile(e.target.value)}
                  placeholder="Mobile number"
                  pattern="[0-9]{10}"
                  title="Please enter a valid 10-digit mobile number"
                  className="border border-gray-400 rounded px-3 py-1.5 focus:border-amazon-orange focus:ring-1 focus:ring-amazon-orange focus:outline-none transition-shadow"
                />
              </div>
            </>
          )}

          {/* SHARED FIELDS: Both Login and Register use Email/Password */}
          <div className="flex flex-col">
            <label className="text-[13px] font-bold mb-1">Email</label>
            <input 
              type="email" required value={email} onChange={e=>setEmail(e.target.value)}
              className="border border-gray-400 rounded px-3 py-1.5 focus:border-amazon-orange focus:ring-1 focus:ring-amazon-orange focus:outline-none transition-shadow"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[13px] font-bold mb-1">Password</label>
            <input 
              type="password" required value={password} onChange={e=>setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="border border-gray-400 rounded px-3 py-1.5 focus:border-amazon-orange focus:ring-1 focus:ring-amazon-orange focus:outline-none transition-shadow"
            />
          </div>

          {/* Action Button: Dynamic label based on mode */}
          <button type="submit" disabled={isSubmitting} className="bg-[#f0c14b] text-[#111] hover:bg-[#e2b541] disabled:bg-gray-300 disabled:cursor-not-allowed hover:border-[#a88734] border border-[#a88734] rounded py-1.5 font-medium mt-2 shadow-sm">
            {isSubmitting ? 'Processing...' : (isLogin ? 'Continue' : 'Verify mobile number')}
          </button>
        </form>

        {/* Amazon's Legal Footnote */}
        <p className="text-[12px] mt-4 text-gray-600">
          By continuing, you agree to Amazon's <span className="text-amazon-link hover:underline hover:text-red-700 cursor-pointer">Conditions of Use</span> and <span className="text-amazon-link hover:underline hover:text-red-700 cursor-pointer">Privacy Notice</span>.
        </p>

        {/* SWITCH MODE SECTION: Allows toggling between 'Sign In' and 'Register' */}
        <div className="mt-6 flex flex-col items-center border-t border-gray-200 pt-4">
          {isLogin ? (
            <>
              {/* 'New to Amazon' UI Header with a horizontal line */}
              <div className="text-[12px] text-gray-500 mb-2 relative w-full text-center">
                <span className="bg-white px-2 relative z-10">New to Amazon?</span>
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-200 z-0"></div>
              </div>
              {/* Button to switch to Registration mode */}
              <button onClick={() => setIsLogin(false)} className="w-full bg-[#f1f1f1] hover:bg-[#e3e3e3] border border-gray-300 rounded py-1.5 text-[13px] font-medium shadow-sm">
                Create your Amazon account
              </button>
            </>
          ) : (
            // Button to switch back to Login mode
            <div className="text-[13px] w-full mt-2">
              Already have an account? <button onClick={() => setIsLogin(true)} className="text-amazon-link hover:underline font-medium hover:text-red-700">Sign in &rarr;</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
