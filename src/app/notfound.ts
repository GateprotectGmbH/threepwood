import 'angular';

const NotfoundComponent:ng.IComponentOptions = {
  template: '<h2>Not Found</h2>'
};

export var NotfoundModule = angular
  .module('notfound', [])
  .component('notfound', NotfoundComponent);
