import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Employeecomponent } from './employeecomponent';

describe('Employeecomponent', () => {
  let component: Employeecomponent;
  let fixture: ComponentFixture<Employeecomponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Employeecomponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Employeecomponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
