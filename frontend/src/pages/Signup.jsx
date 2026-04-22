import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: '' // empty initially to force selection
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyStep, setVerifyStep] = useState('idle'); // idle | otp
  const [verifyOtp, setVerifyOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleStep, setGoogleStep] = useState(false);
  const [googleData, setGoogleData] = useState({ name: '', email: '', dob: '', idToken: '', agreed: false });

  useEffect(() => {
    // Render Google button once Google script is loaded
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const render = () => {
      if (!window.google?.accounts?.id) return;
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              if (!formData.role) {
                toast.error('Please select whether you want to be a Guest or a Host first.');
                return;
              }
              const payload = JSON.parse(atob(response.credential.split('.')[1]));
              setGoogleData({
                name: payload.name || '',
                email: payload.email || '',
                dob: '',
                idToken: response.credential,
                agreed: false
              });
              setGoogleStep(true);
            } catch (err) {
              toast.error('Failed to parse Google credentials');
            }
          }
        });

        const el = document.getElementById('google-signup-btn');
        if (el && !el.dataset.rendered) {
          window.google.accounts.id.renderButton(el, {
            theme: 'outline',
            size: 'large',
            shape: 'pill',
            text: 'continue_with',
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
      if (document.getElementById('google-signup-btn')?.dataset.rendered === 'true') {
        clearInterval(t);
      }
    }, 250);
    return () => clearInterval(t);
  }, [formData.role, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleSelect = (role) => {
    setFormData({ ...formData, role });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.role) {
      toast.error('Please select whether you want to be a Guest or a Host.');
      return;
    }
    setLoading(true);

    try {
      const payload = {
        ...formData,
        email: formData.email.trim().toLowerCase()
      };
      await axios.post('/api/auth/register', payload);
      toast.success('OTP sent. Verify your email to activate your account.');
      setVerifyStep('otp');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setGoogleData({ ...googleData, [e.target.name]: value });
  };

  const handleGoogleSubmit = async (e) => {
    e.preventDefault();
    if (!googleData.agreed) {
      toast.error('You must agree to the Terms and Conditions');
      return;
    }
    if (!googleData.dob) {
      toast.error('Please provide your Date of Birth');
      return;
    }
    setGoogleLoading(true);
    try {
      const res = await axios.post('/api/auth/google-register', {
        idToken: googleData.idToken,
        role: formData.role,
        name: googleData.name,
        dob: googleData.dob
      });
      if (res.data.requiresOtp) {
        setFormData((prev) => ({ ...prev, email: res.data.email }));
        toast.success(res.data.message || 'OTP sent. Verify your email to activate account.');
        setVerifyStep('otp');
        setGoogleStep(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Google signup failed');
      setGoogleStep(false);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
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

  const handleResendOtp = async () => {
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
        
        {/* Right Side: Signup Form Section */}
        <section className="flex-grow flex items-center justify-center p-8 md:p-12 lg:p-24 bg-surface-container-lowest">
          <div className="w-full max-w-md">
            {/* Mobile Branding */}
            <div className="md:hidden mb-12">
              <h1 className="text-primary font-headline text-2xl font-bold tracking-tighter">BOOKMYSTAY</h1>
            </div>
            <header className="mb-12">
              <h2 className="font-headline text-3xl font-extrabold text-on-surface mb-3 tracking-tight">Create an account</h2>
              <p className="text-on-surface-variant text-sm">Please join our sanctuary of luxury travelers.</p>
            </header>

            {/* Google Signup */}
            {!googleStep ? (
              <>
                <div className="mb-8">
                  {!formData.role ? (
                    <div className="text-xs text-on-surface-variant">
                      Select Guest/Host first to continue with Google.
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <div id="google-signup-btn" className={googleLoading ? 'opacity-60 pointer-events-none' : ''}></div>
                    </div>
                  )}
                </div>

            {/* Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 font-label">How do you want to use BookMyStay?</label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => handleRoleSelect('guest')}
                    className={"p-4 border-2 rounded-xl cursor-pointer text-center transition-all " + (formData.role === 'guest' ? 'border-[#ff5a5f] bg-[#ff5a5f]/10 shadow-[0_0_15px_rgba(255,90,95,0.2)]' : 'border-outline-variant/30 bg-surface-container-low hover:bg-surface-container')}
                  >
                    <div className={"text-lg font-bold font-headline " + (formData.role === 'guest' ? 'text-[#ff5a5f]' : 'text-on-surface-variant')}>Guest</div>
                    <div className="text-xs text-outline font-label mt-1">Book stays</div>
                  </div>
                  <div 
                    onClick={() => handleRoleSelect('host')}
                    className={"p-4 border-2 rounded-xl cursor-pointer text-center transition-all " + (formData.role === 'host' ? 'border-[#ff5a5f] bg-[#ff5a5f]/10 shadow-[0_0_15px_rgba(255,90,95,0.2)]' : 'border-outline-variant/30 bg-surface-container-low hover:bg-surface-container')}
                  >
                    <div className={"text-lg font-bold font-headline " + (formData.role === 'host' ? 'text-[#ff5a5f]' : 'text-on-surface-variant')}>Host</div>
                    <div className="text-xs text-outline font-label mt-1">List properties</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 font-label" htmlFor="name">Full Name</label>
                <input 
                  className="w-full bg-surface-container-low border-0 rounded-xl px-4 py-4 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/10 transition-all" 
                  id="name" 
                  name="name"
                  placeholder="John Doe" 
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

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
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 font-label" htmlFor="password">Password</label>
                <div className="relative">
                  <input 
                    className="w-full bg-surface-container-low border-0 rounded-xl px-4 py-4 pr-14 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/10 transition-all" 
                    id="password" 
                    name="password"
                    placeholder="At least 6 characters" 
                    type={showPassword ? 'text' : 'password'}
                    minLength="6"
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

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 font-label" htmlFor="phone">Phone Number (Optional)</label>
                <input 
                  className="w-full bg-surface-container-low border-0 rounded-xl px-4 py-4 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/10 transition-all" 
                  id="phone" 
                  name="phone"
                  placeholder="+1 (234) 567-8900" 
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="relative flex items-center justify-center my-8">
                <div className="w-full h-px bg-outline-variant/15"></div>
              </div>

              <button className="w-full bg-[#ff5a5f] text-white font-headline font-bold py-5 rounded-xl shadow-[0_20px_40px_rgba(255,90,95,0.25)] hover:shadow-none hover:translate-y-0.5 transition-all active:scale-95 duration-300 disabled:opacity-70 disabled:cursor-not-allowed" type="submit" disabled={loading}>
                {loading ? 'Creating Account...' : 'Agree and continue'}
              </button>
            </form>
            </>
            ) : (
              <form className="space-y-6" onSubmit={handleGoogleSubmit}>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 font-label">Legal Name</label>
                  <input
                    className="w-full bg-surface-container-low border-0 rounded-xl px-4 py-4 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/10 transition-all"
                    name="name"
                    type="text"
                    value={googleData.name}
                    onChange={handleGoogleChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 font-label">Date of Birth</label>
                  <input
                    className="w-full bg-surface-container-low border-0 rounded-xl px-4 py-4 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/10 transition-all"
                    name="dob"
                    type="date"
                    value={googleData.dob}
                    onChange={handleGoogleChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 font-label">Email (Uneditable)</label>
                  <input
                    className="w-full bg-surface-container-low border-0 rounded-xl px-4 py-4 text-on-surface/50 cursor-not-allowed transition-all"
                    name="email"
                    type="email"
                    value={googleData.email}
                    readOnly
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    className="w-5 h-5 rounded border-outline-variant/30 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                    id="agreed"
                    name="agreed"
                    type="checkbox"
                    checked={googleData.agreed}
                    onChange={handleGoogleChange}
                    required
                  />
                  <label className="text-sm text-on-surface-variant font-medium select-none cursor-pointer" htmlFor="agreed">
                    I agree to the Terms and Conditions
                  </label>
                </div>
                <button className="w-full bg-[#ff5a5f] text-white font-headline font-bold py-5 rounded-xl shadow-[0_20px_40px_rgba(255,90,95,0.25)] hover:shadow-none hover:translate-y-0.5 transition-all active:scale-95 duration-300 disabled:opacity-70 disabled:cursor-not-allowed" type="submit" disabled={googleLoading}>
                  {googleLoading ? 'Processing...' : 'Agree and continue'}
                </button>
              </form>
            )}

            {verifyStep === 'otp' && (
              <div className="mt-8 p-4 bg-surface-container-low border border-outline-variant/30 rounded-xl space-y-4">
                <h4 className="text-sm font-bold">Verify your email</h4>
                <p className="text-xs text-on-surface-variant">
                  We sent a 6-digit OTP to <span className="font-semibold">{formData.email.trim().toLowerCase()}</span>.
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
                    onClick={handleVerifyOtp}
                    disabled={verifying}
                    className="w-full bg-[#ff5a5f] text-white font-headline font-bold py-3.5 rounded-xl shadow-[0_14px_28px_rgba(255,90,95,0.22)] hover:shadow-[0_18px_34px_rgba(255,90,95,0.28)] hover:translate-y-[-1px] transition-all duration-300 active:translate-y-0 active:shadow-[0_10px_22px_rgba(255,90,95,0.18)] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {verifying ? 'Verifying...' : 'Verify'}
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
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
                Already have an account? 
                <Link className="text-primary font-bold hover:underline underline-offset-4 ml-1 transition-all" to="/login">Sign In</Link>
              </p>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Signup;
