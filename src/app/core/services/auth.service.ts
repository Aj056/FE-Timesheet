import { Injectable } from "@angular/core";
import { Router } from "@angular/router";

@Injectable({providedIn:'root'})
export class Authservice{
    constructor(private router:Router){

    }
    login(userId:string,password:string, callback:() => void):void{

       const role = userId === 'admin'?'admin' : 'employee';
       const token = 'dummy Token ';
       
       localStorage.setItem('token',token);
       localStorage.setItem('role',role);
       console.log('userid',userId);
       console.log(password);
       callback();
    }
    logout(){
        localStorage.clear();
        this.router.navigate(['auth/login']);
    }
    isLoggedIN(){
        return !!localStorage.getItem('token');
    }
    getuserrole(){
        return localStorage.getItem('role');
    }
}