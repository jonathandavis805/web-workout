import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getWorkouts, deleteWorkout } from '../api';
import type { Workout } from '../types';
import { Trash2, Play, Plus, Pencil } from 'lucide-react';

export const WorkoutList = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      const data = await getWorkouts();
      setWorkouts(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this workout?')) {
      await deleteWorkout(id);
      loadWorkouts();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Workouts</h1>
        <Link
          to="/create"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition sm:px-2"
        >
          <Plus size={20} /> <span className="hidden sm:inline">New Workout</span>
        </Link>
      </div>

      <div className="grid gap-4">
        {workouts.map((workout) => (
          <div
            key={workout.id}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition"
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{workout.name}</h2>
              <p className="text-gray-500">{workout.exercises.length} exercises</p>
            </div>
            <div className="flex gap-3">
              <Link
                to={`/workout/${workout.id}`}
                className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition font-medium"
              >
                <Play size={18} /> <span className="hidden sm:inline">Start</span>
              </Link>
              <Link
                to={`/edit/${workout.id}`}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                <Pencil size={18} /> <span className="hidden sm:inline">Edit</span>
              </Link>
              <button
                onClick={() => workout.id && handleDelete(workout.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
        {workouts.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No workouts found. Create your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
};
