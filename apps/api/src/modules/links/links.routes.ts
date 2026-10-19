import { Elysia } from "elysia";
import type { linksService } from "./links.service";
import {
  createLinkSchema,
  linkSchema,
  slugParams,
  statsSchema,
} from "./links.schema";
import { errorResponses } from "../../lib/errors";
export function linksRoutes(service: ReturnType<typeof linksService>) {
  return new Elysia()
    .post(
      "/api/v1/links",
      async ({ body, set }) => {
        const result = await service.create(body);
        set.status = 201;
        return result;
      },
      {
        body: createLinkSchema,
        response: { 201: linkSchema, ...errorResponses },
      },
    )
    .get("/api/v1/links/:slug", ({ params }) => service.get(params.slug), {
      params: slugParams,
      response: { 200: linkSchema, ...errorResponses },
    })
    .get(
      "/api/v1/links/:slug/stats",
      async ({ params }) => {
        const link = await service.get(params.slug);
        return { slug: link.slug, clickCount: link.clickCount };
      },
      { params: slugParams, response: { 200: statsSchema, ...errorResponses } },
    )
    .get(
      "/s/:slug",
      async ({ params }) =>
        new Response(null, {
          status: 302,
          headers: {
            Location: await service.redirect(params.slug),
            "Cache-Control": "no-store",
            "Referrer-Policy": "no-referrer",
          },
        }),
      { params: slugParams },
    );
}
