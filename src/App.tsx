import { useEffect, useState, type ComponentType } from "react";
import { AppShell } from "@/components/arca/app-shell";
import { usePathname, navigate } from "@/lib/router";
import { Toaster } from "@/components/ui/sonner";

import { Route as DashboardRoute } from "@/pages/doctor/Dashboard";
import { Route as LoginRoute } from "@/routes/login";
import { Route as PatientsRoute } from "@/routes/patients.index";
import { Route as PatientDetailRoute } from "@/routes/patients.$patientId.index";
import { Route as EvaluationRoute } from "@/routes/patients.$patientId.evaluation.index";
import { Route as CameraRoute } from "@/routes/patients.$patientId.evaluation.camera";
import { Route as EvaluationsRoute } from "@/routes/evaluations";
import { Route as ExercisesRoute } from "@/routes/exercises";
import { Route as HistoryRoute } from "@/routes/history";
import { Route as TriageRoute } from "@/routes/triage";
import { Route as ActivePatientsRoute } from "@/routes/dashboard.active";
import { Route as AttentionRoute } from "@/routes/dashboard.attention";
import { Route as ExerciseReviewsRoute } from "@/routes/dashboard.exercise-reviews";
import { Route as TodayRoute } from "@/routes/dashboard.today";
import { Route as EvaluationDetailRoute } from "@/routes/evaluations.$evaluationId";
import { Route as NewEvaluationRoute } from "@/routes/evaluations.new";
import { Route as NewExerciseRoute } from "@/routes/exercises.new";
import { Route as ExerciseDetailRoute } from "@/routes/exercises.$exerciseId.index";
import { Route as ExerciseEditRoute } from "@/routes/exercises.$exerciseId.edit";
import { Route as ForgotPasswordRoute } from "@/routes/forgot-password";
import { Route as HelpRoute } from "@/routes/help";
import { Route as PatientHistoryRoute } from "@/routes/patients.$patientId.history";
import { Route as PatientRecommendRoute } from "@/routes/patients.$patientId.recommend";
import { Route as NewPatientRoute } from "@/routes/patients.new";
import { Route as ProfileRoute } from "@/routes/profile";
import { Route as SettingsRoute } from "@/routes/settings";
import { Route as AuditoriaRoute } from "@/routes/auditoria";
import { Route as AdminUsersRoute } from "@/routes/admin.users";
import { Route as ClinicalGuidesRoute } from "@/routes/clinical-guides";

import { getProfile } from "@/services/profile";
import { Route as PatientPortalRoute } from "@/routes/patient-portal";

type PortalRole = "admin" | "medico" | "paciente";

function allowedPath(pathname: string, role: PortalRole): boolean {
  if (role === "paciente") return pathname === "/mi-espacio" || pathname === "/profile";
  if (["/help", "/profile", "/settings", "/guias-clinicas"].includes(pathname)) return true;
  if (role === "admin") {
    return pathname === "/patients" || pathname === "/patients/new" ||
      pathname === "/exercises" || pathname.startsWith("/exercises/") ||
      pathname === "/auditoria" || pathname === "/admin/usuarios";
  }
  return pathname === "/" || pathname === "/patients" ||
    pathname === "/triage" || pathname === "/evaluations" ||
    pathname.startsWith("/evaluations/") || pathname === "/history" ||
    pathname.startsWith("/dashboard/") ||
    /^\/patients\/[^/]+(?:\/(?:evaluation(?:\/camera)?|history|recommend))?\/?$/.test(pathname);
}

function routeComponent(pathname: string): ComponentType<any> {
  if (pathname === "/login") return LoginRoute.component;
  if (pathname === "/mi-espacio") return PatientPortalRoute.component;
  if (pathname === "/forgot-password") return ForgotPasswordRoute.component;

  if (pathname === "/") return DashboardRoute.component;
  if (pathname === "/patients") return PatientsRoute.component;
  if (pathname === "/patients/new") return NewPatientRoute.component;

  if (/^\/dashboard\/active\/?$/.test(pathname))
    return ActivePatientsRoute.component;

  if (/^\/dashboard\/attention\/?$/.test(pathname))
    return AttentionRoute.component;

  if (/^\/dashboard\/exercise-reviews\/?$/.test(pathname))
    return ExerciseReviewsRoute.component;

  if (/^\/dashboard\/today\/?$/.test(pathname)) return TodayRoute.component;

  if (/^\/patients\/[^/]+\/evaluation\/camera\/?$/.test(pathname))
    return CameraRoute.component;

  if (/^\/patients\/[^/]+\/evaluation\/?$/.test(pathname))
    return EvaluationRoute.component;

  if (/^\/patients\/[^/]+\/history\/?$/.test(pathname))
    return PatientHistoryRoute.component;

  if (/^\/patients\/[^/]+\/recommend\/?$/.test(pathname))
    return PatientRecommendRoute.component;

  if (/^\/patients\/[^/]+\/?$/.test(pathname))
    return PatientDetailRoute.component;

  if (pathname === "/evaluations") return EvaluationsRoute.component;
  if (pathname === "/evaluations/new") return NewEvaluationRoute.component;

  if (/^\/evaluations\/[^/]+\/?$/.test(pathname))
    return EvaluationDetailRoute.component;

  if (pathname === "/exercises") return ExercisesRoute.component;
  if (pathname === "/exercises/new") return NewExerciseRoute.component;

  if (/^\/exercises\/[^/]+\/edit\/?$/.test(pathname))
    return ExerciseEditRoute.component;

  if (/^\/exercises\/[^/]+\/?$/.test(pathname))
    return ExerciseDetailRoute.component;

  if (pathname === "/history") return HistoryRoute.component;
  if (pathname === "/triage") return TriageRoute.component;
  if (pathname === "/help") return HelpRoute.component;
  if (pathname === "/profile") return ProfileRoute.component;
  if (pathname === "/settings") return SettingsRoute.component;
  if (pathname === "/auditoria") return AuditoriaRoute.component;
  if (pathname === "/admin/usuarios") return AdminUsersRoute.component;
  if (pathname === "/guias-clinicas") return ClinicalGuidesRoute.component;

  return NotFoundPage;
}

function NotFoundPage() {
  return <div role="alert" className="rounded-md border border-border bg-surface-raised p-6"><h1 className="text-lg font-semibold">Página no encontrada</h1><p className="mt-2 text-sm text-muted-foreground">La dirección solicitada no existe en ARCA Med.</p><button type="button" className="mt-4 text-sm font-semibold text-primary underline" onClick={() => navigate({to: "/", replace: true})}>Volver al inicio</button></div>;
}


export default function App() {
  const pathname = usePathname();

  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [role, setRole] = useState<PortalRole | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  const isPublicRoute =
    pathname === "/login" || pathname === "/forgot-password";

  useEffect(() => {
    let active = true;

    async function checkSession() {
      setAuthChecked(false);
      setAccessError(null);

      const token = localStorage.getItem("arca-med-token");

      if (!token) {
        if (!active) return;

        setAuthenticated(false);
        setRole(null);
        setAuthChecked(true);

        if (pathname !== "/login" && pathname !== "/forgot-password") {
          navigate({
            to: "/login",
            replace: true,
          });
        }

        return;
      }

      try {
        const profile = await getProfile();

        if (!active) return;

        if (profile.rol !== "medico" && profile.rol !== "admin" && profile.rol !== "paciente") {
          setAuthenticated(false);

          setAccessError(
            "Esta cuenta no tiene acceso al portal médico de ARCA Med.",
          );

          setAuthChecked(true);

          if (pathname !== "/login" && pathname !== "/forgot-password") {
            navigate({
              to: "/login",
              replace: true,
            });
          }

          return;
        }

        localStorage.setItem("arca-med-role", profile.rol);
        setRole(profile.rol as PortalRole);

        setAuthenticated(true);
        setAuthChecked(true);

        if (pathname === "/login" || (profile.rol !== "medico" && pathname === "/")) {
          navigate({
            to: profile.rol === "admin" ? "/patients" : profile.rol === "paciente" ? "/mi-espacio" : "/",
            replace: true,
          });
        }
      } catch (error) {
        if (!active) return;

        const status = (error as { status?: number })?.status;

        setAuthenticated(false);
        setRole(null);

        if (status === 401 || status === 403) {
          localStorage.removeItem("arca-med-token");
          localStorage.removeItem("arca-med-role");

          setAccessError("Tu sesión ha expirado o ya no es válida.");

          if (pathname !== "/login" && pathname !== "/forgot-password") {
            navigate({
              to: "/login",
              replace: true,
            });
          }
        } else {
          setAccessError(
            "No se pudo verificar la sesión. Comprueba la conexión con el servidor.",
          );
        }

        setAuthChecked(true);
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, [pathname]);

  if (!authChecked) {
    return null;
  }

  const Page = routeComponent(pathname);
  const permitted = role !== null && allowedPath(pathname, role);

  if (isPublicRoute) {
    return (
      <>
        {accessError && (
          <div
            role="alert"
            className="border-b border-border bg-surface-raised px-4 py-3 text-center text-sm text-destructive"
          >
            {accessError}
          </div>
        )}

        <Page />
        <Toaster />
      </>
    );
  }

  if (!authenticated) {
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-xl font-semibold">Acceso restringido</h1>

          <p className="text-sm text-destructive">
            {accessError ?? "No tienes una sesión médica activa."}
          </p>

          <button
            type="button"
            className="text-sm font-semibold text-primary underline"
            onClick={() => {
              localStorage.removeItem("arca-med-token");
              localStorage.removeItem("arca-med-role");

              setAuthenticated(false);

              navigate({
                to: "/login",
                replace: true,
              });
            }}
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  if (authenticated && !permitted) {
    return (
      <>
        <AppShell>
          <div role="alert" className="rounded-md border border-border bg-surface-raised p-6">
            <h1 className="text-lg font-semibold">Acceso restringido</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Esta pantalla no está disponible para tu perfil.
            </p>
            <button type="button" className="mt-4 text-sm font-semibold text-primary underline"
              onClick={() => navigate({ to: role === "admin" ? "/patients" : role === "paciente" ? "/mi-espacio" : "/", replace: true })}>
              Volver al inicio
            </button>
          </div>
        </AppShell>
        <Toaster />
      </>
    );
  }

  return (
    <>
      <AppShell>
        <Page />
      </AppShell>

      <Toaster />
    </>
  );
}
