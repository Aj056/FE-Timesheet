import { Component, OnInit } from '@angular/core';
import { Authservice } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { FormsModule, NgModel } from '@angular/forms';




@Component({
  selector: 'app-logincomponent',
  imports: [FormsModule],
  templateUrl: './logincomponent.html',
  styleUrl: './logincomponent.scss'
})
export class Logincomponent implements OnInit {
  userId:string =''
  password:string=''

  constructor(private auth:Authservice, private router:Router){}
  ngOnInit():void{
     if(this.auth.isLoggedIN()){
        const role = this.auth.getuserrole();
        if(role === 'admin'){
          this.router.navigate(['/admin'])
        }else if(role ==='employee'){
          this.router.navigate(['/employee'])
        }
     }
  }
  onLogin(){
    this.auth.login(this.userId, this.password, ()=>{
      const role = this.auth.getuserrole();
      this.router.navigate([`/${role}`]);
    })
  }
}
