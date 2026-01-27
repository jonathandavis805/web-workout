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
}
