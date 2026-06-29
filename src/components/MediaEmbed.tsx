'use client';

import { parseVideoEmbed } from '@/lib/videoEmbed';

export default function MediaEmbed({ imageUrl, videoUrl }: { imageUrl?: string; videoUrl?: string }) {
  const embed = videoUrl ? parseVideoEmbed(videoUrl) : null;
  return (
    <>
      {imageUrl ? <img src={imageUrl} alt="" /> : null}
      {embed?.kind === 'youtube' || embed?.kind === 'vimeo' ? (
        <iframe src={embed.src} allow="autoplay; encrypted-media" frameBorder={0} />
      ) : null}
      {embed?.kind === 'file' ? <video src={embed.src} autoPlay muted loop playsInline /> : null}
      {embed?.kind === 'link' ? <div className="tk-body">{embed.src}</div> : null}
    </>
  );
}
