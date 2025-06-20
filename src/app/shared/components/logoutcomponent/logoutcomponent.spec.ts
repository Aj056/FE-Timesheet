import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Logoutcomponent } from './logoutcomponent';

describe('Logoutcomponent', () => {
  let component: Logoutcomponent;
  let fixture: ComponentFixture<Logoutcomponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Logoutcomponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Logoutcomponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
