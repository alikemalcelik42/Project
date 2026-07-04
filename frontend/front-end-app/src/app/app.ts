import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  pageTitle:string = "Test aaa";
  data = [
    "Ali",
    "Veli",
    "Can"
  ];
}
