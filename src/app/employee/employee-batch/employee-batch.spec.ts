import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeBatch } from './employee-batch';

describe('EmployeeBatch', () => {
  let component: EmployeeBatch;
  let fixture: ComponentFixture<EmployeeBatch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeBatch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeBatch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
