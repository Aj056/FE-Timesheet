import { Component,OnInit,resource} from '@angular/core';
import { FormsModule, } from '@angular/forms';
import { Resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-employeelogin-form',
  imports: [FormsModule],
  templateUrl: './employeelogin-form.html',
  styleUrl: './employeelogin-form.scss'
})
export class EmployeeloginForm implements OnInit{
quotes:any
randomQuoteUrl:string ='https://api.realinspire.live/v1/quotes/random?limit=1'
constructor(private http: HttpClient){
 this.getQuotes()
}
ngOnInit(): void {
  console.log(this.quotes.value())
}
 getQuotes(){
  this.quotes = resource({
    loader:async ()=>{
      const data = await fetch(this.randomQuoteUrl)
      return await data.json()
    }
  })
 }
 fetchTime(){
   this.http.get('https://timeapi.io/api/time/current/zone?timeZone=Asia%2FKolkata').subscribe(res => console.log('time',res))
 }
 employee_login(){
  console.log('login')
  this.fetchTime()
 }
 employee_logout(){
   console.log('logout')
   this.fetchTime()
 }
}
