import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isLogin: boolean = false;

  constructor(private _router: Router) { }

  getUserDetails() {
    if (localStorage.getItem('userData')) {
      return localStorage.getItem('userData')
    } else {
      return null
    }

  }
  setDataInLocalStorage(variableName, data) {
    localStorage.setItem(variableName, data);
  }
  getToken() {
    return localStorage.getItem('token');
  }
  clearStorage() {
    localStorage.clear();
  }

  logout() {
    this.isLogin = false;
    this.clearStorage();
    this._router.navigate(['/login']);
  }

  isUserLogin() {
    if (this.getUserDetails() != null) {
      this.isLogin = true;
    }
  }
}
