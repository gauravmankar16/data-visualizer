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
  endTimePassedFlag: boolean = false;
  startTimePassedFlag: boolean = false;

  currentPage = 0;
  pageSize = 10;
  totalCount: number;
  rowSelected: any;

  filterValues = {
    job_name: '',
    operator_name: ''
  }

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
      actual_qty: [0, Validators.required],
      start_time: ['', Validators.required],
      end_time: ['', Validators.required],
      remarks: ['System generated: Actual quantity is not updated']
    });
  }

  onStartTimeChange() {
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

    if(this.isEdit && !this.jobForm.controls['end_time'].disabled) {
      let selectedRowEndTime = new Date(this.rowSelected.end_time).toISOString().slice(0, 16)
      if (new Date(this.jobForm.value.end_time) < new Date(selectedRowEndTime)) {
        this.autoAdjustTargetQty(this.rowSelected, this.jobForm);
      } else {
        // this.jobForm.controls['end_time'].setValue(selectedRowEndTime);
        // this.snackBar.open('End time cannot be increased after setting once. Please create new job', 'X', {
        //   duration: 5000
        // });
      }
    }
  }

  newTargetQtyAfterAdjusting: number
  autoAdjustTargetQty(rowSelected, jobForm) {
    let orgEndTime = new Date(new Date(rowSelected.end_time).toISOString().slice(0, 16)).getTime();
    let orgStartTime = new Date(new Date(rowSelected.start_time).toISOString().slice(0, 16)).getTime()
    const originalDiff = Math.round((orgEndTime - orgStartTime) / 60000);

    const updatedDiff = Math.round((new Date(jobForm?.get('end_time')?.value).getTime() - new Date(jobForm?.get('start_time')?.value).getTime()) / 60000);
    const newTargetQty = Math.round(rowSelected.target_qty * updatedDiff / originalDiff);
    console.log(newTargetQty, 'newTargetQty\n');
    this.newTargetQtyAfterAdjusting = newTargetQty
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
    this.rowSelected = row;
    this.isEdit = true;
    this.jobForm.patchValue({
      id: row.id,
      machine: row.machine,
      job_name: row.job_name,
      operator_name: row.operator_name,
      target_qty: row.target_qty,
      actual_qty: row.actual_qty,
      start_time: this.formatDateTimeLocal(row.start_time),
      end_time: this.formatDateTimeLocal(row.end_time),
      remarks: row.remarks
    });

    this.jobForm.get('machine')?.disable();
    this.jobForm.get('job_name')?.disable();
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
    } else {
      this.jobForm.get('end_time')?.setErrors(null);
      this.endTimePassedFlag = false;
      this.jobForm.get('start_time')?.enable();
      this.jobForm.get('end_time')?.enable();
    }

    if(startTimeValue && endTimeValue && startTimeValue < currentTime) {
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
    const formattedDateTime = `${dateTime.toISOString().slice(0, 16)}`;
    return formattedDateTime;
  }

  onFormSubmit(): void {
    if (this.jobForm.valid) {
      // Show the confirmation dialog before saving
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '400px',
        data: { title: 'Confirm', message: 'Are you sure you want to save?' },
      });

      // Handle the dialog result when the user closes the dialog
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          // User confirmed, proceed with saving
          let formData: any = {
            // actual_qty: 0,
            // end_time: new Date(),
            // id: 0,
            // job_name: '',
            // machine: '',
            // operator_name: '',
            // remarks: '',
            // start_time: new Date(),
            // target_qty: 0,
            // update_by: ''
          };
          console.log("Form Data : ",formData)
          Object.assign(formData, this.jobForm.getRawValue());
          formData['updated_by'] = JSON.parse(localStorage.getItem('userData') || '{}')?.rows[0]?.username;
          if (this.isEdit) {
            formData['target_qty'] = this.newTargetQtyAfterAdjusting ? this.newTargetQtyAfterAdjusting : formData['target_qty'];
            console.log(formData, 'formDataformData');
            // Call the service method to send the updated data back to the server
            this._api.postTypeRequest('manageJobs/update', formData).subscribe({
              next: (response: any) => {
                this.jobForm.reset();
                this.getJobs();
                if (response.statusCode == 200) {
                  console.log('Form data updated successfully:', response);
                  this.snackBar.open(constants.messages.updateMessage, 'X', {
                    duration: 4000
                  });
                } else {
                  console.log("Error while updating jobs", response)
                  this.snackBar.open(constants.messages.errorMessage, 'X', {
                    duration: 4000
                  });
                }
              },
              error: (error) => {
                console.error('Error thrown while updating jobs:', error);
                this.snackBar.open(constants.messages.errorMessage, 'X', {
                  duration: 4000
                });
              }
            })
          } else {
            // Call the service method to save data back to the server
            this._api.postTypeRequest('manageJobs/save', formData).subscribe({
              next: (response: any) => {
                this.jobForm.reset();
                this.getJobs();
                console.log('Form data saved successfully:', response);
                if (response.statusCode == 201) {
                  this.snackBar.open(constants.messages.saveMessage, '', {
                    duration: 4000
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

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
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
