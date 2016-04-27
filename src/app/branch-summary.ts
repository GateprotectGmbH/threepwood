import 'angular';
import {ProjectSummaryModule} from "./project-summary";

const BranchSummaryComponent:ng.IComponentOptions = {
  templateUrl: 'src/app/branch-summary.html',
  bindings: {
    branch: '<'
  }
};

export const BranchSummaryModule = angular
  .module('BranchSummary', [
    ProjectSummaryModule.name
  ])
  .component('branchSummary', BranchSummaryComponent);
