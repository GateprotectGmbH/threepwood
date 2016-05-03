import 'angular';
import {BuildsService, BuildsModule, Branch} from "./builds";
import IQService = angular.IQService;
import IPromise = angular.IPromise;
import {BranchCardModule} from "./branch-card";
import {Project} from "./gitlab-api";
import IScope = angular.IScope;
import IIntervalService = angular.IIntervalService;
import {SettingsConfig} from "./settings";

// if you change these constants you need to change the css
const BRANCHES_PER_ROW = 3;
const ROWS_PER_TAB = 3;

class Row {
  branches:Branch[];

  constructor(branches:Branch[]) {
    this.branches = branches.splice(0, BRANCHES_PER_ROW);
  }
}

class Tab {
  rows:Row[] = [];

  constructor(public label:number, branches:Branch[]) {
    for (let i = 0; i < ROWS_PER_TAB; i++) {
      this.rows.push(new Row(branches));
    }
  }
}

class Dashboard {
  static PROJECTS_RELOAD_INTERVAL = 60 * 60 * 1000; // ms
  static PROJECTS_ERROR_RETRY = 60 * 1000; // ms
  static BUILDS_RELOAD_INTERVAL = 27 * 1000; // ms
  static NEXT_PAGE_INTERVAL = 11 * 1000; // ms
  static $inject = ['buildsService', '$q', '$scope', '$interval'];

  projects:Project[] = [];
  tabs:Tab[] = [];
  selectedTab:number = 0;

  loading:string = 'Loading matching projects..';
  skipLoadBranches:boolean;
  cancelLoadBranches:any;

  // passed from parent
  config:SettingsConfig;

  constructor(private buildsService:BuildsService,
              private $q:IQService,
              private $scope:IScope,
              private $interval:IIntervalService) {

    this.loadProjects();

    // auto reload
    $interval(this.loadProjects.bind(this), Dashboard.PROJECTS_RELOAD_INTERVAL);
    $interval(this.nextTab.bind(this), Dashboard.NEXT_PAGE_INTERVAL);

    // settings have changed, reload..
    $scope.$on('reload:projects', () => {
      this.loading = 'Reloading projects..';
      this.loadProjects();
    });
  }

  nextTab() {
    let nextTab = this.selectedTab + 1;
    if (!this.tabs[nextTab]) {
      nextTab = 0;
    }
    this.selectedTab = nextTab;
  }

  buildTabs(branches:Branch[]):Tab[] {
    let tabs:Tab[] = [];
    let label = 1;
    while (branches.length) {
      var tab = new Tab(label++, branches);
      tabs.push(tab);
    }
    return tabs;
  }

  loadProjects() {
    console.log('loading projects..');
    this.skipLoadBranches = true;
    this.buildsService.loadProjects(this.config.projectMatch)
      .then((projects) => {
        this.skipLoadBranches = false;
        this.projects = projects;
        // if already showing a message, then continue, otherwise stay silent
        if (this.loading) {
          this.loading = 'Loading matching builds..';
        }
        this.loadBranches();
      })
      .catch(() => {
        console.log('project load failed.. retrying..');
        // if already showing a message, then continue, otherwise stay silent
        if (this.loading) {
          this.loading = `Failed to load projects. Retrying in ${Dashboard.PROJECTS_ERROR_RETRY / 1000} seconds..`;
        }
        this.$interval(this.loadProjects.bind(this), Dashboard.PROJECTS_ERROR_RETRY, 1);
      });
  }

  loadBranches() {
    if (this.skipLoadBranches) {
      return;
    }
    console.log('loading branches..');
    // to avoid multiple in-flight branch queries
    this.skipLoadBranches = true;
    this.buildsService.loadBranches(this.projects, this.config.branchMatch)
      .then((branches) => {
        this.tabs = this.buildTabs(branches);
        this.loading = undefined;
      })
      .finally(() => {
        this.loadBranchInterval();
        this.skipLoadBranches = false;
      })
  }

  // adjust interval time to allow paging through all tabs
  loadBranchInterval() {
    let approxLoadTime = 5 * 10000;
    let timeForAllTabs = this.tabs.length * Dashboard.NEXT_PAGE_INTERVAL - approxLoadTime;
    let time = Math.max(Dashboard.BUILDS_RELOAD_INTERVAL, timeForAllTabs);
    if (this.cancelLoadBranches) {
      this.$interval.cancel(this.cancelLoadBranches);
    }
    console.log(`next branch update in ${time/1000} seconds`);
    this.cancelLoadBranches = this.$interval(this.loadBranches.bind(this), time);
  }
}

const DashboardComponent:ng.IComponentOptions = {
  templateUrl: 'src/app/dashboard.html',
  controller: Dashboard,
  bindings: {
    config: '<'
  }
};

export const DashboardModule = angular
  .module('dashboard', [
    BranchCardModule.name,
    BuildsModule.name
  ])
  .component('dashboard', DashboardComponent);
