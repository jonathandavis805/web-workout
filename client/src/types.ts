export interface User {
  id: number;
  email: string;
  name: string;
}

export interface Exercise {
  id?: number;
  name: string;
  duration: number;
  order: number;
}

export interface Workout {
  id?: number;
  name: string;
  exercises: Exercise[];
  spotifyUrl?: string;
  circuits?: number;
  isPublic?: boolean;
}

export interface WorkoutCompletion {
  id: number;
  workout_id: number;
  completed_at: string;
  duration_seconds: number;
  workout_name?: string;
}
