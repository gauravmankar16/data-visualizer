import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private _http: HttpClient) {
  }
  getTypeRequest(url) {
    return this._http.get(`${environment.apiUrl}/${url}`).pipe(map(res => {
      return res;
    }));
  }
  postTypeRequest(url, payload) {
    return this._http.post(`${environment.apiUrl}/${url}`, payload).pipe(map(res => {
      return res;
    }));
  }
  putTypeRequest(url, payload) {
    return this._http.put(`${environment.apiUrl}/${url}`, payload).pipe(map(res => {
      return res;
    }));
  }
}
