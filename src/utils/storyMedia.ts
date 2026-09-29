const hostedVideoId = (videoUrl?: string) => {
  if (!videoUrl) return undefined;

  try {
    const url = new URL(videoUrl);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "dailymotion.com") {
      return url.pathname.match(/^\/video\/([^_/?]+)/)?.[1];
    }

    if (host === "dai.ly") {
      return url.pathname.split("/").filter(Boolean)[0];
    }
  } catch {
    return undefined;
  }

  return undefined;
};

export const getHostedVideoThumbnail = (videoUrl?: string) => {
  const videoId = hostedVideoId(videoUrl);
  return videoId ? `https://www.dailymotion.com/thumbnail/video/${videoId}` : undefined;
};

export const getEmbeddedVideoUrl = (videoUrl?: string, autoplay = false) => {
  if (!videoUrl) return undefined;

  const videoId = hostedVideoId(videoUrl);
  if (videoId) {
    return `https://www.dailymotion.com/embed/video/${videoId}${autoplay ? "?autoplay=1" : ""}`;
  }

  return videoUrl;
};
