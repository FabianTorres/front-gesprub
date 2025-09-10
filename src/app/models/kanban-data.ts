// src/app/models/kanban-data.ts
import { Caso } from './caso';

export interface KanbanData {
    porHacer: Caso[];
    completado: Caso[];
    conError: Caso[];
}