import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './chapter-layout.component.html',
  styleUrl: './chapter-layout.component.scss'
})
export class ChapterLayoutComponent {
}
