import 'angular';
import {BuildsService, BuildsModule, BranchSummary} from "./builds";
import IQService = angular.IQService;
import IPromise = angular.IPromise;
import {BranchSummaryModule} from "./branch-summary";
import {Project} from "./gitlab-api";
import IScope = angular.IScope;
import IIntervalService = angular.IIntervalService;

class Dashboard {
  static PROJECTS_RELOAD_INTERVAL = 60 * 60 * 1000; // ms
  static PROJECTS_ERROR_RETRY = 60 * 1000; // ms
  static BUILDS_RELOAD_INTERVAL = 27 * 1000; // ms
  static $inject = ['buildsService', '$q', '$scope', '$interval'];

  projects:Project[] = [];
  branchSummaries:BranchSummary[] = [];

  loading:string = 'Loading matching projects..';
  skipLoadBranchSummary:boolean;

  constructor(private buildsService:BuildsService,
              private $q:IQService,
              private $scope:IScope,
              private $interval:IIntervalService) {

    this.loadProjects();

    // auto reload
    $interval(this.loadProjects.bind(this), Dashboard.PROJECTS_RELOAD_INTERVAL);
    $interval(this.loadBranchSummaries.bind(this), Dashboard.BUILDS_RELOAD_INTERVAL);

    // settings have changed, reload..
    $scope.$on('reload:projects', () => {
      this.loading = 'Reloading projects..';
      this.loadProjects();
    });
  }

  loadProjects() {
    console.log('loading projects..');
    this.skipLoadBranchSummary = true;
    this.buildsService.loadProjects()
      .then((projects) => {
        this.skipLoadBranchSummary = false;
        this.projects = projects;
        // if already showing a message, then continue, otherwise stay silent
        if (this.loading) {
          this.loading = 'Loading matching builds..';
        }
        this.loadBranchSummaries();
      })
      .catch(() => {
        console.log('project load failed.. retrying..');
        // if already showing a message, then continue, otherwise stay silent
        if (this.loading) {
          this.loading = `Failed to load projects. Retrying in ${Dashboard.PROJECTS_ERROR_RETRY/1000} seconds..`;
        }
        this.$interval(this.loadProjects.bind(this), Dashboard.PROJECTS_ERROR_RETRY, 1);
      });
  }

  loadBranchSummaries() {
    if (this.skipLoadBranchSummary) {
      return;
    }
    console.log('loading branch summaries..');
    // to avoid multiple in-flight branch queries
    this.skipLoadBranchSummary = true;
    this.buildsService.loadBranchSummaries(this.projects)
      .then((branchSummaries) => {
        this.branchSummaries = branchSummaries;
        this.loading = undefined;
      })
      .finally(() => {
        this.skipLoadBranchSummary = false;
      })
  }
}

const DashboardComponent:ng.IComponentOptions = {
  templateUrl: 'src/app/dashboard.html',
  controller: Dashboard
};

export const DashboardModule = angular
  .module('dashboard', [
    BranchSummaryModule.name,
    BuildsModule.name
  ])
  .component('dashboard', DashboardComponent);
