import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
@Injectable({ providedIn: 'root' })
export class EmployeeDataService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getEmployeeDetailWithID(empId: string) {
    return this.http.get(`${this.baseUrl}/view/${empId}`);
  }

  getAllEmployee() {

  }
}