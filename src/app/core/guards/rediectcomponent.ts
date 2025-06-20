import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Authservice } from '../services/auth.service';

@Component({
  selector: 'app-redirect',
  template: ''
})
export class RedirectComponent implements OnInit {
  constructor(private auth: Authservice, private router: Router) {}

  ngOnInit() {
    const role = this.auth.getuserrole();
    if (role === 'admin') {
      this.router.navigate(['/admin']);
    } else if (role === 'employee') {
      this.router.navigate(['/employee']);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
}
