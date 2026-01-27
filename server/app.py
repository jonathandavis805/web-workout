from flask import (
    Flask,
    request,
    jsonify,
    send_from_directory,
    redirect,
    url_for,
    session,
)
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_login import (
    LoginManager,
    UserMixin,
    login_user,
    logout_user,
    login_required,
    current_user,
)
from authlib.integrations.flask_client import OAuth
import os
from dotenv import load_dotenv

load_dotenv()

# Define the absolute path to the static folder
basedir = os.path.abspath(os.path.dirname(__file__))
static_folder = os.path.join(basedir, "static")

app = Flask(__name__, static_folder=static_folder)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-key-change-in-production")
if server_name := os.getenv("SERVER_NAME"):
    app.config["SERVER_NAME"] = server_name
CORS(app, supports_credentials=True)

# Session Configuration
app.config["SESSION_TYPE"] = "filesystem"

# Database Configuration
db_path = os.path.join(basedir, "../data/workouts.db")
# Ensure the directory exists
os.makedirs(os.path.dirname(db_path), exist_ok=True)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + db_path
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# Flask-Login setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

# OAuth setup
oauth = OAuth(app)

# OIDC Configuration (using Google as example provider)
oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


# Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    oauth_provider = db.Column(db.String(50), nullable=False)
    oauth_id = db.Column(db.String(100), nullable=False)
    workouts = db.relationship(
        "Workout", backref="user", cascade="all, delete-orphan", lazy=True
    )

    @staticmethod
    def get_or_create(oauth_info, provider):
        user = User.query.filter_by(
            oauth_provider=provider, oauth_id=oauth_info["sub"]
        ).first()

        if not user:
            user = User(
                email=oauth_info["email"],
                name=oauth_info["name"],
                oauth_provider=provider,
                oauth_id=oauth_info["sub"],
            )
            db.session.add(user)
            db.session.commit()

        return user

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
        }


class Workout(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    spotify_url = db.Column(db.String(200), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    exercises = db.relationship(
        "Exercise", backref="workout", cascade="all, delete-orphan", lazy=True
    )
    circuits = db.Column(db.Integer, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "spotifyUrl": self.spotify_url,
            "exercises": [ex.to_dict() for ex in self.exercises],
            "circuits": self.circuits,
        }


class Exercise(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    workout_id = db.Column(db.Integer, db.ForeignKey("workout.id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    duration = db.Column(db.Integer, nullable=False)
    order = db.Column(db.Integer, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "duration": self.duration,
            "order": self.order,
        }


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# Authentication Routes
@app.route("/login")
def login():
    redirect_uri = url_for("authorize", _external=True)
    return oauth.google.authorize_redirect(redirect_uri)


@app.route("/authorize")
def authorize():
    token = oauth.google.authorize_access_token()
    user_info = token.get("userinfo")
    if user_info:
        user = User.get_or_create(user_info, "google")
        login_user(user)
        session["user"] = user.to_dict()
        return redirect("/")
    return "Authentication failed", 400


@app.route("/logout")
def logout():
    logout_user()
    session.clear()
    return redirect("/")


@app.route("/api/user")
@login_required
def get_user():
    return jsonify(current_user.to_dict())


# API Routes
@app.route("/api/workouts", methods=["GET"])
@login_required
def get_workouts():
    workouts = Workout.query.filter_by(user_id=current_user.id).all()
    return jsonify([w.to_dict() for w in workouts])


@app.route("/api/workouts/<int:id>", methods=["GET"])
@login_required
def get_workout(id):
    workout = Workout.query.filter_by(id=id, user_id=current_user.id).first_or_404()
    return jsonify(workout.to_dict())


@app.route("/api/workouts", methods=["POST"])
@login_required
def create_workout():
    data = request.get_json()
    if not data or "name" not in data:
        return jsonify({"error": "Name is required"}), 400

    new_workout = Workout(
        name=data["name"], spotify_url=data.get("spotifyUrl"), user_id=current_user.id, circuits=data["circuits"],
    )
    db.session.add(new_workout)
    db.session.flush()

    if "exercises" in data:
        for index, ex_data in enumerate(data["exercises"]):
            new_exercise = Exercise(
                name=ex_data.get("name", "Exercise"),
                duration=ex_data.get("duration", 30),
                order=index,
                workout_id=new_workout.id,
            )
            db.session.add(new_exercise)

    db.session.commit()
    return jsonify(new_workout.to_dict()), 201


@app.route("/api/workouts/<int:id>", methods=["PUT"])
@login_required
def update_workout(id):
    workout = Workout.query.filter_by(id=id, user_id=current_user.id).first_or_404()
    data = request.get_json()

    if not data or "name" not in data:
        return jsonify({"error": "Name is required"}), 400

    workout.name = data["name"]
    workout.spotify_url = data.get("spotifyUrl")
    workout.circuits = data.get("circuits")

    # Clear existing exercises
    Exercise.query.filter_by(workout_id=id).delete()

    if "exercises" in data:
        for index, ex_data in enumerate(data["exercises"]):
            new_exercise = Exercise(
                name=ex_data.get("name", "Exercise"),
                duration=ex_data.get("duration", 30),
                order=index,
                workout_id=id,
            )
            db.session.add(new_exercise)

    db.session.commit()
    return jsonify(workout.to_dict())


@app.route("/api/workouts/<int:id>", methods=["DELETE"])
@login_required
def delete_workout(id):
    workout = Workout.query.filter_by(id=id, user_id=current_user.id).first_or_404()
    db.session.delete(workout)
    db.session.commit()
    return jsonify({"message": "Workout deleted"})


# Catch-all route to serve the React App
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    # If the file exists in the static folder, serve it
    if (
        path != ""
        and app.static_folder
        and os.path.exists(os.path.join(app.static_folder, path))
    ):
        return send_from_directory(app.static_folder, path)
    # Otherwise, serve index.html (client-side routing)
    else:
        return send_from_directory(app.static_folder or "static", "index.html")


if __name__ == "__main__":
    # Ensure database directory exists
    db_path = os.path.join(basedir, "workouts.db")
    os.makedirs(os.path.dirname(db_path), exist_ok=True)

    with app.app_context():
        db.create_all()
    app.run(debug=False, host="0.0.0.0", port=5000)
