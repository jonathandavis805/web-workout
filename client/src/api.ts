import type { Workout, User, WorkoutCompletion, TvDevice } from './types';

const API_URL = '/api';

export const getWorkouts = async (): Promise<Workout[]> => {
  const response = await fetch(`${API_URL}/workouts`);
  if (!response.ok) throw new Error('Failed to fetch workouts');
  return response.json();
};
export const getPublicWorkouts = async (): Promise<Workout[]> => {
  const response = await fetch(`${API_URL}/public/workouts`);
  if (!response.ok) throw new Error('Failed to fetch workouts');
  return response.json();
};

export const getWorkout = async (id: number): Promise<Workout> => {
  const response = await fetch(`${API_URL}/workouts/${id}`);
  if (!response.ok) throw new Error('Failed to fetch workout');
  return response.json();
};

export const createWorkout = async (workout: Workout): Promise<Workout> => {
  const response = await fetch(`${API_URL}/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workout),
  });
  if (!response.ok) throw new Error('Failed to create workout');
  return response.json();
};

export const updateWorkout = async (id: number, workout: Workout): Promise<Workout> => {
  const response = await fetch(`${API_URL}/workouts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workout),
  });
  if (!response.ok) throw new Error('Failed to update workout');
  return response.json();
};

export const deleteWorkout = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/workouts/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete workout');
};

export const getSpotifyStatus = async () => {
  const response = await fetch(`${API_URL}/spotify/status`);
  return response.json();
};

export const getSpotifyLoginUrl = async () => {
  const response = await fetch(`${API_URL}/spotify/login`);
  return response.json();
};

export const getSpotifyPlaylist = async () => {
  const response = await fetch(`${API_URL}/spotify/playlist`);
  if (!response.ok) return null;
  return response.json();
};

// Authentication functions
export const getUser = async (): Promise<User | null> => {
  try {
    const response = await fetch(`${API_URL}/user`);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
};

export const login = () => {
  window.location.href = '/login';
};

export const logout = () => {
  window.location.href = '/logout';
};

export const completeWorkout = async (id: number, durationSeconds?: number): Promise<WorkoutCompletion> => {
  const response = await fetch(`${API_URL}/workouts/${id}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ duration_seconds: durationSeconds }),
  });
  if (!response.ok) throw new Error('Failed to complete workout');
  return response.json();
};

export const getWorkoutCompletions = async (): Promise<WorkoutCompletion[]> => {
  const response = await fetch(`${API_URL}/workout-completions`);
  if (!response.ok) throw new Error('Failed to fetch workout completions');
  return response.json();
};

export const claimTvCode = async (code: string): Promise<void> => {
  const response = await fetch(`${API_URL}/tv/pair/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) throw new Error('Failed to pair TV');
};

export const getTvDevices = async (): Promise<TvDevice[]> => {
  const response = await fetch(`${API_URL}/tv/devices`);
  if (!response.ok) throw new Error('Failed to fetch TVs');
  return response.json();
};

export const unpairTvDevice = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/tv/devices/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to unpair TV');
};
