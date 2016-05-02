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

// gitlab project entity
export interface Project {
  id:number;
  path_with_namespace:string;
  builds_enabled:boolean;
  [index:string]:any;
}

// gitlab build entity
export interface Build {
  id:number;
  name:string;
  ref:string;
  status:string;
  created_at:string;
  started_at:string;
  finished_at:string;
  commit: {
    id:string;
    author_name:string;
    author_email:string;
    created_at:string;
    short_id:string;
    title:string;
    message:string;
  }
  [index:string]:any;
}


export class GitlabApiService {
  static $inject = ['$http', 'settingsService', '$mdToast', '$q'];

  constructor(private $http:IHttpService,
              private settingsService:SettingsService,
              private $mdToast:IToastService,
              private $q:IQService) {
  }

  // return default $http config object
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

  // get records specified by config. auto-get every subsequent page for a paged interface.
  // returns all pages of records as a single array.
  getByConfig(config:IRequestConfig):IPromise<Records> {
    console.log('GET', config);
    return this.$http<Records>(config)
      .then((result:IHttpPromiseCallbackArg<Records>):IPromise<Records> => {
        console.log('GOT', result);
        let link = result.headers('link');
        let url = this.nextPageUrl(link);
        console.log('nextPageUrl', url);
        if (url) {
          let config = this.config();
          config.url = url;
          return this.getByConfig(config)
            .then((nextPageUrl:Records):Records => result.data.concat(nextPageUrl));
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

  // query for records from url. assume a paged interface and default to 1st page and 100 records
  get(url:string, page:number = 1, perPage:number = 100):IPromise<Records> {
    let config = this.config();
    config.url += url;
    config.params = {
      page: page,
      per_page: perPage
    };
    return this.getByConfig(config);
  }

  // extract next page url from link
  nextPageUrl(link):string {
    if (link) {
      let matches = link.match(/<([^>]+)>; rel="next"/);
      return matches && matches[1];
    }
  }

  // query gitlab for all builds within project
  builds(projectId:number):IPromise<Build[]> {
    return this.get(`/api/v3/projects/${projectId}/builds`);
  }

  // query gitlab for all projects
  projects():IPromise<Project[]> {
    return this.get('/api/v3/projects');
  }
}

export const GitlabApiModule = angular
  .module('GitlabApi', [])
  .service('gitlabApi', GitlabApiService);
