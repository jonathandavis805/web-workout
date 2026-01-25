import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WorkoutList } from './components/WorkoutList';
import { WorkoutSetup } from './components/WorkoutSetup';
import { ActiveWorkout } from './components/ActiveWorkout';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <Routes>
          <Route path="/" element={<WorkoutList />} />
          <Route path="/create" element={<WorkoutSetup />} />
          <Route path="/edit/:id" element={<WorkoutSetup />} />
          <Route path="/workout/:id" element={<ActiveWorkout />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;