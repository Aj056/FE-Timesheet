import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { Observable } from "rxjs";
import { Employee } from "../../interfaces/common.interfaces";

@Injectable({ providedIn: 'root' })
export class EmployeeDataService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getEmployeeDetailWithID(empId: string) {
    return this.http.get(`${this.baseUrl}/view/${empId}`);
  }

  getAllEmployee(): Observable<{ data: Employee[] }> {
    return this.http.get<{ data: Employee[] }>(`${this.baseUrl}/allemp`);
  }

  deleteEmployee(employeeId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete/${employeeId}`);
  }
}
