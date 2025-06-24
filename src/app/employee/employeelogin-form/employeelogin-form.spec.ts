import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeloginForm } from './employeelogin-form';

describe('EmployeeloginForm', () => {
  let component: EmployeeloginForm;
  let fixture: ComponentFixture<EmployeeloginForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeloginForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeloginForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
