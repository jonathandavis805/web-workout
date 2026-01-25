import { useEffect, useState } from 'react';
import { getSpotifyStatus, getSpotifyLoginUrl, getSpotifyPlaylist } from '../api';
import { Music, ExternalLink } from 'lucide-react';

export const SpotifyBanner = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [playlist, setPlaylist] = useState<{ name: string; url: string; image?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSpotify = async () => {
      try {
        const { is_connected } = await getSpotifyStatus();
        setIsConnected(is_connected);
        if (is_connected) {
          const data = await getSpotifyPlaylist();
          setPlaylist(data);
        }
      } catch (error) {
        console.error('Spotify error:', error);
      } finally {
        setLoading(false);
      }
    };
    checkSpotify();
  }, []);

  const handleLogin = async () => {
    const { auth_url } = await getSpotifyLoginUrl();
    window.location.href = auth_url;
  };

  if (loading) return null;

  if (!isConnected) {
    return (
      <button
        onClick={handleLogin}
        className="flex items-center gap-3 bg-[#1DB954] text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition shadow-lg"
      >
        <Music size={20} /> Connect Spotify for Workout Jams
      </button>
    );
  }

  if (!playlist) return null;

  return (
    <div className="flex items-center gap-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-3 rounded-2xl max-w-sm w-full">
      {playlist.image && (
        <img src={playlist.image} alt="Playlist" className="w-12 h-12 rounded-lg shadow-md" />
      )}
      <div className="flex-1 overflow-hidden">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Now Playing</p>
        <p className="text-white font-bold truncate">{playlist.name}</p>
      </div>
      <a
        href={playlist.url}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 text-gray-400 hover:text-[#1DB954] transition"
      >
        <ExternalLink size={20} />
      </a>
    </div>
  );
};
