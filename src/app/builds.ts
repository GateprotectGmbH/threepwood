import 'angular';
import {GitlabApiService, Build, Project} from "./gitlab-api";
import {SettingsService} from "./settings";
import IQService = angular.IQService;
import IPromise = angular.IPromise;
import IToastService = angular.material.IToastService;

export class BranchSummary {
  projects:ProjectSummary[] = [];
  shortName:string;
  description:string;
  issueId:string;

  constructor(public branchName:string) {
    this.extractFromName(branchName);
  }

  extractFromName(name:string) {
    let taskRegex = /^(.*-(\d+))(_|-)(.*)$/;
    let matches = name.match(taskRegex);
    if (matches) {
      this.shortName = matches[1];
      this.issueId = matches[2];
      this.description = matches[4];
    } else {
      this.shortName = name;
    }
  }

  add(projectSummary:ProjectSummary) {
    this.projects = this.projects.concat(projectSummary);
  }

  theme():string {
    if (this.success()) {
      return 'success';
    } else if (this.failed()) {
      return 'failed';
    } else if (this.cancelled()) {
      return 'cancelled';
    } else if (this.running()) {
      return 'running';
    } else {
      return 'unknown';
    }
  }

  // if all success then success
  success():boolean {
    return this.projects.every(project => project.success());
  }

  // if any failed then failed
  failed():boolean {
    return !!this.projects.find(project => project.failed());
  }

  // if any cancelled then cancelled
  cancelled():boolean {
    return !!this.projects.find(project => project.cancelled());
  }

  // if any running then running
  running():boolean {
    return !!this.projects.find(project => project.running());
  }
}

export class ProjectSummary {
  builds:Build[] = [];

  constructor(public projectName:string,
              public branchName:string) {
  }

  theme():string {
    if (this.success()) {
      return 'success';
    } else if (this.failed()) {
      return 'failed';
    } else if (this.cancelled()) {
      return 'cancelled';
    } else if (this.running()) {
      return 'running';
    } else {
      return 'unknown';
    }
  }

  add(build:Build) {
    this.builds = this.builds.concat(build);
  }

  // if any running then status is running
  running():boolean {
    return this.builds.filter(build => build.status === 'running').length > 0;
  }

  // if any failed then status is failed
  failed():boolean {
    return this.builds.filter(build => build.status === 'failed').length > 0;
  }

  // if any cancelled then status is cancelled
  cancelled():boolean {
    return this.builds.filter(build => build.status === 'canceled').length > 0;
  }

  // if all success then status is success
  success():boolean {
    return this.builds.every(build => build.status === 'success');
  }
}

export class BuildsService {
  static $inject = ['gitlabApi', 'settingsService', '$q', '$mdToast'];

  constructor(private gitlabApi:GitlabApiService,
              private settingsService:SettingsService,
              private $q:IQService,
              private $mdToast:IToastService) {
  }

  loadProjects(projectMatch:string):IPromise<Project[]> {
    return this.gitlabApi.projects()
      .then(filterByProjectMatch)
      .then(filterByProjectHasBuilds)
      .then(toastProjects.bind(this))
      .then(logResult('projects'));

    function toastProjects(projects:Project[]):Project[] {
      let names = projects.map(project => project.path_with_namespace);
      let message = `Matched projects ${names.join(', ')}`;
      this.$mdToast.showSimple(message);
      return projects;
    }

    function filterByProjectMatch(projects:Project[]):Project[] {
      let regex = new RegExp(projectMatch, 'i');
      return projects.filter((project) => regex.test(project.path_with_namespace));
    }

    function filterByProjectHasBuilds(projects:Project[]):Project[] {
      return projects.filter((project) => project.builds_enabled);
    }
  }

  loadProjectSummaries(project:Project):IPromise<ProjectSummary[]> {
    let branchMatch = this.settingsService.load().branchMatch;

    return this.gitlabApi.builds(project.id)
      .then(filterByBranchMatch)
      .then(addProject)
      .then(addDerived)
      .then(orderByStartedAtDescending)
      .then(filterByMostRecentBranchJob)
      .then(convertToProjectSummaries)
      .then(logResult('projectSummary'));

    function convertToProjectSummaries(builds:Build[]):ProjectSummary[] {
      let projectSummaries:{[index:string]:ProjectSummary} = {};
      builds.forEach((build) => {
        let branchName = build.ref;
        let projectName = build.derived.projectName;
        let summary = projectSummaries[branchName];
        if (!summary) {
          summary = projectSummaries[branchName] = new ProjectSummary(projectName, branchName);
        }
        summary.add(build);
      });
      return Object.keys(projectSummaries).map((key) => projectSummaries[key]);
    }

    function orderByStartedAtDescending(builds:Build[]):Build[] {
      return builds.sort((a, b) => b.derived.startedAt - a.derived.startedAt);
    }

    function addDerived(builds:Build[]):Build[] {
      builds.forEach((build) => {
        build.derived = {
          startedAt: new Date(build.started_at).getTime(),
          jobKey: `${build.ref}/${build.name}`,
          projectName: build.project.path_with_namespace,
          id: `${build.project.path_with_namespace}/${build.id}`
        }
      });
      return builds;
    }

    function filterByBranchMatch(builds:Build[]):Build[] {
      let regex = new RegExp(branchMatch, 'i');
      return builds.filter((build) => regex.test(build.ref));
    }

    function filterByMostRecentBranchJob(builds:Build[]):Build[] {
      let seen = {};
      return builds.filter((build) => {
        if (seen[build.derived.jobKey]) {
          return false;
        }
        seen[build.derived.jobKey] = true;
        return true;
      })
    }

    function addProject(builds:Build[]):Build[] {
      builds.forEach((build) => build.project = project);
      return builds;
    }
  }

  loadBranchSummaries(projects:Project[]):IPromise<BranchSummary[]> {
    let promises = projects.map((project) => this.loadProjectSummaries(project));
    return this.$q.all(promises)
      .then(flattenProjectSummaries)
      .then(convertToBranchSummaries);

    function convertToBranchSummaries(projectSummaries:ProjectSummary[]):BranchSummary[] {
      let branchSummaries:{[index:string]:BranchSummary} = {};
      projectSummaries.forEach((projectSummary) => {
        let branchName = projectSummary.branchName;
        let branchSummary = branchSummaries[branchName];
        if (!branchSummary) {
          branchSummary = branchSummaries[branchName] = new BranchSummary(branchName);
        }
        branchSummary.add(projectSummary);
      });
      return Object.keys(branchSummaries).map((key) => branchSummaries[key]);
    }

    function flattenProjectSummaries(projectsSummaries:Array<ProjectSummary[]>):ProjectSummary[] {
      if (projectsSummaries.length) {
        return projectsSummaries.reduce((a, b) => a.concat(b));
      } else {
        return [];
      }
    }
  }

}

function logResult(message) {
  return (result) => {
    console.log(message, result);
    return result;
  }
}

export const BuildsModule = angular
  .module('Builds', [])
  .service('buildsService', BuildsService);
