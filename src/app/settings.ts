import 'angular';
import IWindowService = angular.IWindowService;
import ISidenavService = angular.material.ISidenavService;
import IRootScopeService = angular.IRootScopeService;

export class SettingsConfig {
  constructor(public url:string = 'https://gitlab.lan.adytonsystems.com',
              public token:string = '',
              public projectMatch:string = 'web/web|web/bagel',
              public branchMatch:string = '') {
  }
}

export class SettingsService {
  static $inject = ['$window', '$rootScope'];
  config:SettingsConfig;

  constructor(private $window:IWindowService,
              private $rootScope:IRootScopeService) {
  }

  save(config:SettingsConfig) {
    this.$window.localStorage.setItem('settings', JSON.stringify(config));
    this.config = null; // reload from storage on next load()
    this.$rootScope.$broadcast('reload:projects');
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

  configured():boolean {
    let config = this.load();
    return config.url && config.url.toString().length > 0 &&
      config.token && config.token.toString().length > 0;
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
    this.$mdSidenav('sidenav').close();
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
