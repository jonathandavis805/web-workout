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
}
