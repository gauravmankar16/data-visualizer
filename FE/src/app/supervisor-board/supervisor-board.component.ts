import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../services/api.service'
import { MatTableDataSource } from '@angular/material/table';
import { constants } from '../util/constants/constants';
import { Jobs } from '../util/models/jobs.model';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { JobService } from '../services/job.service';
import { MatSort, Sort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../components/confirmation-dialog/confirmation-dialog.component';
import { DatePipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-supervisor-board',
  templateUrl: './supervisor-board.component.html',
  styleUrls: ['./supervisor-board.component.css']
})
export class SupervisorBoardComponent implements OnInit {
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  dataSource = new MatTableDataSource();
  jobNameFilter = new FormControl('');
  operatorNameFilter = new FormControl('');
  today = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)).toISOString().slice(0, 16);
  isEdit: boolean = false;

  //Required error messages
  machineRequired = constants.messages.machineRequired;
  operatorNameRequired = constants.messages.operatorNameRequired;
  jobNameRequired = constants.messages.jobNameRequired;
  targetQtyRequired = constants.messages.targetQtyRequired;
  actualyQtyRequired = constants.messages.actualyQtyRequired;
  startTimeRequired = constants.messages.startTimeRequired;
  endTimeRequired = constants.messages.endTimeRequired;
  endTimeError = constants.messages.endTimeError;
  endTimePassed = constants.messages.endTimePassed;
  startTimePassed = constants.messages.startTimePassed;
  remarksAfterTargetAdjust = constants.messages.remarksAfterTargetAdjust;
  setEndTime = constants.messages.setEndTime;
  endTimeCannotBeIncreased = constants.messages.endTimeCannotBeIncreased;
  wrongStartTime = constants.messages.wrongStartTime;
  endTimeLessThanCurrent = constants.messages.endTimeLessThanCurrent;
  endTimePassedFlag: boolean = false;
  startTimePassedFlag: boolean = false;
  targetQtyLessThanOneFlag: boolean = false;

  currentPage = 1;
  pageSize = 50;
  totalCount: number;
  rowSelected: any;
  endTime: any;

  filterValues = {
    job_name: '',
    operator_name: ''
  }

  newTargetQtyAfterAdjusting: number

  jobForm: FormGroup;
  jobData: any;

  displayedColumns: string[] = ['machine', 'jobName', 'operatorName', 'targetQty', 'actualQty', 'startTime', 'endTime', 'remarks'];

  machines = [{
    id: 1,
    name: 'machine-1'
  }, {
    id: 2,
    name: 'machine-2'
  },
  {
    id: 3,
    name: 'machine-3'
  },
  {
    id: 4,
    name: 'machine-4'
  },
  {
    id: 5,
    name: 'machine-5'
  }];

  constructor(
    private jobService: JobService,
    private formBuilder: FormBuilder,
    private _api: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {   
    this.getJobs();
    this.initForm();
  }

  initForm() {
    this.jobForm = this.formBuilder.group({
      id: [],
      machine: ['', Validators.required],
      job_name: ['', Validators.required],
      operator_name: ['', [Validators.required]],
      target_qty: [0, Validators.required],
      actual_qty: [{ value: 0, disabled: true }, Validators.required],
      start_time: ['', Validators.required],
      end_time: ['', Validators.required],
      remarks: [{ value: '', disabled: true }]
    });
  }

  onStartTimeChange() {
    const startTimeValue = new Date(this.jobForm?.get('start_time')?.value);
    const endTimeValue = new Date(this.jobForm?.get('end_time')?.value);

    if (this.jobForm?.get('end_time')?.value && this.jobForm?.get('start_time')?.value) {
      if (startTimeValue && endTimeValue && endTimeValue < startTimeValue) {
        this.jobForm.get('end_time')?.setErrors({ endTimeBeforeStartTime: true });
      } else {
        this.jobForm.get('end_time')?.setErrors(null);
        this.endTimePassedFlag = false;
        this.jobForm.get('start_time')?.enable();
        this.jobForm.get('end_time')?.enable();
      }
    }
    if (this.jobForm?.get('start_time')?.value && new Date() > startTimeValue) {
      this.jobForm.get('start_time')?.setErrors({ wrongStartTime: true });
    }
  }

  onEndTimeChange() {
    const startTimeValue = new Date(this.jobForm?.get('start_time')?.value);
    const endTimeValue = new Date(this.jobForm?.get('end_time')?.value);

    if (startTimeValue && endTimeValue && endTimeValue < startTimeValue) {
      this.jobForm.get('end_time')?.setErrors({ endTimeBeforeStartTime: true });
    } else {
      this.jobForm.get('end_time')?.setErrors(null);
      this.endTimePassedFlag = false;
      this.jobForm.get('start_time')?.enable();
      this.jobForm.get('end_time')?.enable();
    }

    if (this.isEdit && !this.jobForm.controls['end_time'].disabled) {
      let selectedRowEndTime = new Date(this.rowSelected.end_time);
      if (new Date(this.jobForm.value.end_time) < new Date()) {
        this.jobForm.get('start_time')?.setErrors({ endTimeLessThanCurrent: true });
      }
      if (new Date(this.jobForm.value.end_time) < new Date(selectedRowEndTime)) {
        // Show the confirmation dialog before saving
        const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
          width: '400px',
          data: { title: 'Confirm', message: 'Target quantity will be auto adjusted, are you sure you want to proceed?' }
        });

        // Handle the dialog result when the user closes the dialog
        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.autoAdjustTargetQty(this.rowSelected, this.jobForm);
          } else {
            this.jobForm.controls['end_time'].setValue(selectedRowEndTime);
          }
        });
      } else {
        //uncomment this later
        this.jobForm.controls['end_time'].setValue(selectedRowEndTime);
        this.snackBar.open(this.endTimeCannotBeIncreased, 'X', {
          duration: 5000
        });
      }
    }
  }

  hasEndTimePassed(row) {
    // Convert UTC time to IST using the timeZone option
    const endISTTime = new Date(row.end_time).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    // Get the current time in IST using the timeZone option
    const currentISTTime = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    if (new Date(currentISTTime).getTime() > new Date(endISTTime).getTime()) {
      return true;
    }
    return false;
  }


  autoAdjustTargetQty(rowSelected, jobForm) {
    let orgEndTime = new Date(new Date(rowSelected.end_time).toISOString().slice(0, 16)).getTime();
    let orgStartTime = new Date(new Date(rowSelected.start_time).toISOString().slice(0, 16)).getTime()
    let originalDiff = Math.round((orgEndTime - orgStartTime) / 60000);
    this.endTime = jobForm?.get('end_time')?.value

    let updatedDiff = Math.round((new Date(jobForm?.get('end_time')?.value).getTime() - new Date(jobForm?.get('start_time')?.value).getTime()) / 60000);
    let newTargetQty = Math.round(rowSelected.target_qty * updatedDiff / originalDiff);
    if (newTargetQty >= 1) {
      console.log(newTargetQty, 'newTargetQty\n');
      this.newTargetQtyAfterAdjusting = newTargetQty
      this.targetQtyLessThanOneFlag = false;
    } else {
      this.targetQtyLessThanOneFlag = true;

      while (newTargetQty < 1) {
        const newEndTime = new Date(new Date(this.endTime).getTime() + 60000); // Increment end_time by 1 minute

        //the below line will not work.  // The reason for this discrepancy is that the toISOString method returns the date in UTC time zone.
        // jobForm.get('end_time').setValue(newEndTime.toISOString());
        // you can manually format the date by extracting the individual components and constructing the string:
        const dateObject = new Date(newEndTime);

        const year = dateObject.getFullYear();
        const month = String(dateObject.getMonth() + 1).padStart(2, '0');
        const day = String(dateObject.getDate()).padStart(2, '0');
        const hours = String(dateObject.getHours()).padStart(2, '0');
        const minutes = String(dateObject.getMinutes()).padStart(2, '0');

        const formattedDateString = `${year}-${month}-${day}T${hours}:${minutes}`;

        this.endTime = formattedDateString
        const updatedDiff = Math.round((newEndTime.getTime() - new Date(jobForm?.get('start_time')?.value).getTime()) / 60000);
        newTargetQty = Math.round(rowSelected.target_qty * updatedDiff / originalDiff);
      }
      this.newTargetQtyAfterAdjusting = newTargetQty;
    }
  }

  ngAfterViewInit() {

  }

  async getJobs() {
    try {
      let response: any = await this.jobService.getAllJobs(this.currentPage, this.pageSize);
      console.log("Get jobs response", response);

      if (response.statusCode == constants.statusCode.success) {
        this.dataSource.data = response.data;
        this.jobData = response.data;
        this.totalCount = response.totalCount;
        this.dataSource.sort = this.sort;

        this.dataSource.filterPredicate = this.createFilter();

        this.jobNameFilter.valueChanges.subscribe(name => {
          this.filterValues.job_name = name.toLowerCase();
          this.dataSource.filter = JSON.stringify(this.filterValues);
        });

        this.operatorNameFilter.valueChanges.subscribe(name => {
          this.filterValues.operator_name = name.toLowerCase();
          this.dataSource.filter = JSON.stringify(this.filterValues);
        });
      }
    } catch (error) {
      console.log("Error occurred in get jobs ", error)
    }
  }

  selectRow(row) {
    console.log("Inside select row function ", row);
    row.start_time = this.formatDateTimeLocal(row.start_time);
    row.end_time = this.formatDateTimeLocal(row.end_time);
    this.rowSelected = row;
    this.isEdit = true;
    this.jobForm.patchValue({
      id: row.id,
      machine: row.machine,
      job_name: row.job_name,
      operator_name: row.operator_name,
      target_qty: row.target_qty,
      actual_qty: row.actual_qty,
      start_time: row.start_time,
      end_time: row.end_time,
      remarks: row.remarks
    });

    this.jobForm.get('machine')?.disable();
    this.jobForm.get('job_name')?.disable();
    //uncomment this later
    this.jobForm.get('target_qty')?.disable();

    //before patching check conditions for start_time and end_time, and disable them accordingly
    const startTimeValue = new Date(this.jobForm?.get('start_time')?.value);
    const endTimeValue = new Date(this.jobForm?.get('end_time')?.value);
    const currentTime = new Date();

    if (startTimeValue && endTimeValue && endTimeValue < currentTime) {
      this.jobForm.get('end_time')?.setErrors({ endTimePassed: true });
      this.endTimePassedFlag = true;
      this.jobForm.get('start_time')?.disable();
      this.jobForm.get('end_time')?.disable();

      // Enable actual quantity only if end_time has elasped
      this.jobForm.get('actual_qty')?.enable();
    } else {
      this.jobForm.get('end_time')?.setErrors(null);
      this.endTimePassedFlag = false;
      this.jobForm.get('start_time')?.enable();
      this.jobForm.get('end_time')?.enable();
    }

    if (startTimeValue && endTimeValue && startTimeValue < currentTime) {
      this.jobForm.get('start_time')?.setErrors({ startTimePassed: true });
      this.startTimePassedFlag = true;
      this.jobForm.get('start_time')?.disable();
    } else {
      this.jobForm.get('start_time')?.setErrors(null);
      this.startTimePassedFlag = false;
      this.jobForm.get('start_time')?.enable();
    }
  }

  formatDateTimeLocal(dateTimeString: string): string {
    // Convert the date string to a JavaScript Date object
    const dateTime = new Date(dateTimeString);
    // Format the date in "yyyy-MM-ddTHH:mm" format
    const formattedDateTime = this.datePipe.transform(dateTime, 'yyyy-MM-ddTHH:mm');
    return formattedDateTime || '';
  }

  onFormSubmit() {
    if (this.jobForm.valid) {
      // Show the confirmation dialog before saving
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '400px',
        data: { title: 'Confirm', message: this.isEdit ? 'Are you sure you want to update?' : 'Machine selection, Job Name and Target Quantity are not editable, are you sure you want to save?' },
      });

      // Handle the dialog result when the user closes the dialog
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          // User confirmed, proceed with saving
          let formData: any = {}
          Object.assign(formData, this.jobForm.getRawValue());
          console.log("Form Data : ", formData)
          formData['updated_by'] = JSON.parse(localStorage.getItem('userData') || '{}')?.rows[0]?.username;
          if (this.isEdit) {
            if (formData.operator_name != this.rowSelected.operator_name) {
              formData['remarks'] = formData.remarks + `\nSystem generated: Operator ${this.rowSelected.operator_name} updated to ${formData.operator_name} on ${new Date().toLocaleString()}`;
            }
            formData['target_qty'] = this.newTargetQtyAfterAdjusting ? this.newTargetQtyAfterAdjusting : formData['target_qty'];
            formData['remarks'] = this.newTargetQtyAfterAdjusting ? formData.remarks + '\nSystem generated: Target quantity auto adjusted' : formData['remarks']
            this.newTargetQtyAfterAdjusting = 0;
            console.log(formData, 'formDataformData');
            // Call the service method to send the updated data back to the server
            this._api.postTypeRequest('manageJobs/update', formData).subscribe({
              next: (response: any) => {
                if (response.statusCode == 200) {
                  console.log('Form data updated successfully:', response);
                  this.snackBar.open(constants.messages.updateMessage, 'X', {
                    duration: 5000
                  });
                  this.getJobs();
                  this.onFormReset();
                } else {
                  console.log("Error while updating jobs", response)
                  this.snackBar.open(constants.messages.errorMessage, 'X', {
                    duration: 5000
                  });
                }
              },
              error: (error) => {
                console.error('Error thrown while updating jobs:', error);
                this.snackBar.open(constants.messages.errorMessage, 'X', {
                  duration: 5000
                });
              }
            })
          } else {
            // Call the service method to save data back to the server
            this._api.postTypeRequest('manageJobs/save', formData).subscribe({
              next: (response: any) => {
                console.log('Form data saved successfully:', response);
                if (response.statusCode == 201) {
                  this.snackBar.open(constants.messages.saveMessage, '', {
                    duration: 5000
                  });
                  this.getJobs();
                  this.onFormReset();
                }

                if (response.statusCode == 500 && response.error.code == '23P01') {
                  this.snackBar.open(constants.messages.machineOccupied, '', {
                    duration: 5000
                  });
                }
              },
              error: (error) => {
                console.error('Error updating data:', error);
              }
            })
          }
        } else {
          // User cancelled, do nothing or show a message
        }
      });
    }
  }

  navigateTo(type, rowElm) {
    let url: string = "";
    let epochStartTime: number = Math.floor(new Date(rowElm.start_time).getTime());
    let epochEndTime: number = Math.floor(new Date(rowElm.end_time).getTime());
    let currentEpochMilliSeconds: number = Math.floor(Date.now());
    let toValue: any;
    const epochPlusOneHour = currentEpochMilliSeconds + 3600000;

    if (epochPlusOneHour <= epochEndTime) {
      toValue = epochPlusOneHour;
    } else {
      toValue = epochEndTime;
    }

    switch (type) {
      case 'machineBoards':
        if (rowElm.actual_qty == 0) {
          url = `http://localhost:4000/d/a5b3500f-697b-4441-b363-f901d6e69fec/machine-snapshot?orgId=1&var-machine=${rowElm.machine}&refresh=5s&from=${epochStartTime}&to=${toValue}&var-job=${rowElm.job_name}`;
        } else {
          url = `http://localhost:4000/d/uzo1X8qVz/machine-snapshot-historical?from=${epochStartTime}&to=${epochEndTime}&var-machine=${rowElm.machine}&var-job=${rowElm.job_name}`;
        }
        break;

      default:
        break;
    }
    window.open(url, '_blank');
  }

  onFormReset() {
    // Reset the form to its initial state
    this.jobForm.reset();
    this.isEdit = false;
    this.jobForm.get('start_time')?.enable();
    this.jobForm.get('end_time')?.enable();
    this.jobForm.get('machine')?.enable();
    this.jobForm.get('job_name')?.enable();
    this.jobForm.get('target_qty')?.enable();
    this.endTimePassedFlag = false;
    this.startTimePassedFlag = false;
    this.initForm();
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;;
    this.pageSize = event.pageSize;
    this.getJobs();
  }

  createFilter(): (data: any, filter: string) => boolean {
    let filterFunction = function (data, filter): boolean {
      let searchTerms = JSON.parse(filter);
      let info = data.job_name ? data.job_name.toLowerCase() : '';
      return (
        info.indexOf(searchTerms.job_name) !== -1 &&
        data.operator_name.toLowerCase().indexOf(searchTerms.operator_name) !== -1
      );
    };
    return filterFunction;
  }

  // Add a method to handle sorting
  sortData(sort: Sort): void {
    const data = this.dataSource.data.slice();
    if (!sort.active || sort.direction === '') {
      this.dataSource.data = data;
      return;
    }

    this.dataSource.data = data.sort((a: any, b: any) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'machine': return this.compare(a.machine, b.machine, isAsc);
        case 'jobName': return this.compare(a.job_name, b.job_name, isAsc);
        case 'operatorName': return this.compare(a.operator_name, b.operator_name, isAsc);
        case 'targetQty': return this.compare(a.target_qty, b.target_qty, isAsc);
        case 'actualQty': return this.compare(a.actual_qty, b.actual_qty, isAsc);
        case 'startTime': return this.compareDates(a.start_time, b.start_time, isAsc);
        case 'endTime': return this.compareDates(a.end_time, b.end_time, isAsc);

        // Add more cases for additional columns
        default: return 0;
      }
    });
  }

  // Add a helper function to compare values for sorting
  compare(a: number | string, b: number | string, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  // Add a helper function to compare dates for sorting
  compareDates(a: string, b: string, isAsc: boolean): number {
    const dateA = new Date(a).getTime();
    const dateB = new Date(b).getTime();
    return (dateA < dateB ? -1 : 1) * (isAsc ? 1 : -1);
  }
}
