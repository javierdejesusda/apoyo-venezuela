/**
 * Visual + textual metadata for every domain enum. This is the single source
 * of the "emergency semaphore" so the same color, icon and label render
 * identically on the map, the cards and the detail screen.
 */
import {
  Building2,
  Check,
  CircleDot,
  CircleHelp,
  Clock,
  Droplets,
  HandHeart,
  HeartPulse,
  Hospital,
  Minus,
  Package,
  Phone,
  PhoneCall,
  Pill,
  Radio,
  ShieldCheck,
  Shirt,
  Siren,
  SprayCan,
  Stethoscope,
  Tent,
  TriangleAlert,
  Truck,
  Utensils,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import type {
  ContactCategory,
  EmergencyStatus,
  NeedCategory,
  NeedStatus,
  Urgency,
} from './data/types';

export type Tone = 'danger' | 'warning' | 'success' | 'neutral' | 'brand';

export interface Meta {
  label: string;
  description?: string;
  tone: Tone;
  icon: LucideIcon;
}

export interface ToneClasses {
  text: string;
  bg: string;
  border: string;
  dot: string;
  solid: string;
}

/** Soft-badge class sets per tone (work on both light and dark surfaces). */
export function toneClasses(tone: Tone): ToneClasses {
  switch (tone) {
    case 'danger':
      return {
        text: 'text-tone-danger-text',
        bg: 'bg-danger/10',
        border: 'border-danger/25',
        dot: 'bg-danger',
        solid: 'bg-danger text-white',
      };
    case 'warning':
      return {
        text: 'text-tone-warning-text',
        bg: 'bg-warning/12',
        border: 'border-warning/30',
        dot: 'bg-warning',
        solid: 'bg-warning text-white',
      };
    case 'success':
      return {
        text: 'text-tone-success-text',
        bg: 'bg-success/10',
        border: 'border-success/25',
        dot: 'bg-success',
        solid: 'bg-success text-white',
      };
    case 'brand':
      return {
        text: 'text-tone-brand-text',
        bg: 'bg-brand-600/10',
        border: 'border-brand-600/25',
        dot: 'bg-brand-600',
        solid: 'bg-brand-600 text-white',
      };
    default:
      return {
        text: 'text-ink-soft',
        bg: 'bg-ink-soft/10',
        border: 'border-border-strong',
        dot: 'bg-ink-faint',
        solid: 'bg-ink-soft text-white',
      };
  }
}

/** Hex value for the map markers (which can't use Tailwind classes). */
export const TONE_HEX: Record<Tone, string> = {
  danger: '#e5484d',
  warning: '#e8930c',
  success: '#2e9e5b',
  brand: '#1f47df',
  neutral: '#868d9b',
};

export const statusMeta: Record<EmergencyStatus, Meta> = {
  derrumbe: {
    label: 'Derrumbe',
    description: 'Colapso de estructuras. Puede haber personas atrapadas.',
    tone: 'danger',
    icon: Building2,
  },
  danado: {
    label: 'Dañado',
    description: 'Estructuras dañadas o con riesgo. Acercarse con precaución.',
    tone: 'warning',
    icon: TriangleAlert,
  },
  estable: {
    label: 'Estable',
    description: 'Sin colapso reportado. Zona estructuralmente estable.',
    tone: 'success',
    icon: ShieldCheck,
  },
  desconocido: {
    label: 'Sin confirmar',
    description: 'Aún no se confirma el estado de la zona.',
    tone: 'neutral',
    icon: CircleHelp,
  },
};

export const urgencyMeta: Record<Urgency, Meta> = {
  alta: { label: 'Urgente', tone: 'danger', icon: TriangleAlert },
  media: { label: 'Media', tone: 'warning', icon: Clock },
  baja: { label: 'Baja', tone: 'neutral', icon: Minus },
};

export const needStatusMeta: Record<NeedStatus, Meta> = {
  pendiente: { label: 'Se necesita', tone: 'danger', icon: CircleDot },
  en_camino: { label: 'En camino', tone: 'brand', icon: Truck },
  cubierto: { label: 'Cubierto', tone: 'success', icon: Check },
};

export const categoryMeta: Record<NeedCategory, Meta> = {
  rescate: { label: 'Rescate', tone: 'danger', icon: Siren },
  agua: { label: 'Agua', tone: 'brand', icon: Droplets },
  alimentos: { label: 'Alimentos', tone: 'warning', icon: Utensils },
  medicinas: { label: 'Medicinas', tone: 'danger', icon: Pill },
  refugio: { label: 'Refugio', tone: 'brand', icon: Tent },
  ropa: { label: 'Ropa', tone: 'neutral', icon: Shirt },
  higiene: { label: 'Higiene', tone: 'brand', icon: SprayCan },
  energia: { label: 'Energía', tone: 'warning', icon: Zap },
  herramientas: { label: 'Herramientas', tone: 'neutral', icon: Wrench },
  transporte: { label: 'Transporte', tone: 'neutral', icon: Truck },
  comunicacion: { label: 'Comunicación', tone: 'brand', icon: Radio },
  otro: { label: 'Otro', tone: 'neutral', icon: Package },
};

export const contactCategoryMeta: Record<ContactCategory, Meta> = {
  hotline: { label: 'Emergencia', tone: 'danger', icon: PhoneCall },
  proteccion_civil: { label: 'Protección Civil', tone: 'brand', icon: ShieldCheck },
  bomberos: { label: 'Bomberos', tone: 'danger', icon: Siren },
  cruz_roja: { label: 'Cruz Roja', tone: 'danger', icon: HeartPulse },
  policia: { label: 'Policía', tone: 'brand', icon: ShieldCheck },
  hospital: { label: 'Hospital', tone: 'success', icon: Hospital },
  medico: { label: 'Médico', tone: 'success', icon: Stethoscope },
  rescate: { label: 'Rescate', tone: 'warning', icon: HandHeart },
  otro: { label: 'Otro', tone: 'neutral', icon: Phone },
};
