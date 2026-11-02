/**
 * Host half of the session-finish notifier bundle.
 *
 * The capability is entirely browser-side: the Client module tracks Session
 * run state and renders the sidebar badge. Nothing is registered on the Host,
 * so this entry only needs to exist for the bundle row to activate.
 */
export function apply() {}
