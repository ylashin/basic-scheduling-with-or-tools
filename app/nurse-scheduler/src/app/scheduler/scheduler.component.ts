import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface DaySchedule {
  day: string;
  shift0: string;
  shift1: string;
  shift2: string;
}

export interface ShiftPreference {
  day: number;
  shift: number;
  nurseId: number;
}

@Component({
  selector: 'app-scheduler',
  templateUrl: './scheduler.component.html',
  styleUrls: ['./scheduler.component.css']
})
export class SchedulerComponent implements OnInit {
  dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  displayedColumns: string[] = ['day', 'shift0', 'shift1', 'shift2'];
  solvedDays: DaySchedule[] = [];

  nurses: {
    id: number;
    name: string;
  }[] = [
      { id: 0, name: 'Mary' },
      { id: 1, name: 'Cathy' },
      { id: 2, name: 'Adam' },
      { id: 3, name: 'Samanth' },
      { id: 4, name: 'John' },
      { id: 5, name: 'William' },
      { id: 6, name: 'Nancy' }
    ];


  selectedNurses: {
    id: number;
    name: string;
  }[] = [];


  constructor(private http: HttpClient, private snackBar: MatSnackBar) {
  }

  ngOnInit(): void {
  }

  solve() {
    this.solvedDays = [];

    let nurseNames = this.selectedNurses.map(x => x.name);
    if (!nurseNames.length) {
      this.snackBar.open('No nurses selected, please select at least 3 nurses!', null, {
        duration: 3000,
        verticalPosition: 'top'
      });
      return;
    }
    let requestBody = {
      "num_nurses": nurseNames.length,
      "num_shifts": 3,
      "num_days": 7,
      "shift_requests": this.getShiftRequests(nurseNames, 3, 7)

    };

    this.http.post('http://schedulesolverapi.eastus.azurecontainer.io:5050/api/solve', requestBody).toPromise().then(response => {
      console.log(response);
      this.renderSolution(nurseNames, response);

    }, error => {
      console.error(error);
      this.snackBar.open('Error generating schedule', null, {
        duration: 3000,
        verticalPosition: 'top'
      });
    });
  }

  renderSolution(nurseNames: string[], response: any) {
    let shiftsSolved: {
      day: number;
      nurse: number;
      shift: number;
    }[] = response.shifts_solved;

    var days: DaySchedule[] = [];

    shiftsSolved.forEach(shift => {
      let dayName = this.dayNames[shift.day];
      var dayEntry = days.find(x => x.day === dayName);
      if (!dayEntry) {
        days.push({ day: dayName, shift0: '', shift1: '', shift2: '' });
        dayEntry = days.find(x => x.day === dayName);
      }

      let nurseName = nurseNames[shift.nurse];

      if (shift.shift === 0)
        dayEntry.shift0 = nurseName;
      if (shift.shift === 1)
        dayEntry.shift1 = nurseName;
      if (shift.shift === 2)
        dayEntry.shift2 = nurseName;
    });
    console.log(days);
    this.solvedDays = days;
  }

  getShiftRequests = (nurseNames, shiftsPerDay, days) => {
    let array = [];
    for (var nurse = 0; nurse < nurseNames.length; nurse++) {
      let nurseArray = [];
      array.push(nurseArray);
      for (var day = 0; day < days; day++) {
        let dayArray = [];
        nurseArray.push(dayArray);
        for (var shift = 0; shift < shiftsPerDay; shift++) {
          /*let requested_nurses = document.querySelector(`#day${day}-shift${shift}`).value.split(',');
          if (requested_nurses.find(x => Number(x) == (nurse + 1)))
            dayArray.push(1);
          else
            dayArray.push(0);*/
          dayArray.push(0);
        }
      }
    }

    return array;
  }



}
