import 'angular';
import {BuildCardModule} from "./build-card";

const ProjectSummaryComponent:ng.IComponentOptions = {
  templateUrl: 'src/app/project-summary.html',
  bindings: {
    project: '<'
  }
};

export const ProjectSummaryModule = angular
  .module('ProjectSummary', [
    BuildCardModule.name
  ])
  .component('projectSummary', ProjectSummaryComponent);
