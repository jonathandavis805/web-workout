import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WorkoutList } from './components/WorkoutList';
import { WorkoutSetup } from './components/WorkoutSetup';
import { ActiveWorkout } from './components/ActiveWorkout';
import { AuthProvider, useAuth } from './AuthContext';

function AppContent() {
  const { user, loading, login } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-900">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Get in the Gruuve</h1>
          <p className="text-gray-600 mb-6">Sign in to manage your workouts</p>
          <button
            onClick={login}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Get in the Gruuve</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user.name}</span>
              <button
                onClick={() => window.location.href = '/logout'}
                className="text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<WorkoutList />} />
        <Route path="/create" element={<WorkoutSetup />} />
        <Route path="/edit/:id" element={<WorkoutSetup />} />
        <Route path="/workout/:id" element={<ActiveWorkout />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
