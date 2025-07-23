import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatTime'
})
export class FormatTimePipe implements PipeTransform {
  transform(timelog: any[] | undefined, type: 'checkin' | 'checkout'): string {
    if (!timelog || !timelog.length || !timelog[0][type]) {
      return '';
    }

    const timeString = timelog[0][type];
    
    if (typeof timeString === 'string' && timeString.match(/^\d{1,2}:\d{2}$/)) {
      return this.convert24To12Hour(timeString);
    }

    const date = new Date(timeString);
    if (isNaN(date.getTime())) {
      return ''; 
    }

    return this.convert24To12Hour(`${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`);
  }

  private convert24To12Hour(time24: string): string {
    const [hoursStr, minutesStr] = time24.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = minutesStr;
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours || 12; 

    return `${hours}:${minutes} ${ampm}`;
  }
}