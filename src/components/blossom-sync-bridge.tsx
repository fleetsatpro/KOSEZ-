        progressed = true;
        if (
          mutation.operation === "mission.save" &&
          typeof result.revision === "number"
        ) {
          useBlossom.setState({
            backendMissionRevisions: {
              ...useBlossom.getState().backendMissionRevisions,
              [mutation.entityId]: result.revision,
            },
          });
        }
        continue;
      }

      if (result.status === "conflict") {
        if (mutation.operation === "mission.save") {
          await resolveMissionConflict(mutation, result);
          progressed = true;
        } else {
          await markConflict(mutation.mutationId, result);
        }
        continue;
      }

      if (result.status === "rejected") {
        // The server's sync ledger is the durable dead letter record. Remove the
        // local command to prevent infinite retries, and roll back only the
        // optimistic UI state that this mutation could have created.
        await removeMutation(result.mutationId);

        const state = useBlossom.getState();
        if (mutation.operation === "event.register") {
          const rollback =
            mutation.payload.rollback &&
            typeof mutation.payload.rollback === "object" &&
            !Array.isArray(mutation.payload.rollback)
              ? (mutation.payload.rollback as Record<string, unknown>)
              : null;
          const wasJoined = rollback?.joined === true;
          const priorCount = Number.isFinite(Number(rollback?.count))
            ? Math.max(0, Number(rollback?.count))
            : 0;
          const joinedEventIds = wasJoined
            ? Array.from(new Set([...state.joinedEventIds, mutation.entityId]))
            : state.joinedEventIds.filter((id) => id !== mutation.entityId);
          useBlossom.setState({
            joinedEventIds,
            eventRegistrationCounts: {
              ...state.eventRegistrationCounts,
              [mutation.entityId]: priorCount,
            },
          });
        } else if (mutation.operation === "booking.request") {
          const rollback =
            mutation.payload.rollback &&
            typeof mutation.payload.rollback === "object" &&
            !Array.isArray(mutation.payload.rollback)
              ? (mutation.payload.rollback as Record<string, unknown>)
              : null;
          const wasEnrolled = rollback?.enrolled === true;
          const priorStatus =
            rollback?.status === "requested" || rollback?.status === "confirmed"
              ? rollback.status
              : null;
          const enrolledIds = wasEnrolled
            ? Array.from(new Set([...state.enrolledIds, mutation.entityId]))
            : state.enrolledIds.filter((id) => id !== mutation.entityId);
          const bookingStatuses = { ...state.bookingStatuses };
          if (priorStatus) bookingStatuses[mutation.entityId] = priorStatus;
          else delete bookingStatuses[mutation.entityId];
          useBlossom.setState({ enrolledIds, bookingStatuses });
        } else if (mutation.operation === "waitlist.request") {
          const rollback =
            mutation.payload.rollback &&
            typeof mutation.payload.rollback === "object" &&
            !Array.isArray(mutation.payload.rollback)
              ? (mutation.payload.rollback as Record<string, unknown>)
              : null;
          if (rollback?.waitlisted === true) {
            useBlossom.setState({
              waitlistIds: Array.from(new Set([...state.waitlistIds, mutation.entityId])),
            });
          } else {
            useBlossom.setState({
              waitlistIds: state.waitlistIds.filter((id) => id !== mutation.entityId),
            });
          }
        } else if (mutation.operation === "tandem.status") {
          const previous =
            mutation.payload.previousStatus === "suggested" ||
            mutation.payload.previousStatus === "pending" ||
            mutation.payload.previousStatus === "accepted" ||
            mutation.payload.previousStatus === "blocked" ||
            mutation.payload.previousStatus === "paused"
              ? mutation.payload.previousStatus
              : null;
          const next = { ...state.tandemStatus };
          if (previous) next[mutation.entityId] = previous;
          else delete next[mutation.entityId];
          useBlossom.setState({ tandemStatus: next });
        } else if (mutation.operation === "tandem.report") {
          const payload = mutation.payload as {
            previousStatus?: string;
          };
          const nextReports = { ...state.tandemReports };
          const nextCount = Math.max(
            0,
            (nextReports[mutation.entityId] ?? 1) - 1,
          );
          if (nextCount === 0) delete nextReports[mutation.entityId];
          const restoredStatus =
            payload.previousStatus === "pending" ||
            payload.previousStatus === "accepted" ||
            payload.previousStatus === "paused" ||
            payload.previousStatus === "blocked" ||
            payload.previousStatus === "suggested"
              ? payload.previousStatus
              : "suggested";
          useBlossom.setState({
            tandemReports: nextReports,
            tandemStatus: {
              ...state.tandemStatus,
              [mutation.entityId]: restoredStatus,
            },
          });
        } else if (mutation.operation === "teacher.note") {
          useBlossom.setState({
            teacherNotes: state.teacherNotes.filter((note) => note.id !== mutation.mutationId),
          });
        } else if (mutation.operation === "teacher.homework") {
          const status =
            typeof mutation.payload.status === "string"
              ? mutation.payload.status
              : undefined;
          const rollback =
            mutation.payload.rollback &&
            typeof mutation.payload.rollback === "object" &&
            !Array.isArray(mutation.payload.rollback)
              ? (mutation.payload.rollback as Record<string, unknown>)
              : null;
          const rollbackTitle =
            typeof rollback?.title === "string" ? rollback.title : null;
          const rollbackBody =
            typeof rollback?.body === "string" ? rollback.body : null;
          const rollbackUpdatedAt =
            typeof rollback?.updatedAt === "string"
              ? rollback.updatedAt
              : null;
          if (
            status === "draft" &&
            rollbackTitle !== null &&
            rollbackBody !== null &&
            rollbackUpdatedAt !== null
          ) {
            useBlossom.setState({
              homework: state.homework.map((homework) =>
                homework.id === mutation.entityId
                  ? {
                      ...homework,
                      title: rollbackTitle,
                      body: rollbackBody,
                      status: "draft" as const,
                      updatedAt: rollbackUpdatedAt,
                    }
                  : homework,
              ),
            });
          } else {
            useBlossom.setState({
              homework:
                status === "sent"
                  ? state.homework.map((homework) =>
                      homework.id === mutation.entityId