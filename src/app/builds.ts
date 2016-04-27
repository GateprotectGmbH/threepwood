import 'angular';
import {GitlabApiService} from "./gitlab-api";
import {SettingsService} from "./settings";
import IQService = angular.IQService;
import IPromise = angular.IPromise;

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

export class BranchSummary {
  projects:ProjectSummary[] = [];

  constructor(public branchName:string) {
  }

  add(projectSummary:ProjectSummary) {
    this.projects = this.projects.concat(projectSummary);
  }
}

export class ProjectSummary {
  builds:Build[] = [];

  constructor(public projectName:string,
              public branchName:string) {
  }

  add(build:Build) {
    this.builds = this.builds.concat(build);
  }
  
  success():boolean {
    let notSuccess = this.builds.filter((build) => build.status !== 'success');
    return notSuccess.length === 0;
  }
}

export class BuildsService {
  static $inject = ['gitlabApi', 'settingsService', '$q'];

  constructor(private gitlabApi:GitlabApiService,
              private settingsService:SettingsService,
              private $q:IQService) {
  }


  loadProjects():IPromise<Project[]> {
    let projectMatch = this.settingsService.load().projectMatch;

    return this.gitlabApi.projects()
      .then(filterByProjectMatch)
      .then(filterByProjectHasBuilds)
      .then(logResult('projects'));

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

    function convertToBranchSummaries(projectSummaries: ProjectSummary[]):BranchSummary[] {
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
