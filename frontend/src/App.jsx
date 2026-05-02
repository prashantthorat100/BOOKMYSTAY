import { Routes, Route } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { API_BASE_URL } from './utils/api';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import PropertyDetail from './pages/PropertyDetail';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import HostDashboard from './pages/HostDashboard';
import HostOnboarding from './pages/HostOnboarding';
import AddProperty from './pages/AddProperty';
import EditProperty from './pages/EditProperty';
import Inbox from './pages/Inbox';
import MyBookings from './pages/MyBookings';
import MyFavourites from './pages/MyFavourites';

axios.defaults.baseURL = API_BASE_URL;

// Global HTTP Response Interceptor for Token Expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const msg = error.response.data?.error || '';
      // If the backend specifically complains about the token
      if (msg.toLowerCase().includes('token') || error.response.status === 401) {
        if (localStorage.getItem('token')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          if (window.location.pathname !== '/login') {
            toast.error('Your session expired. Please log in again.', { id: 'session-expire' });
            setTimeout(() => {
              window.location.href = '/login';
            }, 1000);
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

function App() {
  return (
    <div className="App" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/host/onboarding" element={<HostOnboarding />} />
        <Route path="/host/dashboard" element={<HostDashboard />} />
        <Route path="/host/add-property" element={<AddProperty />} />
        <Route path="/host/edit-property/:id" element={<EditProperty />} />
        <Route path="/favourites" element={<MyFavourites />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
