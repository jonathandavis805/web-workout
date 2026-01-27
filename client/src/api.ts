import type { Workout, User } from './types';

const API_URL = '/api';

export const getWorkouts = async (): Promise<Workout[]> => {
  const response = await fetch(`${API_URL}/workouts`);
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
