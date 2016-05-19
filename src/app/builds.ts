import 'angular';
import {GitlabApiService, Project, Build} from "./gitlab-api";
import IQService = angular.IQService;
import IPromise = angular.IPromise;
import IToastService = angular.material.IToastService;

interface Status {
  theme():string;
  success():boolean;
  failed():boolean;
  cancelled():boolean;
  running():boolean;
}

export class Branch implements Status {
  _commits:CommitIndexByProjectName = {};
  shortName:string;
  description:string;
  issueId:string;

  constructor(public branchName:string) {
    this.extractFromName(branchName);
  }

  extractFromName(name:string) {
    let taskRegex = /^(.*(-|_)(\d{3,}))(_|-)(.*)$/;
    let matches = name.match(taskRegex);
    if (matches) {
      this.shortName = matches[1];
      this.issueId = matches[3];
      this.description = matches[5];
    } else {
      this.shortName = name;
    }
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

  projectNames():string[] {
    return Object.keys(this._commits);
  }

  commit(projectName:string):Commit {
    return this._commits[projectName];
  }

  addCommit(projectName:string, commit:Commit) {
    this._commits[projectName] = commit;
  }

  commits():Commit[] {
    return this.projectNames().map(key => this._commits[key]);
  }

  // if all success then success
  success():boolean {
    return this.commits().every(commit => commit.success());
  }

  // if any failed then failed
  failed():boolean {
    return !!this.commits().find(commit => commit.failed());
  }

  // if any cancelled then cancelled
  cancelled():boolean {
    return !!this.commits().find(commit => commit.cancelled());
  }

  // if any running then running
  running():boolean {
    return !!this.commits().find(commit => commit.running());
  }
}
type UniqBranches = {[index:string]:Branch};

export class CommitBuild {
  id:string;
  branchName:string;
  startedAt:number;
  jobKey:string;
  commitId:string;
  running:boolean;
  failed:boolean;
  cancelled:boolean;
  success:boolean;

  constructor(private build:Build) {
    this.startedAt = new Date(build.started_at).getTime();
    this.branchName = build.ref;
    this.jobKey = `${build.ref}/${build.name}`;
    this.commitId = this.build.commit.id;
    this.id = `${this.commitId}/${build.id}`;
    this.running = this.build.status === 'running';
    this.failed = this.build.status === 'failed';
    this.cancelled = this.build.status === 'canceled'; // american spelling
    this.success = this.build.status === 'success';
  }

  // return true if match is a regexp string that matches the branch name 
  branchNameMatch(match:string):boolean {
    let regex = new RegExp(match, 'i');
    return regex.test(this.branchName);
  }
}

export class Commit implements Status {
  builds:CommitBuild[] = [];

  constructor(public id:string,
              public projectName:string,
              public branchName:string) {
  }

  // return url to user view of builds for this commit
  buildsUrl(host:string):string {
    return `${host}/${this.projectName}/commit/${this.id}/builds`;
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

  // if any running then status is running
  running():boolean {
    return this.builds.filter(build => build.running).length > 0;
  }

  // if any failed then status is failed
  failed():boolean {
    return this.builds.filter(build => build.failed).length > 0;
  }

  // if any cancelled then status is cancelled
  cancelled():boolean {
    return this.builds.filter(build => build.cancelled).length > 0;
  }

  // if all success then status is success
  success():boolean {
    return this.builds.every(build => build.success);
  }
}
type CommitIndexByProjectName = {[index:string]:Commit};

export class BuildsService {
  static $inject = ['gitlabApi', '$q', '$mdToast'];

  constructor(private gitlabApi:GitlabApiService,
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

  loadCommitBuilds(project:Project, branchMatch:string):IPromise<CommitBuild[]> {
    return this.gitlabApi.builds(project.id)
      .then(filterByHavingCommit)
      .then(convertToCommitBuilds)
      .then(filterByBranchNameMatch)
      .then(orderByStartedAtDescending)
      .then(filterByMostRecentBranchJob)
      .then(logResult('commitBuilds'));

    // commit might have been deleted, ignore build
    function filterByHavingCommit(builds:Build[]):Build[] {
      return builds.filter(build => build.commit != undefined);
    }

    function convertToCommitBuilds(builds:Build[]):CommitBuild[] {
      return builds.map(build => new CommitBuild(build));
    }

    function filterByBranchNameMatch(commitBuilds:CommitBuild[]):CommitBuild[] {
      return commitBuilds.filter(build => build.branchNameMatch(branchMatch));
    }

    function orderByStartedAtDescending(commitBuilds:CommitBuild[]):CommitBuild[] {
      return commitBuilds.sort((a, b) => b.startedAt - a.startedAt);
    }

    function filterByMostRecentBranchJob(commitBuilds:CommitBuild[]):CommitBuild[] {
      let seen = {};
      return commitBuilds.filter((commitBuild) => {
        if (seen[commitBuild.jobKey]) {
          return false;
        }
        seen[commitBuild.jobKey] = true;
        return true;
      })
    }
  }

  updateBranches(branches:UniqBranches, project:Project, branchMatch:string):IPromise<CommitBuild[]> {
    return this.loadCommitBuilds(project, branchMatch)
      .then(addBranches)
      .then(addCommitsToBranches);

    function addBranches(commitBuilds:CommitBuild[]):CommitBuild[] {
      commitBuilds.forEach((build) => {
        let branch = branches[build.branchName];
        if (!branch) {
          branches[build.branchName] = new Branch(build.branchName);
        }
      });
      return commitBuilds;
    }

    function addCommitsToBranches(commitBuilds:CommitBuild[]):CommitBuild[] {
      commitBuilds.forEach((build) => {
        let branch = branches[build.branchName];
        let projectName = project.path_with_namespace;
        let commit = branch.commit(projectName);
        if (!commit) {
          commit = new Commit(build.commitId, projectName, build.branchName);
          branch.addCommit(projectName, commit);
        }
        commit.builds.push(build);
      });
      return commitBuilds;
    }
  }

  loadBranches(projects:Project[], branchMatch:string):IPromise<Branch[]> {
    let branches:UniqBranches = {};
    let promises = projects.map(project => this.updateBranches(branches, project, branchMatch));
    return this.$q.all(promises)
      .then(arrayOfBranches);

    function arrayOfBranches():Branch[] {
      return Object.keys(branches).map(key => branches[key]);
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
