export interface AppConfigAgentEvaluationOptions {
  /** Context values forwarded as `Context: key=value` headers for variant rule evaluation. */
  context?: Readonly<Record<string, string | number | boolean>>;
  /** Stable entity identifier forwarded as the `Entity-Id` header for gradual deployments. */
  entityId?: string;
}

export function buildAgentRequestHeaders(evaluation?: AppConfigAgentEvaluationOptions): Headers {
  const headers = new Headers();

  if (evaluation?.entityId) {
    headers.set('Entity-Id', evaluation.entityId);
  }

  if (evaluation?.context) {
    for (const [key, value] of Object.entries(evaluation.context)) {
      headers.append('Context', `${key}=${String(value)}`);
    }
  }

  return headers;
}
