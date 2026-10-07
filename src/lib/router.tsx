import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

export type NavigateOptions = {
  to: string;
  params?: Record<string, string | number>;
  replace?: boolean;
};

function fillParams(to: string, params?: Record<string, string | number>) {
  if (!params) return to;
  return Object.entries(params).reduce(
    (path, [key, value]) =>
      path.replace(`$${key}`, encodeURIComponent(String(value))),
    to,
  );
}

export function resolvePath(
  to: string,
  params?: Record<string, string | number>,
) {
  return fillParams(to, params);
}

export function navigate(options: NavigateOptions) {
  const path = fillParams(options.to, options.params);
  if (options.replace) window.history.replaceState({}, "", path);
  else window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function useNavigate(_options?: { from?: string }) {
  return (options: NavigateOptions | string) => {
    if (typeof options === "string") navigate({ to: options });
    else navigate(options);
  };
}

export function useRouterState<T = string>({
  select,
}: {
  select: (state: { location: { pathname: string } }) => T;
}) {
  const pathname = usePathname();
  return select({ location: { pathname } });
}

export function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname);
  useEffect(() => {
    const update = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  return pathname;
}

function getParams(pathPattern: string, pathname: string) {
  const patternParts = pathPattern
    .replace(/\/$/, "")
    .split("/")
    .filter(Boolean);
  const pathParts = pathname.replace(/\/$/, "").split("/").filter(Boolean);
  const params: Record<string, string> = {};
  patternParts.forEach((part, index) => {
    if (part.startsWith("$"))
      params[part.slice(1)] = decodeURIComponent(pathParts[index] ?? "");
  });
  return params;
}

export function createFileRoute(path: string) {
  return (config: { component: ComponentType<any>; head?: unknown }) => ({
    ...config,
    path,
    useParams: () => getParams(path, window.location.pathname),
  });
}

export function Link({
  to,
  params,
  children,
  onClick,
  ...props
}: {
  to: string;
  params?: Record<string, string | number>;
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
  title?: string;
  [key: string]: unknown;
}) {
  const href = resolvePath(to, params);
  return (
    <a
      href={href}
      {...props}
      onClick={(event) => {
        if (event.defaultPrevented) return;
        event.preventDefault();
        onClick?.();
        navigate({ to: href });
      }}
    >
      {children}
    </a>
  );
}

const OutletContext = createContext<ReactNode>(null);
export function Outlet() {
  return useContext(OutletContext);
}
export function OutletProvider({
  children,
  outlet,
}: {
  children: ReactNode;
  outlet: ReactNode;
}) {
  return (
    <OutletContext.Provider value={outlet}>{children}</OutletContext.Provider>
  );
}

export function RouterRerender({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const value = useMemo(() => pathname, [pathname]);
  return <>{value && children}</>;
}
