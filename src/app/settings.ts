import 'angular';
import IWindowService = angular.IWindowService;
import ISidenavService = angular.material.ISidenavService;

export class SettingsConfig {
  url:string;
  token:string;
  projectMatch:string;
  branchMatch:string;

  constructor(public url:string = 'https://gitlab.lan.adytonsystems.com',
              public token:string = '',
              public projectMatch:string = '',
              public branchMatch:string = '') {
  }
}

export class SettingsService {
  static $inject = ['$window'];
  config:SettingsConfig;

  constructor(private $window:IWindowService) {
  }

  save(config:SettingsConfig) {
    this.$window.localStorage.setItem('settings', JSON.stringify(config));
    this.config = null;
  }

  load():SettingsConfig {
    if (this.config) {
      return this.config;
    }
    try {
      let item = this.$window.localStorage.getItem('settings');
      let params = JSON.parse(item);
      this.config = new SettingsConfig(params.url, params.token, params.projectMatch, params.branchMatch);
    }
    catch (e) {
      this.config = new SettingsConfig();
    }
    return this.config;
  }
}

class Settings {
  config:SettingsConfig;
  static $inject = ['settingsService', '$mdSidenav'];

  constructor(private settingsService:SettingsService, private $mdSidenav:ISidenavService) {
    this.config = settingsService.load();
  }

  save() {
    console.log('saving ', this.config);
    this.settingsService.save(this.config);
    this.$mdSidenav('left').close();
  }
}

const SettingsComponent:ng.IComponentOptions = {
  templateUrl: 'src/app/settings.html',
  controller: Settings,
};

export const SettingsModule = angular
  .module('Settings', [])
  .service('settingsService', SettingsService)
  .component('settings', SettingsComponent);
