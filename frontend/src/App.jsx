import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Words from './pages/Words';
import Quiz from './pages/Quiz';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Wordle from './pages/Wordle';
import WordChain from './pages/WordChain';

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main className="container" style={{ paddingTop: '1.5rem', paddingBottom: '2rem' }}>
        {children}
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/words" element={<ProtectedRoute><Layout><Words /></Layout></ProtectedRoute>} />
        <Route path="/quiz" element={<ProtectedRoute><Layout><Quiz /></Layout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
        <Route path="/wordle" element={<ProtectedRoute><Layout><Wordle /></Layout></ProtectedRoute>} />
        <Route path="/wordchain" element={<ProtectedRoute><Layout><WordChain /></Layout></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
