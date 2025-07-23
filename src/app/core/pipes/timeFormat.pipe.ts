import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatTime'
})
export class FormatTimePipe implements PipeTransform {
  transform(timelog: any[]|undefined, type: 'checkin' | 'checkout'): string {
    if (!timelog || !timelog.length || !timelog[0][type]) {
      return '';
    }

    const timeString = timelog[0][type];
    const date = new Date(timeString);

    if (isNaN(date.getTime())) {
      return ''; 
    }

    const hours = date.getHours();
    const minutes = date.getMinutes();

    const formattedHours = ((hours + 11) % 12 + 1); 
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedMinutes = minutes.toString().padStart(2, '0');

    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  }
}
