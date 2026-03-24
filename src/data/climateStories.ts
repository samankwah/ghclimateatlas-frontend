import type { ClimateStory } from "../types/story";

import coastalErosionVideo from "../assets/Coastal Erosion.mp4";
import mangroveDepletionVideo from "../assets/Mangrove Depletion.mp4";
import irrigationVideo from "../assets/Irrigation.mp4";
import riceProductionVideo from "../assets/Rice Production.mp4";

export const CLIMATE_STORIES: ClimateStory[] = [
  {
    id: "keta-coastal-erosion",
    city: "Keta",
    lat: 5.9216,
    lng: 0.9911,
    title: "A Coastline in Retreat",
    category: "Coastal Erosion",
    videoSrc: coastalErosionVideo,
    description:
      "Coastal erosion in Keta and neighbouring communities continues to reshape the shoreline, displacing families and swallowing infrastructure built over generations.",
    body: "Keta and its neighbouring communities along Ghana's southeastern coast have witnessed dramatic shoreline retreat over the past several decades. Rising sea levels driven by climate change, combined with intensifying storm surges, are accelerating the erosion that has already claimed homes, schools, and roads. The Keta Sea Defense Project offered some protection, but adjacent stretches remain exposed and vulnerable. Fishing communities that have lived along this coast for centuries face an uncertain future as the land beneath them literally disappears into the sea. Saltwater intrusion into the Keta Lagoon complex further threatens freshwater supplies and the rich biodiversity of this Ramsar wetland site.",
    externalUrl: "https://storymaps.arcgis.com/stories/d651697e819747b8bdae46f73ed00f0a",
  },
  {
    id: "anyanui-mangrove-depletion",
    city: "Anyanui",
    lat: 5.78379,
    lng: 0.72127,
    title: "Roots of Resilience",
    category: "Mangrove Depletion",
    videoSrc: mangroveDepletionVideo,
    description:
      "Mangroves in Anyanui — at the intersection of climate, livelihoods, and conservation — are both a frontline defense and a fragile ecosystem under pressure.",
    body: "The mangrove forests around Anyanui in the Volta Region serve as a critical buffer between land and sea, protecting coastal communities from storm surges and erosion while nurturing the fish stocks that sustain local livelihoods. Yet these vital ecosystems are under mounting pressure from harvesting for firewood and construction, salt mining, and the changing climate. As sea levels rise and rainfall patterns shift, the delicate balance that mangroves depend on is being disrupted. Community-led conservation efforts are working to restore degraded areas through replanting initiatives, recognizing that healthy mangroves are not just an environmental asset but an economic lifeline for the people who depend on them.",
    externalUrl: "https://storymaps.arcgis.com/stories/d781587489d24a6b9a9aa566c943513c",
  },
  {
    id: "woe-irrigation",
    city: "Woe",
    lat: 5.83368,
    lng: 0.95584,
    title: "Farming Against the Odds",
    category: "Irrigation",
    videoSrc: irrigationVideo,
    description:
      "Irrigation in Woe, Volta Region — adapting to rising temperatures and unpredictable rainfall patterns that threaten smallholder agriculture.",
    body: "In Woe and surrounding communities of the Volta Region, smallholder farmers are confronting a new reality shaped by rising temperatures and increasingly erratic rainfall. Traditional rain-fed farming methods that sustained families for generations are becoming unreliable as dry spells lengthen and wet seasons grow more unpredictable. Farmers are turning to irrigation as an adaptation strategy, channeling water from local sources to maintain crop production through the dry months. But access to irrigation infrastructure remains uneven, and the costs of pumping and maintaining systems challenge the smallest producers. These communities are pioneering local solutions — from gravity-fed channels to small motor pumps — demonstrating resilience in the face of a rapidly changing climate.",
    externalUrl: "https://storymaps.arcgis.com/stories/77a6ab200fc84e15b645737c959740b8",
  },
  {
    id: "tamale-rice-production",
    city: "Tamale",
    lat: 9.4052,
    lng: -0.8424,
    title: "From Farm to Fork",
    category: "Food Security",
    videoSrc: riceProductionVideo,
    description:
      "Climate challenges and local solutions in the rice value chain of Tamale, Northern Ghana.",
    body: "Tamale and the Northern Region form the heartland of Ghana's rice production, but the entire value chain — from planting to processing to market — faces growing climate pressures. Rising temperatures stress rice crops during critical growth stages, while shifting rainfall patterns make planting calendars unreliable. Farmers who once depended on predictable seasonal rains now navigate floods and droughts in the same growing year. Along the value chain, post-harvest losses mount as higher temperatures and humidity challenge traditional drying and storage methods. Yet Northern Ghana's rice communities are adapting: improved seed varieties, better water management practices, and investments in local processing are building resilience from farm to fork, ensuring that rice remains both a staple food and an economic engine for the region.",
    externalUrl: "http://ghana.safe4allafrica.eu/fromfarmtofork",
  },
];
