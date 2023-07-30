import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isLogin: boolean = false;
  userDetails: any = {};

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
    this.userDetails = {};
    this._router.navigate(['/login']);
  }

  isUserLogin() {
    if (this.getUserDetails() != null) {
      if (!this.userDetails.userName) {
        let obj = JSON.parse(localStorage.getItem('userData') || '{}')?.rows[0];
        this.userDetails['userName'] = obj?.username;
        this.userDetails['email'] = obj?.email;
      }
      this.isLogin = true;
    }
  }
}
