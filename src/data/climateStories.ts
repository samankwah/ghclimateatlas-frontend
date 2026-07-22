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
      "Mangroves in Anyanui at the intersection of climate, livelihoods, and conservation are both a frontline defense and a fragile ecosystem under pressure.",
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
      "Irrigation in Woe, Volta Region adapting to rising temperatures and unpredictable rainfall patterns that threaten smallholder agriculture.",
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
    body: "Tamale and the Northern Region form the heartland of Ghana's rice production, but the entire value chain from planting to processing to market faces growing climate pressures. Rising temperatures stress rice crops during critical growth stages, while shifting rainfall patterns make planting calendars unreliable. Farmers who once depended on predictable seasonal rains now navigate floods and droughts in the same growing year. Along the value chain, post-harvest losses mount as higher temperatures and humidity challenge traditional drying and storage methods. Yet Northern Ghana's rice communities are adapting: improved seed varieties, better water management practices, and investments in local processing are building resilience from farm to fork, ensuring that rice remains both a staple food and an economic engine for the region.",
    externalUrl: "http://ghana.safe4allafrica.eu/fromfarmtofork",
  },
  {
    id: "accra-urban-heat",
    city: "Accra",
    lat: 5.6037,
    lng: -0.187,
    title: "Climate Change Advocacy with Kids",
    category: "Youth Climate Action",
    videoUrl: "https://www.dailymotion.com/video/x8zk95s",
    description:
      "Chelsea Boakye speaks with Ghanaian climate activist Nakeeyat about her experience and why young people must have a voice in climate action.",
    body: "Chelsea Boakye's interview with young Ghanaian climate activist Nakeeyat explores what it means for children to take part in the climate conversation. Reflecting on Nakeeyat's advocacy and participation at COP27, they discuss how young voices can press leaders to act, inspire their peers, and turn climate awareness into practical change. The story highlights the confidence and persistence of Ghana's young advocates, and the importance of giving children meaningful space in decisions that will shape their future.",
  },
  {
    id: "cape-coast-heritage",
    city: "Cape Coast",
    lat: 5.1315,
    lng: -1.2795,
    title: "Heritage Under Threat",
    category: "Coastal Erosion",
    videoUrl: "https://www.dailymotion.com/video/x9fqaxo",
    description:
      "Cape Coast's UNESCO World Heritage castle and surrounding coastal communities face mounting threats from sea level rise and intensifying storm surges.",
    body: "Cape Coast Castle, a symbol of Ghana's history and a major tourism anchor, sits directly on the eroding shoreline. Storm surges increasingly breach the seawall, flooding lower chambers and accelerating structural deterioration. Fishing communities along the coast report loss of landing beaches, making it harder to launch canoes. The tourism economy that sustains thousands of livelihoods is at risk as coastal infrastructure degrades.",
  },
  {
    id: "kumasi-flooding",
    city: "Kumasi",
    lat: 6.6885,
    lng: -1.6244,
    title: "Kumasi's Flood Challenge",
    category: "Flooding",
    videoUrl: "https://www.dailymotion.com/video/x9shkx8",
    description:
      "Ghana's second city faces recurring urban floods as rainfall intensifies and drainage systems are overwhelmed. Low-lying neighborhoods bear the brunt every rainy season.",
    body: "Kumasi's growth has paved over natural drainage channels and wetlands that once absorbed excess rainfall. The Subin and Aboabo rivers regularly overflow, flooding markets, homes, and roads in areas like Atonsu and Aboabo. Climate models project more intense rainfall events even as total annual rainfall decreases — meaning bigger floods from shorter, more violent storms. Informal waste disposal clogs drains, compounding the infrastructure deficit.",
  },
  {
    id: "wa-water-scarcity",
    city: "Wa",
    lat: 10.0601,
    lng: -2.5099,
    title: "Upper West Water Crisis",
    category: "Water Scarcity",
    videoUrl: "https://www.dailymotion.com/video/x8vm3cu",
    description:
      "Wa and the Upper West Region face a deepening water crisis as groundwater levels drop and seasonal rivers dry up earlier each year.",
    body: "The Upper West Region is one of Ghana's most water-stressed areas. Boreholes that were drilled decades ago are yielding less water as aquifer recharge slows. Communities dependent on the Black Volta and its tributaries find flows diminishing during the long dry season. Women spend increasing hours collecting water, impacting education for girls who assist their mothers. NGOs and government agencies are piloting rainwater harvesting and small-scale irrigation, but demand continues to outpace supply.",
  },
  {
    id: "bolgatanga-food-security",
    city: "Bolgatanga",
    lat: 10.7855,
    lng: -0.8514,
    title: "Climate & Food Security",
    category: "Food Security",
    videoUrl: "https://www.dailymotion.com/video/xa14qja",
    description:
      "The Upper East faces a food security crisis as erratic rainfall and rising temperatures reduce crop yields and threaten traditional farming systems.",
    body: "Around Bolgatanga, subsistence farmers growing millet, sorghum, and groundnuts face a double threat: shorter rainy seasons and more extreme heat during critical growth stages. Soil degradation from decades of intensive farming compounds climate impacts. Post-harvest losses increase as traditional storage methods fail in higher temperatures. The lean season — the hungry months before harvest — is stretching longer, pushing vulnerable households toward food insecurity and seasonal migration southward.",
  },
  {
    id: "takoradi-sea-level",
    city: "Takoradi",
    lat: 4.8845,
    lng: -1.7554,
    title: "Coastal Infrastructure at Risk",
    category: "Sea Level Rise",
    videoUrl: "https://www.dailymotion.com/video/x9fqaxo",
    description:
      "Takoradi's port and coastal infrastructure face growing risks from sea level rise, threatening one of Ghana's most important economic hubs.",
    body: "The Takoradi Port handles a significant share of Ghana's exports including oil, cocoa, and manganese. Rising sea levels and more intense storm surges threaten port operations, access roads, and surrounding communities. The nearby oil and gas infrastructure at the Jubilee Fields adds another dimension of vulnerability. Coastal communities between Takoradi and Axim report accelerating shoreline retreat, with fishing villages losing ground to the advancing ocean year after year.",
  },
  {
    id: "tema-industrial-heat",
    city: "Tema",
    lat: 5.6698,
    lng: -0.0166,
    title: "Industrial Zone Heat Stress",
    category: "Industrial Heat",
    videoUrl: "https://www.dailymotion.com/video/x8x3gj4",
    description:
      "Tema's industrial workers face dangerous heat exposure as temperatures climb. Factory floors and outdoor work sites are becoming health hazards during peak heat months.",
    body: "Tema's heavy industrial zone — home to aluminum smelting, steel works, and food processing — concentrates heat from machinery alongside rising ambient temperatures. Workers in poorly ventilated factories report heat exhaustion and reduced productivity. The concrete-heavy landscape of Tema New Town and Community One creates its own heat island effect. With Ghana's industrial output expected to grow, adapting workplaces and urban planning to extreme heat is becoming an economic imperative, not just a health concern.",
  },
  {
    id: "winneba-fisheries",
    city: "Winneba",
    lat: 5.35,
    lng: -0.6333,
    title: "Fishing Communities & Ocean Changes",
    category: "Fisheries",
    videoUrl: "https://www.dailymotion.com/video/x9u1ylo",
    description:
      "Winneba's fishing communities are seeing declining catches as ocean temperatures shift fish migration patterns and upwelling weakens along Ghana's coast.",
    body: "For generations, Winneba's economy has revolved around the sea — particularly the annual Aboakyer deer hunt festival and artisanal fishing. But fishermen report having to travel further offshore for diminishing catches. Warming ocean temperatures are disrupting the seasonal upwelling that brings nutrient-rich waters to the surface, affecting the entire marine food chain. Sardinella, the staple catch, has declined dramatically. Young people are leaving fishing for other work, threatening cultural traditions alongside livelihoods.",
  },
];
