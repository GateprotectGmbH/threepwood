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

  openSettings() {
    this.$mdSidenav('sidenav').toggle();
  }
}
const AppComponent:ng.IComponentOptions = {
  templateUrl: 'src/app/app.html',
  controller: App,
  $routeConfig: [
    {path: '/', component: 'dashboard', name: 'Dashboard', useAsDefault: true}
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
