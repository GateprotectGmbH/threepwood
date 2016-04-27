import 'angular';
import IHttpService = angular.IHttpService;
import {SettingsService} from "./settings";
import IRequestConfig = angular.IRequestConfig;
import IToastService = angular.material.IToastService;
import IHttpPromise = angular.IHttpPromise;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import IHttpPromiseCallbackArg = angular.IHttpPromiseCallbackArg;

type Records = Array<{[index:string]:any}>;

export interface Project {
  id:number;
  path_with_namespace:string;
  builds_enabled:boolean;
  [index:string]:any;
}

export interface Build {
  id:number;
  name:string;
  ref:string;
  status:string;
  created_at:string;
  started_at:string;
  finished_at:string;
  derived:{
    startedAt:number;
    jobKey:string;
    projectName:string;
    id:string;
  },
  project:Project;
  [index:string]:any;
}


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

  getByConfig(config:IRequestConfig):IPromise<Records> {
    console.log('GET', config);
    return this.$http<Records>(config)
      .then((result:IHttpPromiseCallbackArg<Records>):IPromise<Records> => {
        console.log('GOT', result);
        let link = result.headers('link');
        let url = this.nextPage(link);
        console.log('nextPage', url);
        if (url) {
          let config = this.config();
          config.url = url;
          return this.getByConfig(config)
            .then((nextPage:Records):Records => result.data.concat(nextPage));
        } else {
          return this.$q.when(result.data);
        }
      })
      .then((array:Records):Records => array)
      .catch((result) => {
        console.log('FAIL', result);
        let message = `GET failed: ${result.config.url} ${result.statusText}`;
        this.$mdToast.showSimple(message);
        return this.$q.reject(message);
      })
  }

  get(url:string, page:number = 1, perPage:number = 100):IPromise<Records> {
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

  builds(projectId:number):IPromise<Build[]> {
    return this.get(`/api/v3/projects/${projectId}/builds`);
  }

  projects():IPromise<Project[]> {
    return this.get('/api/v3/projects');
  }
}

export const GitlabApiModule = angular
  .module('GitlabApi', [])
  .service('gitlabApi', GitlabApiService);
