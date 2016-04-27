import 'angular';
import IHttpService = angular.IHttpService;
import {SettingsService} from "./settings";
import IRequestConfig = angular.IRequestConfig;
import IToastService = angular.material.IToastService;
import IHttpPromise = angular.IHttpPromise;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import IHttpPromiseCallbackArg = angular.IHttpPromiseCallbackArg;

export class GitlabApiService {
  static $inject = ['$http', 'settingsService', '$mdToast', '$q'];

  constructor(private $http:IHttpService,
              private settingsService:SettingsService,
              private $mdToast:IToastService,
              private $q:IQService) {
  }

  config():IRequestConfig {
    let settings = this.settingsService.load();
    return {
      method: 'GET',
      url: settings.url,
      headers: {
        'PRIVATE-TOKEN': settings.token
      }
    };
  }

  getByConfig(config:IRequestConfig):IHttpPromise<any> {
    console.log('GET', config);
    return this.$http(config)
      .then((result:IHttpPromiseCallbackArg<Array>) => {
        console.log('GOT', result);
        let link = result.headers('link');
        let url = this.nextPage(link);
        console.log('nextPage', url);
        if (url) {
          let config = this.config();
          config.url = url;
          return this.getByConfig(config)
            .then((nextPage) => result.data.concat(nextPage));
        } else {
          return result.data;
        }
      })
      .catch((result) => {
        console.log('FAIL', result);
        let message = `GET failed: ${result.config.url} ${result.statusText}`;
        this.$mdToast.showSimple(message);
        this.$q.reject(message);
      })
  }

  get(url:string, page:number = 1, perPage:number = 100):IHttpPromise<any> {
    let config = this.config();
    config.url += url;
    config.params = {
      page: page,
      per_page: perPage
    };
    return this.getByConfig(config);
  }

  nextPage(link):string {
    if (link) {
      let matches = link.match(/<([^>]+)>; rel="next"/);
      return matches && matches[1];
    }
  }

  builds(id:number) {
    return <IPromise<any[]>>this.get(`/api/v3/projects/${id}/builds`);
  }

  projects() {
    return <IPromise<any[]>>this.get('/api/v3/projects');
  }
}

export const GitlabApiModule = angular
  .module('GitlabApi', [])
  .service('gitlabApi', GitlabApiService);
