import { Link } from "react-router";
import { PageHeading } from "../components/shared/page-heading";
export function NotFound() {
  return (
    <>
      <PageHeading eyebrow="404 / A wrong turn" title="Nothing at this link.">
        Let’s get you back to something useful.
      </PageHeading>
      <Link className="button" to="/">
        Back to overview
      </Link>
    </>
  );
}
