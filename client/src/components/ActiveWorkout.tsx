import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getWorkout } from '../api';
import type { Workout } from '../types';
import { Play, Pause, RotateCcw, ArrowLeft, CheckCircle } from 'lucide-react';
import { SpotifyEmbed } from './SpotifyEmbed';

export const ActiveWorkout = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [circuitIndex, setCircuitIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const wakeLockRef = useRef<any>(null);

  // Wake Lock Logic - Now relies on a Secure Context (HTTPS)
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isActive) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (err: any) {
          console.error(`Wake Lock failed: ${err.name}, ${err.message}`);
        }
      }
    };

    if (isActive) {
      requestWakeLock();
    } else {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    }

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, [isActive]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (wakeLockRef.current !== null && document.visibilityState === 'visible' && isActive) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (err: any) {
          console.error(err);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive]);

  useEffect(() => {
    if (id) {
      getWorkout(parseInt(id)).then(data => {
        setWorkout(data);
        if (data.exercises.length > 0) {
          setTimeLeft(data.exercises[0].duration);
        }
      }).catch(console.error);
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [id]);

  useEffect(() => {
    let interval: any;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handleExerciseComplete();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const playBeep = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext();
        }
        
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        const ctx = audioContextRef.current;
        
        [0, 0.2, 0.4].forEach((delay) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'square';
            osc.frequency.setValueAtTime(delay === 0.4 ? 880 : 660, ctx.currentTime + delay);
            gain.gain.setValueAtTime(0, ctx.currentTime + delay);
            gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + delay + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.15);
            osc.start(ctx.currentTime + delay);
            osc.stop(ctx.currentTime + delay + 0.2);
        });
    } catch (e) {
        console.error("Audio play failed", e);
    }
  };

  const handleExerciseComplete = () => {
    playBeep();
    if (workout && currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setTimeLeft(workout.exercises[currentExerciseIndex + 1].duration);
    } else if(workout && workout.circuits && circuitIndex < workout.circuits) {
	setCircuitIndex(circuitIndex + 1)
    } else {
      setIsActive(false);
      setIsFinished(true);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetWorkout = () => {
    setIsActive(false);
    setIsFinished(false);
    setCurrentExerciseIndex(0);
    if (workout && workout.exercises.length > 0) {
      setTimeLeft(workout.exercises[0].duration);
    }
  };

  if (!workout) return <div className="p-8 text-center">Loading workout...</div>;
  if (workout.exercises.length === 0) return <div className="p-8 text-center">This workout has no exercises.</div>;

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Workout Complete!</h1>
          <p className="text-gray-600 mb-8">Great job crushing {workout.name}!</p>
          <div className="space-y-3">
            <button 
              onClick={resetWorkout}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              Restart Workout
            </button>
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentExercise = workout.exercises[currentExerciseIndex];
  const nextExercise = currentExerciseIndex < workout.exercises.length - 1 
    ? workout.exercises[currentExerciseIndex + 1] 
    : null;

  const progress = ((currentExercise.duration - timeLeft) / currentExercise.duration) * 100;

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="p-2 md:p-4 flex items-center justify-between bg-gray-800 gap-2">
        <Link to="/" className="text-gray-400 hover:text-white transition p-2">
          <ArrowLeft />
        </Link>
        <div className="flex-1 flex justify-center min-w-0">
            <SpotifyEmbed url={workout.spotifyUrl} />
        </div>
        <div className="hidden md:block w-10"></div>
      </div>

      {/* Main Timer Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div 
            className="absolute bottom-0 left-0 h-full bg-blue-600/20 transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%`, zIndex: 0 }}
        />

        <div className="relative z-10 text-center space-y-8 w-full px-4">
            <div className="space-y-4">
               <span className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xl">Current Exercise</span>
               <h2 className="text-[100px] md:text-9xl mt-2 leading-none">{currentExercise.name}</h2>
	    </div>
	    <div className="text-[100px] md:text-[200px] leading-none tabular-nums text-white">
                {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:
                {(timeLeft % 60).toString().padStart(2, '0')}
            </div>
        </div>
      </div>

      {/* Footer / Controls */}
      <div className="bg-gray-800 p-8 border-t border-gray-700">
        <div className="max-w-4xl mx-auto">
            {nextExercise && (
                <div className="mb-10 text-center">
                    <span className="text-sm uppercase tracking-[0.3em] text-gray-400 font-bold">Up Next</span>
                    <p className="text-4xl md:text-6xl font-bold text-white mt-2">{nextExercise.name}</p>
		    <p className="text-xl text-white mt-1">{nextExercise.duration} Seconds</p>
                </div>
            )}
            
            <div className="flex justify-center gap-6">
                <button 
                    onClick={toggleTimer}
                    className={`p-6 rounded-full transition transform hover:scale-105 shadow-lg ${
                        isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                    {isActive ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" className="ml-2" />}
                </button>
                <button 
                    onClick={resetWorkout}
                    className="p-6 bg-gray-700 rounded-full hover:bg-gray-600 transition transform hover:scale-105"
                >
                    <RotateCcw size={48} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
