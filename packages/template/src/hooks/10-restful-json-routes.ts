import * as path from "path";

import * as REST from "@aaa-backend-stack/rest";

export class Hook implements REST.SERVER.IHook {

    routes: REST.HAPI.RouteConfiguration[] = [];

    async init(api: REST.SERVER.Api) {

        // All .controller. files in ../api will be loaded.
        // Instanciated MethodControllers or StaticControllers in any deep will be automatically loaded
        // You just need to default export the instance and name the file accordingly.
        const controllers = await REST.SERVER.loadControllersByGlob("**/*.controller.@(ts|js)", path.resolve(__dirname, "../api"));

        this.routes = REST.SWAGGER.sugarRoutes({
            routes: [].concat(
                ...controllers
                // feel free to include your legacy hapi route definition objects here...
            ),
            defaultRoutesStatusCodes: [REST.BOOM.badRequest],
            defaultSecuredStatusCodes: [REST.BOOM.unauthorized, REST.BOOM.forbidden]
        });

        api.server.route(this.routes);
    }

    getInfo(api: REST.SERVER.Api) {

        return {
            routes: REST.SERVER.getRoutesInfo(this.routes)
        };
    }

}

const hook = new Hook();

export default hook;
