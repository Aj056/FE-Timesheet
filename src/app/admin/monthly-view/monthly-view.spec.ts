import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyView } from './monthly-view';

describe('MonthlyView', () => {
  let component: MonthlyView;
  let fixture: ComponentFixture<MonthlyView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthlyView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonthlyView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
