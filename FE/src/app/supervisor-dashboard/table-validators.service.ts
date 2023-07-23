import { AbstractControl } from '@angular/forms';

export function validateEmail(control: AbstractControl) {
  if (!control.value.endsWith('@gmail.com')) {
    return {validEmail: true};
  }
  return null;
}

export class DateValidator {
  static dateValidator(val: AbstractControl) {
    console.log(val, 'validator');

    // if (AC && AC.value && !moment(AC.value, 'YYYY-MM-DD', true).isValid()) {
    //   return { 'dateVaidator': true };
    // }
    return null;
  }
}
