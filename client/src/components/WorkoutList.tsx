import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getWorkouts, deleteWorkout } from '../api';
import type { Workout } from '../types';
import { Trash2, Play, Plus, Pencil, Search } from 'lucide-react';

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
			<div className="flex mb-8">
				<h1 className="flex-none text-3xl font-bold text-gray-800">My Workouts</h1>
				<div className="grow"></div>
				<Link
					to="/create"
					className="m-2 flex flex-none items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 hover:text-gray-900 transition font-medium"
				>
					<Plus size={20} /> <span className="hidden sm:inline">New Workout</span>
				</Link>
				<Link
					to="/browse"
					className="m-2 flex flex-none items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 hover:text-gray-900 transition font-medium"
				>
					<Search size={20} /> <span className="hidden sm:inline">Browse</span>
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
								className="flex items-center gap-2 bg-green-200 text-green-700 px-4 py-2 rounded-lg hover:bg-green-300 hover:text-green-900 transition font-medium"
							>
								<Play size={18} /> <span className="hidden sm:inline">Start</span>
							</Link>
							<Link
								to={`/edit/${workout.id}`}
								className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 hover:text-gray-900 transition font-medium"
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
