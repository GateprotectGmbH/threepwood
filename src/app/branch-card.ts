import 'angular';

const BranchCardComponent:ng.IComponentOptions = {
  templateUrl: 'src/app/branch-card.html',
  bindings: {
    branch: '<'
  }
};

export const BranchCardModule = angular
  .module('BranchCard', [
  ])
  .component('branchCard', BranchCardComponent);
