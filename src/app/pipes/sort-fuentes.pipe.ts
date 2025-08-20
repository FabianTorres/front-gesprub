import { Pipe, PipeTransform } from '@angular/core';
import { Fuente } from '../models/fuente';

@Pipe({
  name: 'sortFuentes',
  standalone: true
})
export class SortFuentesPipe implements PipeTransform {

  transform(fuentes: Fuente[] | undefined | null): Fuente[] {
    if (!fuentes) {
      return [];
    }

    // Creamos una copia para no modificar el array original
    return [...fuentes].sort((a, b) => {
      const nameA = a.nombre_fuente;
      const nameB = b.nombre_fuente;

      const isNumberA = !isNaN(parseFloat(nameA)) && isFinite(Number(nameA));
      const isNumberB = !isNaN(parseFloat(nameB)) && isFinite(Number(nameB));

      if (isNumberA && isNumberB) {
        return parseFloat(nameA) - parseFloat(nameB);
      }
      if (isNumberA) {
        return -1; // Los números van antes que el texto
      }
      if (isNumberB) {
        return 1;
      }
      // Ordenamiento alfabético para el texto
      return nameA.localeCompare(nameB);
    });
  }
}