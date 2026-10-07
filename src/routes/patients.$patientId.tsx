import { Outlet, createFileRoute } from "@/lib/router";

export const Route = createFileRoute("/patients/$patientId")({
  component: PatientLayout,
});

function PatientLayout() {
  return <Outlet />;
}
