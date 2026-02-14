import random
from datetime import datetime, timedelta
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db, Workout, WorkoutCompletion, User


def generate_mock_data(user_id: int, num_days: int = 365, workouts_per_week: int = 4):
    with app.app_context():
        user = User.query.get(user_id)
        if not user:
            print(f"User with id {user_id} not found")
            return

        workouts = Workout.query.filter_by(user_id=user_id).all()
        if not workouts:
            print(
                f"No workouts found for user {user_id}. Creating a default workout..."
            )
            workout = Workout(
                name="Quick HIIT", user_id=user_id, circuits=3, is_public=False
            )
            db.session.add(workout)
            db.session.flush()

            exercises = [
                ("Jumping Jacks", 30),
                ("Squats", 30),
                ("Push-ups", 30),
                ("Plank", 30),
                ("Burpees", 30),
            ]
            for i, (name, duration) in enumerate(exercises):
                ex = Exercise(
                    name=name, duration=duration, order=i, workout_id=workout.id
                )
                db.session.add(ex)
            db.session.commit()
            workouts = [workout]

        from app import Exercise

        today = datetime.utcnow()
        start_date = today - timedelta(days=num_days)

        completions_created = 0

        current_date = start_date
        while current_date <= today:
            if random.random() < (workouts_per_week / 7):
                for workout in workouts:
                    if random.random() < 0.7:
                        hour = random.randint(6, 20)
                        minute = random.randint(0, 59)
                        completed_at = current_date.replace(hour=hour, minute=minute)

                        duration = sum(ex.duration for ex in workout.exercises) * (
                            workout.circuits or 1
                        )

                        completion = WorkoutCompletion(
                            user_id=user_id,
                            workout_id=workout.id,
                            completed_at=completed_at,
                            duration_seconds=duration,
                        )
                        db.session.add(completion)
                        completions_created += 1

            current_date += timedelta(days=1)

        db.session.commit()
        print(f"Created {completions_created} workout completions for user {user_id}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python seed_data.py <user_id> [days] [workouts_per_week]")
        print("  user_id: The user ID to seed data for")
        print("  days: Number of days to generate data for (default: 365)")
        print("  workouts_per_week: Average workouts per week (default: 4)")
        sys.exit(1)

    user_id = int(sys.argv[1])
    num_days = int(sys.argv[2]) if len(sys.argv) > 2 else 365
    workouts_per_week = int(sys.argv[3]) if len(sys.argv) > 3 else 4

    generate_mock_data(user_id, num_days, workouts_per_week)
