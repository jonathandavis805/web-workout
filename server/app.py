from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os

# Define the absolute path to the static folder
basedir = os.path.abspath(os.path.dirname(__file__))
static_folder = os.path.join(basedir, 'static')

app = Flask(__name__, static_folder=static_folder)
CORS(app)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'workouts.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Models
class Workout(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    spotify_url = db.Column(db.String(200), nullable=True)
    exercises = db.relationship('Exercise', backref='workout', cascade='all, delete-orphan', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'spotifyUrl': self.spotify_url,
            'exercises': [ex.to_dict() for ex in self.exercises]
        }

class Exercise(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    workout_id = db.Column(db.Integer, db.ForeignKey('workout.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    duration = db.Column(db.Integer, nullable=False)
    order = db.Column(db.Integer, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'duration': self.duration,
            'order': self.order
        }

# API Routes
@app.route('/api/workouts', methods=['GET'])
def get_workouts():
    workouts = Workout.query.all()
    return jsonify([w.to_dict() for w in workouts])

@app.route('/api/workouts/<int:id>', methods=['GET'])
def get_workout(id):
    workout = Workout.query.get_or_404(id)
    return jsonify(workout.to_dict())

@app.route('/api/workouts', methods=['POST'])
def create_workout():
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({'error': 'Name is required'}), 400
    
    new_workout = Workout(name=data['name'], spotify_url=data.get('spotifyUrl'))
    db.session.add(new_workout)
    db.session.flush()
    
    if 'exercises' in data:
        for index, ex_data in enumerate(data['exercises']):
            new_exercise = Exercise(
                workout_id=new_workout.id,
                name=ex_data.get('name', 'Exercise'),
                duration=ex_data.get('duration', 30),
                order=index
            )
            db.session.add(new_exercise)
            
    db.session.commit()
    return jsonify(new_workout.to_dict()), 201

@app.route('/api/workouts/<int:id>', methods=['PUT'])
def update_workout(id):
    workout = Workout.query.get_or_404(id)
    data = request.get_json()

    if not data or 'name' not in data:
        return jsonify({'error': 'Name is required'}), 400

    workout.name = data['name']
    workout.spotify_url = data.get('spotifyUrl')

    workout.exercises = []
    if 'exercises' in data:
        for index, ex_data in enumerate(data['exercises']):
            new_exercise = Exercise(
                name=ex_data.get('name', 'Exercise'),
                duration=ex_data.get('duration', 30),
                order=index
            )
            workout.exercises.append(new_exercise)
            
    db.session.commit()
    return jsonify(workout.to_dict())

@app.route('/api/workouts/<int:id>', methods=['DELETE'])
def delete_workout(id):
    workout = Workout.query.get_or_404(id)
    db.session.delete(workout)
    db.session.commit()
    return jsonify({'message': 'Workout deleted'})

# Catch-all route to serve the React App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # If the file exists in the static folder, serve it
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    # Otherwise, serve index.html (client-side routing)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=False, host='0.0.0.0', port=5000)
