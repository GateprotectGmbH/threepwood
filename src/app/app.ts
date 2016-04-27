import 'angular';
import 'angular-component-router';
import {NotfoundModule} from './notfound';
import {DashboardModule} from "./dashboard";
import {SettingsModule} from "./settings";
import {GitlabApiModule} from "./gitlab-api";

class App {
  static $inject = ['$mdSidenav'];

  constructor(private $mdSidenav:any) {
  }

  openLeftMenu() {
    this.$mdSidenav('left').toggle();
  }
}
const AppComponent:ng.IComponentOptions = {
  templateUrl: 'src/app/app.html',
  controller: App,
  $routeConfig: [
    {path: '/', name: 'RootXX', redirectTo: ['Dashboard']},
    {path: '/dashboard', component: 'dashboard', name: 'Dashboard', useAsDefault: true},
    {path: '/**', component: 'notfound', name: 'NotFound'}
  ]
};

export var AppModule = angular
  .module('app', [
    'ngComponentRouter',
    'ngMaterial',
    DashboardModule.name,
    NotfoundModule.name,
    GitlabApiModule.name,
    SettingsModule.name
  ])
  .value('$routerRootComponent', 'app')
  .config(function ($mdThemingProvider) {

    // Configure a dark theme with primary foreground yellow

    $mdThemingProvider.theme('docs-dark', 'default')
      .primaryPalette('yellow')
      .dark();

  })
  .config(function($mdThemingProvider) {
    $mdThemingProvider.theme('success').backgroundPalette('green').dark()
  })
  .config(function($mdThemingProvider) {
    $mdThemingProvider.theme('running').backgroundPalette('blue').dark()
  })
  .config(function($mdThemingProvider) {
    $mdThemingProvider.theme('failed').backgroundPalette('red').dark()
  })
  .component('app', AppComponent);
