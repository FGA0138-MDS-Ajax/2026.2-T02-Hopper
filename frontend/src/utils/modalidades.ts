import { House, MapPin, Monitor } from 'lucide-react';
import type { Modalidade } from '../services/professores';

/** Ícone de cada modalidade de aula. */
export const ICONE_MODALIDADE: Record<Modalidade, typeof Monitor> = {
  ONLINE: Monitor,
  PRESENCIAL: MapPin,
  DOMICILIO: House,
};
