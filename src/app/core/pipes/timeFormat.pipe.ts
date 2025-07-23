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
    
    // Check if the time is already in HH:MM format (like "18:30")
    if (typeof timeString === 'string' && timeString.match(/^\d{1,2}:\d{2}$/)) {
      return this.convert24To12Hour(timeString);
    }

    // Fallback to original timestamp handling
    const date = new Date(timeString);
    if (isNaN(date.getTime())) {
      return ''; 
    }

    return this.convert24To12Hour(`${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`);
  }

  private convert24To12Hour(time24: string): string {
    // Split the time string into hours and minutes
    const [hoursStr, minutesStr] = time24.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = minutesStr;
    
    // Convert to 12-hour format
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours || 12; // Convert 0 to 12 for 12-hour format

    return `${hours}:${minutes} ${ampm}`;
  }
}