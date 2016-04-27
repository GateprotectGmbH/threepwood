import 'angular';
import {BuildsService, BuildsModule, BranchSummary} from "./builds";
import IQService = angular.IQService;
import IPromise = angular.IPromise;
import {BranchSummaryModule} from "./branch-summary";
import {Project} from "./gitlab-api";

class Dashboard {
  static $inject = ['buildsService', '$q'];
  projects:Project[] = [];
  branchSummaries:BranchSummary[] = [];

  constructor(private buildsService:BuildsService,
              private $q:IQService) {
    buildsService.loadProjects()
      .then((projects) => {
        this.projects = projects;
        this.loadBranchSummaries();
      });
  }

  loadBranchSummaries() {
    this.buildsService.loadBranchSummaries(this.projects)
      .then((branchSummaries) => this.branchSummaries = branchSummaries);
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
