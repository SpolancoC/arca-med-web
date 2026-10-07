import { Outlet, createFileRoute } from "@/lib/router";

export const Route = createFileRoute("/patients")({
  component: PatientsLayout,
});

function PatientsLayout() {
  return <Outlet />;
}
