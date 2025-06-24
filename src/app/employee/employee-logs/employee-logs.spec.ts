import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeLogs } from './employee-logs';

describe('EmployeeLogs', () => {
  let component: EmployeeLogs;
  let fixture: ComponentFixture<EmployeeLogs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeLogs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeLogs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
