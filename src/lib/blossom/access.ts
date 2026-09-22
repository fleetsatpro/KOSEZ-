import { useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getBlossomWorkspaceAccess } from "./domain.api";

export type BlossomWorkspaceAccess = {
  isTeacher: boolean;
  isGuardian: boolean;
  isOrgStaff: boolean;
  isChild: boolean;
  isAdmin: boolean;
};

const EMPTY_ACCESS: BlossomWorkspaceAccess = {
  isTeacher: false,
  isGuardian: false,
  isOrgStaff: false,
  isChild: false,
  isAdmin: false,
};

export function useBlossomWorkspaceAccess() {
  const { user, isPending: authPending } = useCurrentUserState();
  const [access, setAccess] = useState<BlossomWorkspaceAccess | null>(null);

  useEffect(() => {
    let disposed = false;
    if (authPending || !user) {
      setAccess(authPending ? null : EMPTY_ACCESS);
      return () => {
        disposed = true;
      };
    }

    void getBlossomWorkspaceAccess()
      .then((result) => {
        if (!disposed) setAccess(result);
      })
      .catch(() => {
        if (!disposed) setAccess(EMPTY_ACCESS);
      });

    return () => {
      disposed = true;
    };
  }, [authPending, user?.id]);

  return {
    access: access ?? EMPTY_ACCESS,
    pending: authPending || access === null,
  };
}
