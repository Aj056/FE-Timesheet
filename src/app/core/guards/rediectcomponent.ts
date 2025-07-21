import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-redirect',
  standalone: true,
  template: '<div>Redirecting...</div>',
  styles: [`
    div {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-size: 18px;
      color: #666;
    }
  `]
})
export class RedirectComponent implements OnInit {
  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    const role = this.auth.getUserRole();
    console.log('🔄 Redirect component - Current role:', role);
    
    if (role === 'admin') {
      console.log('🔄 Redirecting to admin dashboard');
      this.router.navigate(['/admin']);
    } else if (role === 'employee') {
      console.log('🔄 Redirecting to employee dashboard');
      this.router.navigate(['/employee']);
    } else {
      console.log('🔄 No role found, redirecting to login');
      this.router.navigate(['/auth/login']);
    }
  }
}
