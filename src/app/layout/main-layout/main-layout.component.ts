import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {FooterComponent} from '../../shared/footer/footer.component';
import {NavbarComponent} from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, FooterComponent, NavbarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
}
