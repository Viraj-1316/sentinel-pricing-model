import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
const theme = localStorage.getItem('theme') || 'light';
document.body.setAttribute('data-theme', theme);
