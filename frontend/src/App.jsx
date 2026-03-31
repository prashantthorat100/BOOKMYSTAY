import { Routes, Route } from 'react-router-dom';
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

import { Toaster } from 'react-hot-toast';

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
        <Route path="/host/onboarding" element={<HostOnboarding />} />
        <Route path="/host/dashboard" element={<HostDashboard />} />
        <Route path="/host/add-property" element={<AddProperty />} />
        <Route path="/host/edit-property/:id" element={<EditProperty />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
