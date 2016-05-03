import 'angular';
import {Branch} from "./builds";

class BranchCtrl {
  branch:Branch;

  // scale long project name lists to smaller font size
  projectNameFontSize():string {
    let MIN_SCALE = 0.6;
    let MAX_SCALE = 1.6;
    let NORMAL_LENGTH = 40;
    let maxLength = this.branch.projectNames().map(name => name.length).reduce((a, b) => a+b);
    let scale = MAX_SCALE;
    if (maxLength > NORMAL_LENGTH) {
      scale = scale * NORMAL_LENGTH / maxLength;
    }
    scale = Math.max(MIN_SCALE, scale);
    return `${scale}vh`;
  }
}

const BranchCardComponent:ng.IComponentOptions = {
  templateUrl: 'src/app/branch-card.html',
  controller: BranchCtrl,
  bindings: {
    branch: '<',    // Branch object to display
    gitlabHost: '<' // host url of gitlab instance 
  }
};

export const BranchCardModule = angular
  .module('BranchCard', [
  ])
  .component('branchCard', BranchCardComponent);
