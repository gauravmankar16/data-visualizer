import { Component, OnInit } from '@angular/core';
import { ApiService } from './../../../services/api.service'
import { AuthService } from './../../../services/auth.service'
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { constants } from '../../../util/constants/constants';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  isLogin: boolean = false
  errorMessage: any
  constructor(
    private _api: ApiService,
    private _auth: AuthService,
    private _router: Router,
    private snackBar: MatSnackBar
  ) { }
  ngOnInit() {
    this.isUserLogin();
  }
  onSubmit(form: NgForm) {
    this._api.postTypeRequest('user/register', form.value).subscribe((res: any) => {
      if (res.status) {
        console.log(res)
        this.snackBar.open(constants.messages.registerSuccess, 'X', {
          duration: 3000
        })
        this._router.navigate(['login']);
      } else {
        console.log(res)
        alert(res.msg)
      }
    });
  }
  isUserLogin() {

    if (this._auth.getUserDetails() != null) {
      this.isLogin = true;
    }
  }
}
