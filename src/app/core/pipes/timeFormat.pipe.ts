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
    if (!isNaN(date.getTime())) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      return this.convert24To12Hour(`${hours}:${minutes}`);
    }

    console.error('❌ Invalid date format:', timeString);
    return '--';
  }

  private convert24To12Hour(time24: string): string {
    const [hoursStr, minutesStr] = time24.split(':');
    let hours = parseInt(hoursStr, 10);
    let minutes = minutesStr.padStart(2, '0');

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    return `${hours}:${minutes} ${ampm}`;
  }
}
