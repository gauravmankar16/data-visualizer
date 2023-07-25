import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../services/api.service'
import { MatTableDataSource } from '@angular/material/table';
import { constants } from '../util/constants/constants';
import { Jobs } from '../util/models/jobs.model';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { JobService } from '../services/job.service';
import { MatSort, Sort } from '@angular/material/sort';

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

  currentPage = 0;
  pageSize = 2;
  totalCount: number;

  filterValues = {
    job_name: '',
    operator_name: ''
  }

  jobForm: FormGroup;
  jobData: any;

  displayedColumns: string[] = ['machine', 'jobName', 'operatorName', 'targetQty', 'actualQty', 'startTime', 'endTime', 'remarks'];

  constructor(private jobService: JobService, private formBuilder: FormBuilder, private _api: ApiService) { }

  ngOnInit(): void {
    this.getJobs();

    this.jobForm = this.formBuilder.group({
      id: [5],
      machine: ['', Validators.required],
      job_name: ['', Validators.required],
      operator_name: ['', [Validators.required]],
      target_qty: [0, Validators.required],
      actual_qty: [0, Validators.required],
      start_time: ['', Validators.required],
      end_time: ['', Validators.required],
      remarks: ['', Validators.required]
    });
  }

  ngAfterViewInit() {

  }

  async getJobs() {
    try {
      let response: any = await this.jobService.getAllJobs(this.currentPage, this.pageSize);
      console.log(response, 'heya');

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

    }
  }

  selectRow(row) {
    console.log(row, 'heyyyy');
    this.jobForm.patchValue({
      id: row.id,
      machine: row.machine,
      job_name: row.job_name,
      operator_name: row.operator_name,
      target_qty: row.target_qty,
      actual_qty: row.actual_qty,
      start_time: new Date(row.start_time).toISOString(),
      end_time: new Date(row.end_time).toISOString(),
      remarks: row.remarks
    });
  }

  onFormSubmit(): void {
    if (this.jobForm.valid) {
      const formData = this.jobForm.value;
      formData['updated_by'] = JSON.parse(localStorage.getItem('userData') || '{}')?.rows[0]?.username;
      // Call the service method to send the updated data back to the server
      this._api.postTypeRequest('manageJobs/save', formData).subscribe({
        next: (response) => {
          this.jobForm.reset();
          this.getJobs();
          console.log('Form data updated successfully:', response);
        },
        error: (error) => {
          console.error('Error updating data:', error);
        }
      })

    }
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
