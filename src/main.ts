/// <reference path="../typings/browser.d.ts" />

import 'angular';
import 'angular-material';
import './polyfill';
import {AppModule} from './app/app';
import './styles/app.css!';

// placeholder for templates
angular.module('cc-templates', []);

angular
  .module('gitlab-monitor', [
    AppModule.name,
    'cc-templates'
  ]);
