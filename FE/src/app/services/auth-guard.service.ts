import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
@Injectable({
  providedIn: 'root'
})
export class AuthGuardService {
  constructor(
    private _authService: AuthService,
    private _router: Router
  ) { }
  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    const jwtToken = this._authService.getToken();
    if (jwtToken) {
      const expires = new Date(JSON.parse(atob(jwtToken.split('.')[1])).exp * 1000);
      const timeout = expires.getTime() - Date.now();
      setTimeout(() => {
        this._authService.logout();
        alert('Session expired! Please login again.');
      }, timeout);

      return true;
    }
    // navigate to login page
    this._router.navigate(['/login']);
    // you can save redirect url so after authing we can move them back to the page they requested
    return false;
  }
}
