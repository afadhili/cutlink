import { Elysia } from "elysia";
import type { snippetsService } from "./snippets.service";
import {
  createSnippetSchema,
  createdSnippetSchema,
  snippetSchema,
} from "./snippets.schema";
import { slugParams } from "../links/links.schema";
import { errorResponses } from "../../lib/errors";
export function snippetsRoutes(service: ReturnType<typeof snippetsService>) {
  return new Elysia()
    .post(
      "/api/v1/snippets",
      async ({ body, set }) => {
        const result = await service.create(body);
        set.status = 201;
        return result;
      },
      {
        body: createSnippetSchema,
        response: { 201: createdSnippetSchema, ...errorResponses },
      },
    )
    .get("/api/v1/snippets/:slug", ({ params }) => service.read(params.slug), {
      params: slugParams,
      response: { 200: snippetSchema, ...errorResponses },
    });
}
