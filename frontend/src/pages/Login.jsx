import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [resetStep, setResetStep] = useState('idle'); // idle | request | otp
  const [resetEmail, setResetEmail] = useState('');
  const [otpData, setOtpData] = useState({ otp: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [verifyOtp, setVerifyOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const render = () => {
      if (!window.google?.accounts?.id) return;
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              setGoogleLoading(true);
              const res = await axios.post('/api/auth/google-login', {
                idToken: response.credential
              });
              
              localStorage.setItem('token', res.data.token);
              localStorage.setItem('user', JSON.stringify(res.data.user));
              window.dispatchEvent(new CustomEvent('auth-change'));
              toast.success('Signed in with Google');
              setTimeout(() => {
                if (res.data.user.role === 'host') navigate('/host/dashboard');
                else navigate('/');
              }, 500);
            } catch (err) {
              const msg = err.response?.data?.error || 'Google sign-in failed';
              toast.error(msg);
              if (err.response?.data?.requiresOtp) {
                setFormData((prev) => ({ ...prev, email: err.response.data.email }));
                setShowVerify(true);
              }
            } finally {
              setGoogleLoading(false);
            }
          }
        });

        const el = document.getElementById('google-login-btn');
        if (el && !el.dataset.rendered) {
          window.google.accounts.id.renderButton(el, {
            theme: 'outline',
            size: 'large',
            shape: 'pill',
            text: 'signin_with',
            width: 380
          });
          el.dataset.rendered = 'true';
        }
      } catch (_e) {
        // ignore
      }
    };

    const t = setInterval(() => {
      render();
      if (document.getElementById('google-login-btn')?.dataset.rendered === 'true') {
        clearInterval(t);
      }
    }, 250);
    return () => clearInterval(t);
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      };
      const response = await axios.post('/api/auth/login', payload);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.dispatchEvent(new CustomEvent('auth-change'));
      
      toast.success('Welcome back!');

      setTimeout(() => {
        if (response.data.user.role === 'host') {
          navigate('/host/dashboard');
        } else {
          navigate('/');
        }
      }, 1000);
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      toast.error(msg);
      if (msg.toLowerCase().includes('not verified')) {
        setShowVerify(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLoginOtp = async () => {
    const email = formData.email.trim().toLowerCase();
    const otp = verifyOtp.trim();
    if (!email || !otp) {
      toast.error('Enter email and OTP');
      return;
    }
    setVerifying(true);
    try {
      const res = await axios.post('/api/auth/verify-email-otp', { email, otp });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      window.dispatchEvent(new CustomEvent('auth-change'));
      toast.success('Email verified. Welcome!');
      setShowVerify(false);
      setVerifyOtp('');
      setTimeout(() => {
        if (res.data.user.role === 'host') navigate('/host/dashboard');
        else navigate('/');
      }, 500);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendVerifyOtp = async () => {
    const email = formData.email.trim().toLowerCase();
    if (!email) {
      toast.error('Enter your email first');
      return;
    }
    setResending(true);
    try {
      await axios.post('/api/auth/resend-verification-otp', { email });
      toast.success('OTP resent');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not resend OTP');
    } finally {
      setResending(false);
    }
  };

  const handleSendOtp = async (emailOverride) => {
    const emailToUse = (emailOverride ?? formData.email).trim();
    if (!emailToUse) {
      toast.error('Enter your email first');
      return;
    }
    setSendingOtp(true);
    try {
      await axios.post('/api/auth/forgot-password', { email: emailToUse });
      toast.success('OTP sent to your email (valid for 10 minutes)');
      setResetStep('otp');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const openForgotPassword = () => {
    setResetEmail(formData.email?.trim() || '');
    setOtpData({ otp: '', newPassword: '', confirmPassword: '' });
    setResetStep('request');
  };

  const cancelForgotPassword = () => {
    setResetStep('idle');
    setResetEmail('');
    setOtpData({ otp: '', newPassword: '', confirmPassword: '' });
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otpData.otp || !otpData.newPassword) {
      toast.error('Enter OTP and new password');
      return;
    }
    if (otpData.newPassword !== otpData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await axios.post('/api/auth/reset-password', {
        email: formData.email.trim().toLowerCase(),
        otp: otpData.otp.trim(),
        new_password: otpData.newPassword
      });
      toast.success('Password reset. Please log in.');
      setResetStep('idle');
      setOtpData({ otp: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset failed');
    }
  };

  return (
    <div className="light bg-surface font-body text-on-background min-h-screen flex flex-col overflow-x-hidden">
      <style>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .glass-effect {
          backdrop-filter: blur(20px);
          background: rgba(255, 255, 255, 0.8);
        }
        .asymmetric-overlay {
          clip-path: polygon(0 0, 100% 0, 100% 100%, 15% 100%);
        }
      `}</style>
      
      {/* Main Content Canvas */}
      <main className="flex-grow flex flex-col md:flex-row min-h-screen">
        {/* Left Side: Editorial Image Section */}
        <section className="hidden md:flex relative md:w-1/2 lg:w-[60%] overflow-hidden">
        <div className="absolute inset-0 z-0">
        <img alt="Luxury villa at dawn" className="w-full h-full object-cover" data-alt="Luxurious infinity pool at a private villa overlooking the ocean at dawn, soft purple and gold morning light, serene atmosphere" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlmWL242a1Xnmf3P2MB3mxK2xRkBgOaTofn1R24fI3pxfeZs8IXAgh0mkHcBshUTJ7w04SrJLGfruoetTOft66N8UBrPoFca2FbTclt5352nMl1xDu7Jxle_XCk4qOoYaS7guBKRAw5FWav_xeLXUk0MDTXdvG04dQsKs0DqrRzoTaXlCEQbsxCCZBnGNNctTfIiiPOh-1jgn9W9_ZTAiixkSQm9QQGTfbjUqB0tUI9dEEi_bp8GvOVqH_UE0Xmo3_W5TK41sgKfc"/>
        <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent"></div>
        </div>
        {/* Editorial Content Overlay */}
        <div className="relative z-10 p-16 flex flex-col justify-between h-full w-full">
        <div>
        <h1 className="text-white font-headline text-2xl font-bold tracking-tighter">BOOKMYSTAY</h1>
        </div>
        <div className="max-w-xl">
        <p className="text-white/70 font-label tracking-widest text-sm mb-4">A CURATED SANCTUARY</p>
        <h2 className="text-white font-headline text-5xl lg:text-6xl font-extrabold leading-tight mb-8">
                                The world’s most refined retreats, <span className="text-secondary-fixed-dim">unveiled.</span>
        </h2>
        <div className="h-1 w-24 bg-secondary"></div>
        </div>
        </div>
        </section>
        
        {/* Right Side: Login Form Section */}
        <section className="flex-grow flex items-center justify-center p-8 md:p-12 lg:p-24 bg-surface-container-lowest">
        <div className="w-full max-w-md">
        {/* Mobile Branding */}
        <div className="md:hidden mb-12">
        <h1 className="text-primary font-headline text-2xl font-bold tracking-tighter">BOOKMYSTAY</h1>
        </div>
        <header className="mb-12">
        <h2 className="font-headline text-3xl font-extrabold text-on-surface mb-3 tracking-tight">Welcome Back</h2>
        <p className="text-on-surface-variant text-sm">Please enter your details to access your sanctuary.</p>
        </header>
        {/* Social Login Cluster */}
        <div className="flex justify-center mb-8">
          <div id="google-login-btn" className={googleLoading ? 'opacity-60 pointer-events-none' : ''}></div>
        </div>
        <div className="relative flex items-center justify-center mb-10">
        <div className="w-full h-px bg-outline-variant/15"></div>
        <span className="absolute px-4 bg-surface-container-lowest text-xs text-on-surface-variant uppercase tracking-widest font-label">or with email</span>
        </div>
        {/* Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 font-label" htmlFor="email">Email Address</label>
        <input 
          className="w-full bg-surface-container-low border-0 rounded-xl px-4 py-4 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/10 transition-all" 
          id="email" 
          name="email"
          placeholder="name@domain.com" 
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        </div>
        <div>
        <div className="flex justify-between mb-2">
        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest font-label" htmlFor="password">Password</label>
        <button type="button" onClick={openForgotPassword} className="text-xs font-bold text-secondary hover:opacity-70 transition-opacity font-label">
          Forgot Password?
        </button>
        </div>
        <div className="relative">
          <input 
            className="w-full bg-surface-container-low border-0 rounded-xl px-4 py-4 pr-14 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/10 transition-all" 
            id="password" 
            name="password"
            placeholder="••••••••" 
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute inset-y-0 right-3 text-sm text-outline"
            style={{ minWidth: '48px' }}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        </div>
        <div className="flex items-center gap-3">
        <input className="w-5 h-5 rounded border-outline-variant/30 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer" id="remember" type="checkbox"/>
        <label className="text-sm text-on-surface-variant font-medium select-none cursor-pointer" htmlFor="remember">Keep me signed in for 30 days</label>
        </div>
        <button className="w-full bg-[#ff5a5f] text-white font-headline font-bold py-5 rounded-xl shadow-[0_20px_40px_rgba(255,90,95,0.25)] hover:shadow-none hover:translate-y-0.5 transition-all active:scale-95 duration-300 disabled:opacity-70 disabled:cursor-not-allowed" type="submit" disabled={loading}>
                                {loading ? 'Signing In...' : 'Sign In'}
                            </button>
        </form>

        {resetStep === 'request' && (
          <div className="mt-8 p-4 bg-surface-container-low border border-outline-variant/30 rounded-xl space-y-4">
            <h4 className="text-sm font-bold">Forgot password</h4>
            <p className="text-xs text-on-surface-variant">
              Enter your email and we’ll send you an OTP to reset your password.
            </p>
            <input
              className="w-full bg-white border border-outline-variant/40 rounded-lg px-3 py-3"
              placeholder="Enter your email"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  const emailToUse = resetEmail.trim().toLowerCase();
                  setFormData((p) => ({ ...p, email: emailToUse }));
                  handleSendOtp(emailToUse);
                }}
                disabled={sendingOtp}
                className="w-full bg-[#ff5a5f] text-white font-bold py-3 rounded-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {sendingOtp ? 'Sending...' : 'Send OTP'}
              </button>
              <button
                type="button"
                onClick={cancelForgotPassword}
                className="w-full bg-surface-container text-on-surface font-bold py-3 rounded-lg border border-outline-variant/30"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {resetStep === 'otp' && (
          <div className="mt-8 p-4 bg-surface-container-low border border-outline-variant/30 rounded-xl space-y-4">
            <h4 className="text-sm font-bold">Reset password</h4>
            <div className="grid gap-3">
              <input
                className="w-full bg-white border border-outline-variant/40 rounded-lg px-3 py-3"
                placeholder="Enter OTP"
                value={otpData.otp}
                onChange={(e) => setOtpData((p) => ({ ...p, otp: e.target.value }))}
              />
              <input
                className="w-full bg-white border border-outline-variant/40 rounded-lg px-3 py-3"
                placeholder="New password"
                type="password"
                value={otpData.newPassword}
                onChange={(e) => setOtpData((p) => ({ ...p, newPassword: e.target.value }))}
              />
              <input
                className="w-full bg-white border border-outline-variant/40 rounded-lg px-3 py-3"
                placeholder="Confirm new password"
                type="password"
                value={otpData.confirmPassword}
                onChange={(e) => setOtpData((p) => ({ ...p, confirmPassword: e.target.value }))}
              />
              <button
                onClick={handleResetPassword}
                className="w-full bg-[#ff5a5f] text-white font-headline font-bold py-3.5 rounded-xl shadow-[0_14px_28px_rgba(255,90,95,0.22)] hover:shadow-[0_18px_34px_rgba(255,90,95,0.28)] hover:translate-y-[-1px] transition-all duration-300 active:translate-y-0 active:shadow-[0_10px_22px_rgba(255,90,95,0.18)] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Submit OTP & Update
              </button>
              <button
                type="button"
                onClick={cancelForgotPassword}
                className="w-full bg-surface-container text-on-surface font-bold py-3.5 rounded-xl border border-outline-variant/30 hover:bg-surface-container-high transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {showVerify && (
          <div className="mt-8 p-4 bg-surface-container-low border border-outline-variant/30 rounded-xl space-y-4">
            <h4 className="text-sm font-bold">Verify your email to log in</h4>
            <p className="text-xs text-on-surface-variant">
              Enter the 6-digit OTP sent to <span className="font-semibold">{formData.email.trim().toLowerCase()}</span>.
            </p>
            <input
              className="w-full bg-white border border-outline-variant/40 rounded-lg px-3 py-3"
              placeholder="Enter OTP"
              value={verifyOtp}
              onChange={(e) => setVerifyOtp(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleVerifyLoginOtp}
                disabled={verifying}
                className="w-full bg-[#ff5a5f] text-white font-headline font-bold py-3.5 rounded-xl shadow-[0_14px_28px_rgba(255,90,95,0.22)] hover:shadow-[0_18px_34px_rgba(255,90,95,0.28)] hover:translate-y-[-1px] transition-all duration-300 active:translate-y-0 active:shadow-[0_10px_22px_rgba(255,90,95,0.18)] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {verifying ? 'Verifying...' : 'Verify'}
              </button>
              <button
                type="button"
                onClick={handleResendVerifyOtp}
                disabled={resending}
                className="w-full bg-surface-container text-on-surface font-bold py-3.5 rounded-xl border border-outline-variant/30 hover:bg-surface-container-high transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {resending ? 'Sending...' : 'Resend OTP'}
              </button>
            </div>
          </div>
        )}
        <footer className="mt-12 text-center">
        <p className="text-on-surface-variant text-sm font-medium">
                                Don't have an account? 
                                <Link className="text-primary font-bold hover:underline underline-offset-4 ml-1 transition-all" to="/signup">Sign Up</Link>
        </p>
        </footer>
        </div>
        </section>
      </main>
    </div>
  );
}

export default Login;
