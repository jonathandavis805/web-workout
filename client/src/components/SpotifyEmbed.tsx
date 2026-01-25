import { Music } from 'lucide-react';

interface SpotifyEmbedProps {
  url?: string;
}

export const SpotifyEmbed = ({ url }: SpotifyEmbedProps) => {
  if (!url) return null;

  // Extract playlist/album/track ID and type from URL
  // Example: https://open.spotify.com/playlist/37i9dQZF1DX76W9SfsPY7b?si=...
  const getEmbedUrl = (originalUrl: string) => {
    try {
      const match = originalUrl.match(/spotify\.com\/(playlist|album|track)\/([a-zA-Z0-9]+)/);
      if (match) {
        const type = match[1];
        const id = match[2];
        return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
      }
    } catch (e) {
      console.error('Invalid Spotify URL', e);
    }
    return null;
  };

  const embedUrl = getEmbedUrl(url);

  if (!embedUrl) {
    return (
      <div className="flex items-center gap-2 text-amber-400 text-xs font-medium bg-amber-400/10 p-2 rounded-lg border border-amber-400/20">
        <Music size={14} /> Invalid Spotify Link
      </div>
    );
  }

  return (
    <div className="w-full max-w-full md:max-w-md px-2">
      <iframe
        style={{ borderRadius: '12px', minWidth: '100%' }}
        src={embedUrl}
        width="100%"
        height="80"
        frameBorder="0"
        allowFullScreen={true}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      ></iframe>
    </div>
  );
};
