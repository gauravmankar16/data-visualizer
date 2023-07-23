import { Component, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { ApiService } from '../services/api.service';

import { DateValidator, validateEmail } from './table-validators.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-supervisor-dashboard',
  templateUrl: './supervisor-dashboard.component.html',
  styleUrls: ['./supervisor-dashboard.component.css']
})
export class SupervisorDashboardComponent {
  jobForm: FormGroup;
  savedJobs = [];
  today = new Date().toISOString().slice(0, 16);

  machines = [{
    id: 1,
    name: 'd-1'
  }, {
    id: 2,
    name: 'd-2'
  },
  {
    id: 3,
    name: 'd-3'
  },
  {
    id: 4,
    name: 'd-4'
  },
  {
    id: 5,
    name: 'd-5'
  }];

  constructor(private fb: FormBuilder, private _api: ApiService, private _auth: AuthService,) { }

  ngOnInit() {
    this.jobForm = this.fb.group({
      jobs: this.fb.array([])
    });
    this.getJobs();
  }

  getJobs() {
    const control = <FormArray>this.jobForm.get('jobs');
    this._api.getTypeRequest('manageJobs/get').subscribe((res: any) => {
      console.log(res, 'resp');
      this.savedJobs = res.data.jobs;

      for (const job of res.data.jobs) {
        const grp = this.fb.group({
          id: job.id,
          machine: [{ value: job.machine, disabled: true }, Validators.required],
          jobName: [{ value: job.jobName, disabled: true }, Validators.required],
          targetQty: [{ value: job.targetQty, disabled: true }, Validators.required],
          actualQty: [job.actualQty],
          startTime: [{ value: job.startTime, disabled: new Date(job.startTime) < new Date() ? true : false }, Validators.required],
          endTime: [{ value: job.endTime, disabled: new Date(job.endTime) < new Date() ? true : false }, Validators.compose([Validators.required])],
          operatorName: [job.operatorName, Validators.required],
          remarks: [job.remarks]
        });
        control.push(grp);
      }

      // this.getFormData?.valueChanges.subscribe((changes) => {
      //   console.log(changes, 'changes2');

      // })
    });
  }

  initiateForm(id): FormGroup {
    return this.fb.group({
      id: ++id,
      machine: [{ value: '', disabled: false }, Validators.required],
      jobName: ['', Validators.required],
      targetQty: [0, Validators.required],
      actualQty: [0],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      operatorName: ['', Validators.required],
      remarks: ['System generated: Actual quantity is not updated']
    });
  }

  get getFormData(): FormArray {
    return <FormArray>this.jobForm.get('jobs');
  }

  addRow() {
    const control = <FormArray>this.jobForm.get('jobs');
    control.push(this.initiateForm(control?.value?.length));
    console.log('heyy');

  }

  remove(index: number) {
    const control = <FormArray>this.jobForm.get('jobs');
    control.removeAt(index);
  }

  dateChange(i, type, updatedRow) {
    if (this.savedJobs.length > i) {
      let orgObj = this.savedJobs[i];
      if (new Date(updatedRow.value.endTime) < new Date(orgObj['endTime'])) {
        this.autoAdjustTargetQty(orgObj, updatedRow.value);
      } else {
        updatedRow.value = orgObj['endTime'];
        alert('End time cannot be increased after setting once. Please create new job.')
      }
    }
  }

  operatorChange(i, updatedRow) {
    if (this.savedJobs.length > i) {
      updatedRow.controls.remarks.setValue(`System generated: ${this.savedJobs[i]['operatorName']} updated to ${updatedRow.value.operatorName} on ${new Date().toLocaleString()}`);
    }
  }

  autoAdjustTargetQty(orgObj, updatedObj) {
    const originalDiff = Math.round((new Date(orgObj.endTime).getTime() - new Date(orgObj.startTime).getTime()) / 60000);
    const updatedDiff = Math.round((new Date(updatedObj.endTime).getTime() - new Date(updatedObj.startTime).getTime()) / 60000);
    console.log(originalDiff, 'old\n', updatedDiff, 'new');

    const orgPerMinuteJobs = Math.round(orgObj.targetQty / originalDiff);
    const newTargetQty = Math.round(orgPerMinuteJobs * updatedDiff);
    console.log(orgPerMinuteJobs, 'orgPerMinuteJobs\n', orgObj.targetQty, 'org targetqty');
    console.log(newTargetQty, 'newTargetQty\n');
    updatedObj['newTargetQty'] = newTargetQty;
    console.log(updatedObj);

  }

  save() {
    // console.log('isValid', this.jobForm.valid);
    // const control = this.jobForm.get('jobs') as FormArray;
    // let touchedRows = control.controls.filter(row => row.touched).map(row => row.value);
    // console.log(this.jobForm.value, 'updatedVal\n');
    // console.log(touchedRows, 'touchedRows\n');
    console.log(this.jobForm.getRawValue(), 'old Val');
    let userName: string = JSON.parse(localStorage.getItem('userData') || '{}')?.rows[0]?.username;
    let submitForm = this.jobForm.getRawValue();

    submitForm.jobs.forEach((element, index) => {
      element['updatedBy'] = userName;
      const newTargetQty = this.jobForm.value.jobs[index]?.newTargetQty;
      if (newTargetQty) {
        element.targetQty = newTargetQty;
        element.remarks = 'System generated: Target quantity auto adjusted'
      }
    });

    this._api.postTypeRequest('manageJobs/save', submitForm).subscribe((res: any) => {
      this.jobForm.reset();
      this.jobForm = this.fb.group({
        jobs: this.fb.array([])
      });
      this.getJobs();
    });
  }


  // form: FormGroup;
  // private formSubmitAttempt: boolean;
  // private uid = 0;
  // private savedJobDetails;

  // @ViewChild('table') table: MatTable<any>;

  // displayedColumns = ['deviceId', 'jobName', 'targetQty', 'actualQty', 'startTime', 'endTime', 'operatorName'];
  // dataSource: MatTableDataSource<AbstractControl>;

  // get productControlArray() {
  //   return this.form.get('jobs') as FormArray;
  // }

  // constructor(private fb: FormBuilder, private _api: ApiService) {
  //   this.createForm();
  //   this.addRow();
  //   this.dataSource = new MatTableDataSource(
  //     this.productControlArray.controls);
  // }

  // ngOnInit() {
  //   this._api.getTypeRequest('manageJobs/get').subscribe((res: any) => {
  //     console.log(res, 'resp');
  //     this.savedJobDetails = res.data;
  //     this.addRow()
  //   });
  // }

  // createForm() {
  //   this.form = this.fb.group({
  //     jobs: this.fb.array([]),
  //   });
  // }

  // trackRows(index: number, row: AbstractControl) {
  //   return row.value.uid;
  // }

  // private addRow() {
  //   const rows = this.productControlArray;
  //   if (this.savedJobDetails?.jobs?.length > 0) {
  //     // for (let i = 0; i < this.savedJobDetails.jobs.length; i++) {
  //     //   const element = this.savedJobDetails.jobs[i];

  //     //       this.productControlArray.value[i].deviceId = i,
  //     //       this.productControlArray.value[i].jobName = element.jobName,
  //     //       this.productControlArray.value[i].targetQty = element.targetQty,
  //     //       this.productControlArray.value[i].actualQty = element.actualQty,
  //     //       // this.productControlArray.value[i].startTime = [],
  //     //       // this.productControlArray.value[i].endTime = [],
  //     //       this.productControlArray.value[i].operatorName = element.operatorName

  //     // }
  //     this.dataSource.data = this.savedJobDetails.jobs
  //     this.table.renderRows();
  //   } else {
  //     for (let i = 0; i < 3; i++) {
  //       rows.push(
  //         this.fb.group({
  //           deviceId: i,
  //           // product_id: [undefined, Validators.required],
  //           jobName: [``, Validators.required],
  //           targetQty: [0, Validators.required],
  //           actualQty: [0, Validators.required],
  //           startTime: [],
  //           endTime: [],
  //           operatorName: ['']
  //         })
  //       );
  //     }
  //   }
  // }

  // createRow() {
  //   this.addRow();
  //   this.table.renderRows();
  // }

  // private nextUid() {
  //   ++this.uid
  //   return this.uid;
  // }

  // resetForm() {
  //   this.form.reset()
  // }

  // saveForm() {
  //   console.log(this.form.value.jobs, 'heyy');
  //   this._api.postTypeRequest('manageJobs/save', this.form.value).subscribe((res: any) => {
  //     if (res.status) {
  //       console.log(res)
  //     } else {
  //       console.log(res)
  //       alert(res.msg)
  //     }
  //   });

  //   // this.downloadFile(this.form.value.jobs)
  // }

  // // downloadFile(data: any) {
  // //   const replacer = (key: any, value: null) => value === null ? '' : value; // specify how you want to handle null values here
  // //   const header = Object.keys(data[0]);
  // //   let csv = data.map((row: { [x: string]: any; }) => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
  // //   csv.unshift(header.join(','));
  // //   let csvArray = csv.join('\r\n');

  // //   var blob = new Blob([csvArray], { type: 'text/csv' })
  // //   saveAs(blob, "myFile.csv");
  // // }


}
