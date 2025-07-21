import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { EmployeesList } from './employees-list';
import { EmployeeService } from '../../core/services/employee.service';
import { Employee } from '../../core/interfaces/common.interfaces';
import { ToastService } from '../../core/services/toast.service';
import { PopupService } from '../../core/services/popup.service';

describe('EmployeesList', () => {
  let component: EmployeesList;
  let fixture: ComponentFixture<EmployeesList>;
  let mockEmployeeService: jasmine.SpyObj<EmployeeService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockPopupService: jasmine.SpyObj<PopupService>;

  const mockEmployees: Employee[] = [
    { 
      id: '1', 
      name: 'John Doe', 
      username: 'john.doe', 
      email: 'john@company.com', 
      role: 'employee', 
      status: true,
      department: 'IT',
      designation: 'Developer'
    },
    { 
      id: '2', 
      name: 'Jane Smith', 
      username: 'jane.smith', 
      email: 'jane@company.com', 
      role: 'manager', 
      status: true,
      department: 'HR',
      designation: 'Manager'
    },
    { 
      id: '3', 
      name: 'Bob Johnson', 
      username: 'bob.johnson', 
      email: 'bob@company.com', 
      role: 'admin', 
      status: false,
      department: 'Admin',
      designation: 'Administrator'
    }
  ];

  beforeEach(async () => {
    const employeeServiceSpy = jasmine.createSpyObj('EmployeeService', ['getAllEmployees', 'deleteEmployee']);
    const toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);
    const popupServiceSpy = jasmine.createSpyObj('PopupService', ['confirm']);

    await TestBed.configureTestingModule({
      imports: [EmployeesList, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: EmployeeService, useValue: employeeServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: PopupService, useValue: popupServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeesList);
    component = fixture.componentInstance;
    
    mockEmployeeService = TestBed.inject(EmployeeService) as jasmine.SpyObj<EmployeeService>;
    mockToastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    mockPopupService = TestBed.inject(PopupService) as jasmine.SpyObj<PopupService>;

    mockEmployeeService.getAllEmployees.and.returnValue(of({
      success: true,
      employees: mockEmployees
    }));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load employees on init', () => {
    component.ngOnInit();
    expect(mockEmployeeService.getAllEmployees).toHaveBeenCalled();
    expect(component.employees().length).toBe(3);
  });

  it('should initialize with empty search term', () => {
    expect(component.searchTerm()).toBe('');
    expect(component.isSearchActive()).toBeFalse();
  });

  it('should filter employees by name', () => {
    component.employees.set(mockEmployees);
    component.onSearchChange('John');
    
    const filtered = component.filteredEmployees();
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('John Doe');
  });

  it('should filter employees by email', () => {
    component.employees.set(mockEmployees);
    component.onSearchChange('jane@company.com');
    
    const filtered = component.filteredEmployees();
    expect(filtered.length).toBe(1);
    expect(filtered[0].email).toBe('jane@company.com');
  });

  it('should return all employees when search term is empty', () => {
    component.employees.set(mockEmployees);
    component.onSearchChange('');
    
    const filtered = component.filteredEmployees();
    expect(filtered.length).toBe(3);
  });

  it('should return no results for non-matching search', () => {
    component.employees.set(mockEmployees);
    component.onSearchChange('nonexistent');
    
    const filtered = component.filteredEmployees();
    expect(filtered.length).toBe(0);
  });

  it('should clear search when clearSearch is called', () => {
    component.onSearchChange('test');
    expect(component.searchTerm()).toBe('test');
    
    component.clearSearch();
    expect(component.searchTerm()).toBe('');
    expect(component.isSearchActive()).toBeFalse();
  });

  it('should return correct search results count', () => {
    component.employees.set(mockEmployees);
    component.onSearchChange('company.com');
    
    expect(component.getSearchResultsCount()).toBe(3);
  });
});
