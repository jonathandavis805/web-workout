import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createWorkout, getWorkout, updateWorkout } from '../api';
import type { Exercise } from '../types';
import { Plus, X, Save, ArrowLeft } from 'lucide-react';

export const WorkoutSetup = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState('');
  // const [spotifyUrl, setSpotifyUrl] = useState('');
  const [circuits, setCircuits] = useState(1);
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: '', duration: 30, order: 0 }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      getWorkout(parseInt(id))
        .then(data => {
          setName(data.name);
          // setSpotifyUrl(data.spotifyUrl || '');
          setExercises(data.exercises.sort((a, b) => a.order - b.order));
	  setCircuits(data.circuits ?? 1);
        })
        .catch(error => {
          console.error(error);
          alert('Failed to load workout');
          navigate('/');
        })
        .finally(() => setLoading(false));
    }
  }, [id, navigate]);

  const addExercise = () => {
    setExercises([
      ...exercises,
      { name: '', duration: 30, order: exercises.length }
    ]);
  };

  const removeExercise = (index: number) => {
    const newExercises = exercises.filter((_, i) => i !== index);
    setExercises(newExercises.map((ex, i) => ({ ...ex, order: i })));
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string | number) => {
    const newExercises = [...exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setExercises(newExercises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('Please enter a workout name');
    if (exercises.length === 0) return alert('Please add at least one exercise');

    try {
      const workoutData = { name, circuits, exercises };
      if (id) {
        await updateWorkout(parseInt(id), workoutData);
      } else {
        await createWorkout(workoutData);
      }
      navigate('/');
    } catch (error) {
      console.error(error);
      alert('Failed to save workout');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading workout data...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6"
      >
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {id ? 'Edit Workout' : 'Create New Workout'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Workout Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="e.g., Morning Cardio Circuit"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default Circuit Count</label>
            <input
              type="number"
              value={circuits}
              onChange={(e) => setCircuits(parseInt(e.target.value))}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1DB954] focus:border-[#1DB954] outline-none transition"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Exercises</h2>
            <button
              type="button"
              onClick={addExercise}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus size={18} /> Add Exercise
            </button>
          </div>

          {exercises.map((exercise, index) => (
            <div key={index} className="flex gap-4 items-start bg-gray-50 p-4 rounded-lg border border-gray-200">
              <span className="mt-3 text-gray-400 font-mono w-6">{index + 1}.</span>
              <div className="flex-1 space-y-3">
                <input
                  type="text"
                  value={exercise.name}
                  onChange={(e) => updateExercise(index, 'name', e.target.value)}
                  className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="Exercise Name (e.g., Pushups)"
                  required
                />
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-500">Duration (sec):</label>
                  <input
                    type="number"
                    value={exercise.duration}
                    onChange={(e) => updateExercise(index, 'duration', parseInt(e.target.value) || 0)}
                    className="w-24 px-3 py-2 rounded border border-gray-300 focus:ring-1 focus:ring-blue-500 outline-none"
                    min="1"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeExercise(index)}
                className="p-2 text-gray-400 hover:text-red-500 transition"
              >
                <X size={20} />
              </button>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <Save size={24} /> {id ? 'Update Workout' : 'Save Workout'}
          </button>
        </div>
      </form>
    </div>
  );
};
