// define types from angular_1_router

import IPromise = angular.IPromise;

// hand crafted from current definition of class ComponentInstruction
export interface IRouteInstruction {
  urlPath: string;
  urlParams: string[];
  data: {get: (key:string) => any};
  componentType:any;
  terminal: boolean;
  specificity: string;
  params: {[key: string]: any};
}

// only what we use, does not include all possible methods
export interface IRouterRoot {
  generate(linkParams:any[]): IRouteInstruction;
  navigate(linkParams:any[]): IPromise<any>;
}

export interface IRouterChild extends IRouterRoot {
}
