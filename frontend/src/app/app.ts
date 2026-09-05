import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({ selector:'app-root', imports:[RouterOutlet,RouterLink,RouterLinkActive], changeDetection:ChangeDetectionStrategy.OnPush, templateUrl:'./app.html', styleUrl:'./app.css' })
export class App { protected readonly menuOpen=signal(false); protected readonly year=new Date().getFullYear(); }
