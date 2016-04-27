import 'angular';

class BuildCard {
  build:any;
}

const BuildCardComponent:ng.IComponentOptions = {
  templateUrl: 'src/app/build-card.html',
  controller: BuildCard,
  bindings: {
    build: '<'
  }
};

export const BuildCardModule = angular
  .module('BuildCard', [])
  .component('buildCard', BuildCardComponent);
