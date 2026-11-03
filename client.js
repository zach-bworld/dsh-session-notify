window.__ModuleLoader__.load({
  id: '@local/dsh-session-notify',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** Locale namespace owned by this plugin. */
    const NS = 'sessionNotify';

    /** Simplified Chinese dictionary (key-set source of truth). */
    const zh = {
      'badge.label': '已完成的会话',
      'badge.count': '{n} 个会话已完成',
      'group.ungrouped': '未分组',
      'notify.title': '会话已完成',
      'notify.body': '{project} · {title}',
      'untitled': '未命名会话',
    };

    /** English dictionary, checked complete against the zh key set. */
    const en = {
      'badge.label': 'Finished sessions',
      'badge.count': '{n} finished',
      'group.ungrouped': 'Ungrouped',
      'notify.title': 'Session finished',
      'notify.body': '{project} · {title}',
      'untitled': 'Untitled session',
    };

    const STYLE_ID = '@local/dsh-session-notify/badge';

    const CSS = [
      '.dsn-root{position:relative;display:inline-flex;align-items:center}',
      '.dsn-button{position:relative;display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 8px;border:none;background:transparent;border-radius:var(--dsw-radius-sm,6px);color:var(--dsw-alias-label-secondary,#6b7280);font:inherit;font-size:12px;line-height:1;cursor:pointer}',
      '.dsn-button:hover,.dsn-button[aria-expanded="true"]{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14));color:var(--dsw-alias-label-primary,#111)}',
      '.dsn-button:focus-visible{outline:2px solid var(--dsw-alias-label-accent,#247bbf);outline-offset:1px}',
      '.dsn-icon{display:block;flex:none}',
      '.dsn-count{font-variant-numeric:tabular-nums;font-weight:600;color:var(--dsw-alias-label-primary,#111)}',
      '.dsn-dot{position:absolute;top:3px;right:3px;width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-label-danger,#d93a3a)}',
      '.dsn-popover{position:absolute;left:0;bottom:calc(100% + 8px);z-index:60;min-width:210px;max-width:300px;max-height:320px;overflow:auto;padding:6px;border-radius:var(--dsw-radius-md,10px);background:var(--dsw-alias-bg-overlay,var(--dsw-specific-sidebar-fill,#fff));border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.22));box-shadow:0 10px 28px rgba(0,0,0,.18);color:var(--dsw-alias-label-primary,#111);font-size:12px}',
      '.dsn-popover-rail{left:calc(100% + 8px);bottom:0}',
      '.dsn-head{padding:4px 8px 6px;font-weight:600;color:var(--dsw-alias-label-secondary,#6b7280)}',
      '.dsn-group{padding:6px 8px 2px;color:var(--dsw-alias-label-secondary,#6b7280);font-size:11px;letter-spacing:.02em;text-transform:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.dsn-item{display:block;width:100%;padding:6px 8px;border:none;border-radius:var(--dsw-radius-sm,6px);background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}',
      '.dsn-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14))}',
      '.dsn-item-title{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    ].join('\n');

    /** Original bell glyph; artwork may use its own color. */
    function BellIcon() {
      return h(
        'svg',
        {
          className: 'dsn-icon',
          viewBox: '0 0 16 16',
          width: 16,
          height: 16,
          'aria-hidden': 'true',
          focusable: 'false',
        },
        h('path', {
          fill: 'currentColor',
          d: 'M8 1.4a1 1 0 0 1 1 1v.42a4.15 4.15 0 0 1 3.15 4.03v2.03l.98 1.6a.78.78 0 0 1-.66 1.18H3.53a.78.78 0 0 1-.66-1.18l.98-1.6V6.85A4.15 4.15 0 0 1 7 2.82v-.42a1 1 0 0 1 1-1Zm0 13.2a2.16 2.16 0 0 1-2.08-1.58h4.16A2.16 2.16 0 0 1 8 14.6Z',
        }),
      );
    }

    /** Install the badge stylesheet once; the effect removes it on teardown. */
    function installStyles() {
      if (typeof document === 'undefined') return () => {};
      if (document.querySelector('style[data-plugin-css="' + STYLE_ID + '"]') !== null) return () => {};
      const tag = document.createElement('style');
      tag.dataset.plugin = '@local/dsh-session-notify';
      tag.dataset.pluginCss = STYLE_ID;
      tag.textContent = CSS;
      document.head.appendChild(tag);
      return () => {
        tag.remove();
      };
    }

    /**
     * Track Sessions that finished while they were not the main view.
     *
     * Run state arrives two ways: a `running` flip on the Session list snapshot
     * (Host summary refresh) and the live `api-session/status` event. A flip
     * true -> false marks a completion unless that Session is the main view;
     * selecting the Session (main-view retention) clears the mark, which is why
     * opening a row needs no explicit acknowledgement here.
     */
    function createTracker(ctx) {
      const running = new Map();
      const unread = new Map();
      const listeners = new Set();
      let snapshot = { total: 0, groups: [] };
      let signature = '';

      const t = () => ctx.locale.bind(NS);

      const openSession = (sessionId) => {
        const service = ctx.get('uiWorkspace');
        if (service === undefined || typeof service.openSession !== 'function') return;
        try {
          service.openSession(sessionId);
        } catch (error) {
          console.warn('[session-notify] openSession failed:', error);
        }
      };

      const workspaceIndex = () => {
        const index = new Map();
        const service = ctx.get('workspaces');
        const state = service === undefined ? undefined : service.list.getSnapshot();
        for (const item of state?.items ?? []) {
          for (const sessionId of item.sessionIds ?? []) {
            if (!index.has(sessionId)) index.set(sessionId, item);
          }
        }
        return index;
      };

      const labelOf = (row) => {
        if (row === undefined) return t()('untitled');
        return row.displayTitle || row.title || t()('untitled');
      };

      const listSnapshot = () => {
        const service = ctx.get('sessions');
        return service === undefined ? { ids: [], byId: {} } : service.list.getSnapshot();
      };

      /**
       * A subagent session is a child of another session. `byId` also carries
       * retained subagent fallbacks, so both the lineage field and the coarse
       * origin label are checked; only host-catalog `ids` count as real sessions.
       */
      const isSubagentRow = (row) =>
        row !== undefined && (row.parentId !== undefined || row.origin === 'subagent');

      /** Whether a session belongs in the badge: inside the catalog and not a subagent. */
      const isTrackable = (list, sessionId, row) => {
        if (row === undefined || isSubagentRow(row)) return false;
        const ids = list.ids;
        if (!Array.isArray(ids)) return true;
        return ids.includes(sessionId);
      };

      const isMainView = (sessionId) => {
        const row = listSnapshot().byId?.[sessionId];
        return (row?.retainedBy?.mainView ?? 0) > 0;
      };

      const publish = () => {
        for (const listener of [...listeners]) {
          try {
            listener();
          } catch (error) {
            console.warn('[session-notify] listener failed:', error);
          }
        }
      };

      const rebuild = () => {
        const list = listSnapshot();
        const index = workspaceIndex();
        const groups = new Map();
        for (const [sessionId, at] of [...unread]) {
          const row = list.byId?.[sessionId];
          if (row === undefined) {
            unread.delete(sessionId);
            continue;
          }
          if (!isTrackable(list, sessionId, row)) {
            unread.delete(sessionId);
            continue;
          }
          const workspace = index.get(sessionId);
          const key = workspace === undefined ? '' : String(workspace.workspaceId);
          let group = groups.get(key);
          if (group === undefined) {
            group = {
              key,
              title:
                workspace === undefined
                  ? t()('group.ungrouped')
                  : workspace.title || workspace.path || key,
              items: [],
            };
            groups.set(key, group);
          }
          group.items.push({ id: sessionId, title: labelOf(row), at });
        }
        const ordered = [...groups.values()]
          .map((group) => ({
            key: group.key,
            title: group.title,
            items: group.items.slice().sort((left, right) => right.at - left.at),
          }))
          .sort((left, right) => right.items[0].at - left.items[0].at);
        const next = { total: ordered.reduce((sum, group) => sum + group.items.length, 0), groups: ordered };
        const nextSignature = JSON.stringify(
          ordered.map((group) => [group.key, group.title, group.items.map((item) => item.id)]),
        );
        if (nextSignature === signature) return;
        signature = nextSignature;
        snapshot = next;
        publish();
      };

      const announce = (sessionId) => {
        if (typeof Notification === 'undefined') return;
        try {
          if (Notification.permission === 'denied') return;
          const workspace = workspaceIndex().get(sessionId);
          const label = t();
          const project =
            workspace === undefined ? label('group.ungrouped') : workspace.title || workspace.path || '';
          const notice = new Notification(label('notify.title'), {
            body: label('notify.body', { project, title: labelOf(listSnapshot().byId?.[sessionId]) }),
            tag: 'dsh-session-notify:' + sessionId,
          });
          notice.onclick = () => {
            openSession(sessionId);
            try {
              notice.close();
            } catch (error) {
              /* the platform may already have dismissed it */
            }
          };
        } catch (error) {
          console.warn('[session-notify] notification failed:', error);
        }
      };

      const observe = (sessionId, isRunning) => {
        if (typeof sessionId !== 'string') return;
        const list = listSnapshot();
        if (!isTrackable(list, sessionId, list.byId?.[sessionId])) return;
        const previous = running.get(sessionId);
        running.set(sessionId, isRunning);
        if (isRunning) {
          unread.delete(sessionId);
          rebuild();
          return;
        }
        if (previous === true && !isMainView(sessionId)) {
          unread.set(sessionId, Date.now());
          rebuild();
          announce(sessionId);
          return;
        }
        rebuild();
      };

      const reconcile = () => {
        const list = listSnapshot();
        const present = new Set(list.ids ?? Object.keys(list.byId ?? {}));
        for (const sessionId of present) {
          const row = list.byId?.[sessionId];
          if (row === undefined) continue;
          if (!isTrackable(list, sessionId, row)) {
            running.delete(sessionId);
            unread.delete(sessionId);
            continue;
          }
          const isRunning = row.running === true;
          if (!running.has(sessionId)) running.set(sessionId, isRunning);
          else if (running.get(sessionId) !== isRunning) {
            observe(sessionId, isRunning);
            continue;
          }
          if ((row.retainedBy?.mainView ?? 0) > 0) unread.delete(sessionId);
        }
        if (list.phase === 'ready') {
          for (const sessionId of [...running.keys()]) {
            if (present.has(sessionId)) continue;
            running.delete(sessionId);
            unread.delete(sessionId);
          }
        }
        rebuild();
      };

      return {
        /** Observable snapshot consumed by the badge component. */
        store: {
          getSnapshot: () => snapshot,
          subscribe: (listener) => {
            listeners.add(listener);
            return () => {
              listeners.delete(listener);
            };
          },
        },
        reconcile,
        onStatus: (sessionId, isRunning) => {
          observe(sessionId, isRunning === true);
        },
        refresh: () => {
          signature = '';
          rebuild();
        },
        openSession,
      };
    }

    /** Defensive outer component: a missing injected hook must not blank the slot. */
    function NotifyBadge(props) {
      if (typeof props.useSessionNotify !== 'function') return null;
      return h(NotifyBadgeView, props);
    }

    /** Footer control: completion count plus a per-project list of finished Sessions. */
    function NotifyBadgeView({ wide, t, openSession, useSessionNotify }) {
      const snapshot = useSessionNotify((state) => state);
      const [open, setOpen] = React.useState(false);
      const root = React.useRef(null);

      React.useEffect(() => {
        if (!open) return undefined;
        const onPointerDown = (event) => {
          if (root.current === null || !root.current.contains(event.target)) setOpen(false);
        };
        const onKeyDown = (event) => {
          if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
          document.removeEventListener('pointerdown', onPointerDown);
          document.removeEventListener('keydown', onKeyDown);
        };
      }, [open]);

      const total = snapshot === undefined || snapshot === null ? 0 : snapshot.total;
      if (total === 0) return null;

      const groups = snapshot.groups ?? [];
      const label = t('badge.count', { n: total });

      const children = [
        h(
          'button',
          {
            key: 'toggle',
            type: 'button',
            className: 'dsn-button',
            'aria-label': label,
            'aria-haspopup': 'dialog',
            'aria-expanded': open ? 'true' : 'false',
            title: label,
            onClick: () => setOpen((value) => !value),
          },
          h(BellIcon, { key: 'icon' }),
          wide ? h('span', { key: 'count', className: 'dsn-count' }, String(total)) : null,
          wide ? null : h('span', { key: 'dot', className: 'dsn-dot', 'aria-hidden': 'true' }),
        ),
      ];

      if (open) {
        children.push(
          h(
            'div',
            {
              key: 'popover',
              className: wide ? 'dsn-popover' : 'dsn-popover dsn-popover-rail',
              role: 'dialog',
              'aria-label': t('badge.label'),
            },
            [
              h('div', { key: 'head', className: 'dsn-head' }, label),
              ...groups.flatMap((group) => [
                h('div', { key: 'group:' + group.key, className: 'dsn-group' }, group.title),
                ...group.items.map((item) =>
                  h(
                    'button',
                    {
                      key: 'item:' + item.id,
                      type: 'button',
                      className: 'dsn-item',
                      title: item.title,
                      onClick: () => {
                        setOpen(false);
                        openSession(item.id);
                      },
                    },
                    h('span', { className: 'dsn-item-title' }, item.title),
                  ),
                ),
              ]),
            ],
          ),
        );
      }

      return h('div', { ref: root, className: 'dsn-root' }, children);
    }

    return {
      inject: ['slots', 'locale', 'sessions', 'workspaces', 'remote'],
      apply(ctx) {
        ctx.effect(() => installStyles(), '@local/dsh-session-notify: styles');
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), '@local/dsh-session-notify: dictionaries');

        const sessions = ctx.get('sessions');
        const tracker = createTracker(ctx);

        ctx.effect(() => {
          const stops = [];
          const remote = ctx.get('remote');
          if (sessions !== undefined) stops.push(sessions.list.subscribe(tracker.reconcile));
          const workspaces = ctx.get('workspaces');
          if (workspaces !== undefined) stops.push(workspaces.list.subscribe(tracker.reconcile));
          if (remote !== undefined && typeof remote.$on === 'function') {
            stops.push(remote.$on('api-session/status', tracker.onStatus));
          }
          stops.push(ctx.locale.subscribe(tracker.refresh));
          tracker.reconcile();
          return () => {
            for (const stop of stops) {
              if (typeof stop === 'function') stop();
            }
          };
        }, '@local/dsh-session-notify: completion tracking');

        ctx.slots.inject('sidebar.footer.action', () =>
          ctx.slots.register(
            {
              name: 'sidebar.footer.action',
              id: 'session-notify',
              order: 60,
              locale: NS,
              inject: () => ({
                hooks: { sessionNotify: tracker.store },
                openSession: tracker.openSession,
              }),
            },
            NotifyBadge,
          ),
        );
      },
    };
  },
});
