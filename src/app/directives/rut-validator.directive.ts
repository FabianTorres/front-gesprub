import { Directive, forwardRef } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS } from '@angular/forms';

@Directive({
  standalone: true, // Importante para que funcione en componentes standalone
  selector: '[appRutValidator]',
  providers: [{
    provide: NG_VALIDATORS,
    useExisting: forwardRef(() => RutValidatorDirective),
    multi: true
  }]
})
export class RutValidatorDirective implements Validator {

  validate(control: AbstractControl): { [key: string]: any } | null {
    const rut = control.value;

    // Si el campo está vacío, no lo validamos (es opcional)
    if (!rut) {
      return null;
    }

    // 1. Limpiar el RUT de puntos y guion
    let rutLimpio = rut.replace(/[\.\-]/g, '').toLowerCase();
    
    // 2. Separar cuerpo y dígito verificador
    let cuerpo = rutLimpio.slice(0, -1);
    let dv = rutLimpio.slice(-1);

    // 3. Validar formato básico
    if (!/^[0-9]+[0-9kK]$/.test(rutLimpio)) {
        return { 'invalidRut': 'Formato incorrecto.' };
    }

    // 4. Calcular el dígito verificador esperado (Algoritmo Módulo 11)
    let suma = 0;
    let multiplo = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo.charAt(i), 10) * multiplo;
        if (multiplo < 7) {
            multiplo++;
        } else {
            multiplo = 2;
        }
    }

    const dvEsperado = 11 - (suma % 11);
    let dvCalculado: string;

    if (dvEsperado === 11) {
        dvCalculado = '0';
    } else if (dvEsperado === 10) {
        dvCalculado = 'k';
    } else {
        dvCalculado = dvEsperado.toString();
    }
    
    // 5. Comparar el dígito verificador del RUT con el calculado
    if (dvCalculado === dv) {
      return null; // El RUT es válido
    } else {
      return { 'invalidRut': 'El dígito verificador es incorrecto.' }; // El RUT es inválido
    }
  }
}