import {
  Apple,
  BatteryCharging,
  CircleHelp,
  Cpu,
  Lightbulb,
  PaintBucket,
  Droplets,
  FlaskConical,
  HandHeart,
  Ban,
  BedDouble,
  Pill,
  Recycle,
  Trash2,
  TreePine,
  Truck,
  type LucideIcon,
} from 'lucide-react'
import type { DestinationId } from '@/data/schema'

// Colour is never the only signal: every destination also has a text label and an icon.
// `slab` is the background of the answer slab; `ink` is the text colour on it (both pass WCAG AA).
export interface DestinationStyle {
  slab: string
  ink: string
  icon: LucideIcon
  // Dashed outline for destinations where the City gives no place to take the item.
  uncertain: boolean
}

// Destinations that depend on City collection service, where a private hauler's rules may differ.
// Public drop-offs (hazardous waste, e-waste, batteries, bulbs, medical, mattress, Treecycling, donation) do not.
export const CITY_SERVICE_DESTINATIONS: ReadonlySet<DestinationId> = new Set<DestinationId>([
  'blue-cart',
  'green-cart',
  'trash-cart',
  'special-collection',
  'used-oil',
  'no-cart',
])

const BLUE = '#1D5FD1'
const GREEN = '#2F7D3A'
const SLATE = '#4A5560'
const AMBER = '#F2A900'
const TEAL = '#0F766E'
const PLUM = '#6D4C9F'
const ROSE = '#B4235A'
const INK = '#0E2A3B'
const WHITE = '#FFFFFF'

export const DESTINATION_STYLE: Record<DestinationId, DestinationStyle> = {
  'blue-cart': { slab: BLUE, ink: WHITE, icon: Recycle, uncertain: false },
  'green-cart': { slab: GREEN, ink: WHITE, icon: Apple, uncertain: false },
  'trash-cart': { slab: SLATE, ink: WHITE, icon: Trash2, uncertain: false },
  'special-collection': { slab: PLUM, ink: WHITE, icon: Truck, uncertain: false },
  'hazardous-dropoff': { slab: AMBER, ink: INK, icon: FlaskConical, uncertain: false },
  'paintcare-dropoff': { slab: TEAL, ink: WHITE, icon: PaintBucket, uncertain: false },
  'e-waste-dropoff': { slab: TEAL, ink: WHITE, icon: Cpu, uncertain: false },
  'battery-dropoff': { slab: AMBER, ink: INK, icon: BatteryCharging, uncertain: false },
  'bulb-dropoff': { slab: AMBER, ink: INK, icon: Lightbulb, uncertain: false },
  'medical-dropoff': { slab: ROSE, ink: WHITE, icon: Pill, uncertain: false },
  'used-oil': { slab: AMBER, ink: INK, icon: Droplets, uncertain: false },
  'mattress-dropoff': { slab: TEAL, ink: WHITE, icon: BedDouble, uncertain: false },
  treecycling: { slab: GREEN, ink: WHITE, icon: TreePine, uncertain: false },
  donate: { slab: TEAL, ink: WHITE, icon: HandHeart, uncertain: false },
  'no-cart': { slab: WHITE, ink: INK, icon: Ban, uncertain: true },
  'ask-the-city': { slab: WHITE, ink: INK, icon: CircleHelp, uncertain: true },
}
