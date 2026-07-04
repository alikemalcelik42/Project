import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Navi } from './components/navi/navi';
import { Category } from './components/category/category';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, CommonModule, Navi, Category],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}