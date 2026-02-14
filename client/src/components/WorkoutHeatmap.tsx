import { useEffect, useState, useRef } from 'react';
import { getWorkoutCompletions } from '../api';
import type { WorkoutCompletion } from '../types';

interface DayData {
	date: string;
	count: number;
	hasWorkout: boolean;
}

const generateHeatmapData = (completions: WorkoutCompletion[]): DayData[] => {
	const data: { [key: string]: number } = {};
	const today = new Date();

	const endTime = today.getTime();
	const startTime = endTime - (364 * 24 * 60 * 60 * 1000);

	for (let i = 0; i <= 364; i++) {
		const time = startTime + (i * 24 * 60 * 60 * 1000);
		const date = new Date(time);
		const dateStr = date.toISOString().split('T')[0];
		data[dateStr] = 0;
	}

	completions.forEach(completion => {
		const date = new Date(completion.completed_at).toISOString().split('T')[0];
		if (Object.prototype.hasOwnProperty.call(data, date)) {
			data[date] = (data[date] || 0) + 1;
		}
	});

	const sortedDates = Object.keys(data).sort();
	return sortedDates.map(date => ({
		date,
		count: data[date],
		hasWorkout: data[date] > 0
	}));
};

const CELL_SIZE = 20;

export const WorkoutHeatmap = () => {
	const [data, setData] = useState<DayData[]>([]);
	const containerRef = useRef<HTMLDivElement>(null);
	const [weeksToShow, setWeeksToShow] = useState(52);

	useEffect(() => {
		const loadData = async () => {
			try {
				const completions = await getWorkoutCompletions();
				const heatmapData = generateHeatmapData(completions);
				setData(heatmapData);
			} catch (error) {
				console.error('Failed to load workout completions:', error);
			}
		};
		loadData();
	}, []);

	useEffect(() => {
		const updateWeeksToShow = () => {
			if (!containerRef.current) return;

			const CELL_GAP = 3;
			const LABEL_WIDTH = 24;
			const availableWidth = containerRef.current.offsetWidth - LABEL_WIDTH;
			const weeksThatFit = Math.floor(availableWidth / (CELL_SIZE + CELL_GAP));

			setWeeksToShow(Math.min(52, Math.max(4, weeksThatFit)));
		};

		updateWeeksToShow();
		window.addEventListener('resize', updateWeeksToShow);
		return () => window.removeEventListener('resize', updateWeeksToShow);
	}, []);

	const getIntensityClass = (count: number) => {
		if (count === 0) return 'bg-gray-100';
		return 'bg-green-800';
	};

	const formatTooltip = (day: DayData) => {
		const date = new Date(day.date);
		const formatted = date.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
		return `${formatted}: ${day.count} workout${day.count !== 1 ? 's' : ''}`;
	};

	const getWeeks = () => {
		const weeks: DayData[][] = [];
		let currentWeek: DayData[] = [];

		data.forEach((day, index) => {
			const date = new Date(day.date);
			const dayOfWeek = date.getDay();

			if (index === 0) {
				for (let i = 0; i < dayOfWeek; i++) {
					currentWeek.push({ date: '', count: 0, hasWorkout: false });
				}
			}

			currentWeek.push(day);

			if (dayOfWeek === 6) {
				weeks.push(currentWeek);
				currentWeek = [];
			}
		});

		if (currentWeek.length > 0) {
			weeks.push(currentWeek);
		}

		return weeks;
	};

	const allWeeks = getWeeks();
	const displayWeeks = allWeeks.slice(-weeksToShow);
	const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];


	return (
		<div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
			<h2 className="text-lg font-semibold text-gray-900 mb-3">Workout Activity</h2>
			<div ref={containerRef} className="flex">
				<div className="flex flex-col gap-[2px] mr-1">
					{weekDays.map((day, index) => (
						<div
							key={day}
							className="text-[10px] text-gray-500 flex items-center"
							style={{ height: CELL_SIZE }}
						>
							{index % 2 === 0 ? day : ''}
						</div>
					))}
				</div>

				<div className="flex gap-[2px]">
					{displayWeeks.map((week, weekIndex) => (
						<div key={weekIndex} className="flex flex-col gap-[2px]">
							{week.map((day, dayIndex) => {
								if (!day.date) {
									return <div key={dayIndex} style={{ width: CELL_SIZE, height: CELL_SIZE }} />;
								}
								return (
									<div
										key={day.date}
										className={`rounded-sm ${getIntensityClass(day.count)} w-[20px] h-[20px] border border-gray-200`}
										// style={{}}
										title={formatTooltip(day)}
									/>
								);
							})}
						</div>
					))}
				</div>
			</div>

			<div className="flex items-center gap-1.5 mt-3 text-xs text-gray-600">
				<div className="flex gap-[2px]">
					<div className="bg-green-800 border border-gray-200 rounded-sm" style={{ width: CELL_SIZE, height: CELL_SIZE }} />
				</div>
				<span>Workout Completed</span>
			</div>
		</div>
	);
};
