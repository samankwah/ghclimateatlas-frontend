export interface ClimateStory {
  id: string;
  city: string;
  lat: number;
  lng: number;
  title: string;
  category: string;
  videoSrc?: string;
  videoUrl?: string;
  description: string;
  body: string;
  externalUrl?: string;
}
