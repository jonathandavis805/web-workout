import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPublicWorkouts } from "../api";
import type { Workout } from "../types";
import {  ArrowLeft, Play } from "lucide-react";

export const PublicWorkoutList = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      const data = await getPublicWorkouts();
      setWorkouts(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <Link to="/" className="text-gray-800 hover:text-white transition p-2">
          <ArrowLeft />
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Browse Workouts</h1>
      </div>

      <div className="grid gap-4">
        {workouts.map((workout) => (
          <div
            key={workout.id}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition"
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {workout.name}
              </h2>
              <p className="text-gray-500">
                {workout.exercises.length} exercises
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to={`/workout/${workout.id}`}
                className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition font-medium"
              >
                <Play size={18} />{" "}
                <span className="hidden sm:inline">Start</span>
              </Link>
            </div>
          </div>
        ))}
        {workouts.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">
              No workouts found. Create your first one!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
