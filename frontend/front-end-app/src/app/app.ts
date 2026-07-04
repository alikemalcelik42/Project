import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  pageTitle:string = "Test aaa";
  names:Array<String> = [
    "Ali",
    "Veli",
    "Can"
  ];
  name = "";

  ekle() {
    if(this.name.trim()) {
      this.names.push(this.name);
    }
  }
}
