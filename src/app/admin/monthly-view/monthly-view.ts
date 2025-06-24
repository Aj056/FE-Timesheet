import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-monthly-view',
  imports: [FormsModule],
  templateUrl: './monthly-view.html',
  styleUrl: './monthly-view.scss',
  standalone:true,
})
export class MonthlyView {
  // constructor(private http: HttpClient) {}
 selectedMonth = '06';
selectedYear = new Date().getFullYear();
years = [2024, 2025];
months = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
];

logs = []; // loaded from API
filteredLogs = [];

loadLogs() {
  const monthPrefix = `${this.selectedYear}-${this.selectedMonth}`;
  // replace with actual API call
  // this.http.get<any[]>('http://localhost:3000/logs').subscribe(all => {
  //   this.filteredLogs = all
  //     .filter(log => log.date.startsWith(monthPrefix))
  //     .map(log => ({
  //       ...log,
  //       name: this.getEmployeeName(log.employeeId)
  //     }));
  // });
}

getEmployeeName(id: string){
  // const emp = this.employees.find(e => e.id === id);
  // return emp?.name || 'Unknown';
}

ngOnInit() {
  // this.http.get<any[]>('http://localhost:3000/employees').subscribe(data => {
  //   this.employees = data;
  //   this.loadLogs();
  // });
}

}
