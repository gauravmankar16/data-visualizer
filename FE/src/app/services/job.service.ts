import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { HttpParams } from '@angular/common/http';
import { resolve } from 'dns';

@Injectable({
  providedIn: 'root'
})
export class JobService {

  constructor(private api: ApiService) { }

  getAllJobs(page: number, pageSize: number) {
    const params = new HttpParams()
    .set('page', page.toString())
    .set('pageSize', pageSize.toString());
    try {
      return new Promise((resolve, reject) => {
        this.api.getTypeRequest('manageJobs/get', params).subscribe({
          next: (response: any) => {
            resolve(response);
          },
          error: (error: any) => {
            console.log("Error occurred in get jobs ", error)
            reject(error);
          }
        });
      });
    } catch (error) {
      throw error;
    }
  }

  getMachineList() {
    try {
      return new Promise((resolve, reject) => {
        this.api.getTypeRequest('manageJobs/getMachineList').subscribe({
          next: (response: any) => {
            resolve(response);
          },
          error: (error: any) => {
            console.log("Error occurred in get machine list ", error)
            reject(error);
          }
        });
      });
    } catch (error) {
      throw error;
    }
  }
}
