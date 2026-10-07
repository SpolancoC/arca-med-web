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

function routeComponent(pathname: string): ComponentType<any> {
  if (pathname === "/login") return LoginRoute.component;
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

  if (/^\/patients\/[^/]+\/evaluation\/camera\/?$/.test(pathname)) {
    return CameraRoute.component;
  }
  if (/^\/patients\/[^/]+\/evaluation\/?$/.test(pathname)) {
    return EvaluationRoute.component;
  }
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

  return DashboardRoute.component;
}

export default function App() {
  const pathname = usePathname();

  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const session = Boolean(localStorage.getItem("arca-med-token"));

    if (!session && pathname !== "/login" && pathname !== "/forgot-password") {
      navigate({
        to: "/login",
        replace: true,
      });
      return;
    }

    if (session && pathname === "/login") {
      navigate({
        to: "/",
        replace: true,
      });
      return;
    }

    setAuthenticated(session);
    setAuthChecked(true);
  }, [pathname]);

  // Mientras comprobamos la sesión no mostramos el Dashboard
  if (!authChecked) {
    return null;
  }

  // Usuario no autenticado
  if (
    !authenticated &&
    pathname !== "/login" &&
    pathname !== "/forgot-password"
  ) {
    return null;
  }

  const Page = routeComponent(pathname);

  // Login sin AppShell
  if (pathname === "/login" || pathname === "/forgot-password") {
    return (
      <>
        <Page />
        <Toaster />
      </>
    );
  }

  // Aplicación autenticada
  return (
    <>
      <AppShell>
        <Page />
      </AppShell>
      <Toaster />
    </>
  );
}
