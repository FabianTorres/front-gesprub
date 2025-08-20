import { Caso } from './caso';
import { Evidencia } from './evidencia';

export interface CasoConEvidencia {
    caso: Caso;
    ultimaEvidencia: Evidencia | null;
    rutsUnicos?: string[];
}