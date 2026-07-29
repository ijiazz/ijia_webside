import { HonoContext } from "@/common/context.ts";
import { RouteGroup } from "@/lib/route.ts";

import questionPrepareReviewed from "./examination/question/prepare-reviewed.post.ts";
import templatePrepare from "./examination/template/prepare.post.ts";
import examinationPrepare from "./examination/prepare.post.ts";

const routeGroup = new RouteGroup<HonoContext>({});

routeGroup.add(questionPrepareReviewed);
routeGroup.add(templatePrepare);
routeGroup.add(examinationPrepare);

export default routeGroup;
