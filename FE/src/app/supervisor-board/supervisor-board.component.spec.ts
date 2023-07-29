import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupervisorBoardComponent } from './supervisor-board.component';

describe('SupervisorBoardComponent', () => {
  let component: SupervisorBoardComponent;
  let fixture: ComponentFixture<SupervisorBoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SupervisorBoardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SupervisorBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
