import { Get, Use } from "../decorators.ts";
declare function A(): any;
declare function B(): any;
declare function C(): any;
declare function D(): any;
declare function E(): any;
declare function F(): any;

@Use(A)
@Use(B)
@Use(C)
class Controller {
  @Use(D)
  @Use(E)
  @Use(F)
  @Get("/")
  method() {}
}
