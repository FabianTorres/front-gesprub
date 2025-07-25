import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({
  selector: '[appVersionFormat]',
  standalone: true,
  providers: [{ provide: NG_VALIDATORS, useExisting: VersionFormatDirective, multi: true }]
})
export class VersionFormatDirective implements Validator {

  validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // No valida si el campo está vacío
    }
    const versionRegex = /^[0-9]+\.[0-9]+$/;
    const isValid = versionRegex.test(control.value);
    return isValid ? null : { versionFormat: { value: control.value } };
  }
}