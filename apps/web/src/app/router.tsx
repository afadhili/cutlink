import { createBrowserRouter } from "react-router";
import { Layout } from "../components/layout/layout";
import { Home } from "../pages/home";
import { Links } from "../pages/links";
import { QrGenerator } from "../pages/qr-generator";
import { TextShare } from "../pages/text-share";
import { SnippetView } from "../pages/snippet-view";
import { NotFound } from "../pages/not-found";
export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "/links", element: <Links /> },
      { path: "/qr", element: <QrGenerator /> },
      { path: "/share", element: <TextShare /> },
      { path: "/t/:slug", element: <SnippetView /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
