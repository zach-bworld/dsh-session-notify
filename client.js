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
      'badge.todo': '{n} 个收藏会话',
      'badge.running': '{n} 个会话进行中',
      'badge.waiting': '{n} 个会话等你回复',
      'badge.both': '{done} 个已完成 · {todo} 个收藏',
      'badge.idle': '提醒与收藏',
      'group.ungrouped': '未分组',
      'notify.title': '会话已完成',
      'notify.body': '{project} · {title}',
      'summary': '已完成 {done} · 进行中 {run} · 收藏 {todo}',
      'tabs.running': '进行中',
      'tabs.todo': '收藏',
      'tabs.done': '已完成',
      'todo.add': '收藏此会话',
      'todo.remove': '取消收藏',
      'todo.aria': '{action}：{title}',
      'todo.empty': '还没有收藏。在会话行的 … 菜单里点「收藏此会话」即可加入。',
      'untitled': '未命名会话',
    };

    /** English dictionary, checked complete against the zh key set. */
    const en = {
      'badge.label': 'Finished sessions',
      'badge.count': '{n} finished',
      'badge.todo': '{n} starred',
      'badge.running': '{n} running',
      'badge.waiting': '{n} awaiting your reply',
      'badge.both': '{done} finished · {todo} starred',
      'badge.idle': 'Alerts and starred',
      'group.ungrouped': 'Ungrouped',
      'notify.title': 'Session finished',
      'notify.body': '{project} · {title}',
      'summary': 'Done {done} · Running {run} · Starred {todo}',
      'tabs.running': 'Running',
      'tabs.todo': 'Starred',
      'tabs.done': 'Done',
      'todo.add': 'Star this session',
      'todo.remove': 'Remove from starred',
      'todo.aria': '{action}: {title}',
      'todo.empty': 'Nothing starred yet. Open the … menu on a session row and pick "Star this session".',
      'untitled': 'Untitled session',
    };

    const STYLE_ID = '@local/dsh-session-notify/badge';

    /** localStorage key holding the todo map: sessionId -> { at, title, project }. */
    const TODO_KEY = 'dsh-session-notify.todos.v1';

    /** How many frames to wait for the sidebar row that openSession() renders. */
    const REVEAL_ATTEMPTS = 3;
    const REVEAL_INTERVAL = 150;
    const REVEAL_FLASH_MS = 1600;

    /** Temporary class applied to the revealed sidebar row. */
    const REVEAL_CLASS = 'dsn-reveal';

    const CSS = [
      '.dsn-root{position:relative;display:inline-flex;align-items:center}',
      '.dsn-button{position:relative;display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 8px;border:none;background:transparent;border-radius:var(--dsw-radius-sm,6px);color:var(--dsw-alias-label-secondary,#6b7280);font:inherit;font-size:12px;line-height:1;cursor:pointer}',
      '.dsn-button:hover,.dsn-button[aria-expanded="true"]{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14));color:var(--dsw-alias-label-primary,#111)}',
      '.dsn-button:focus-visible{outline:2px solid var(--dsw-alias-label-accent,#247bbf);outline-offset:1px}',
      '.dsn-icon{display:block;flex:none}',
      '.dsn-todos{display:inline-flex;align-items:center;gap:2px;height:18px;padding:0 4px;color:var(--dsw-alias-label-secondary,#6b7280);font-size:11px;line-height:1;font-variant-numeric:tabular-nums}',
      '.dsn-unread{display:inline-flex;align-items:center;color:var(--dsw-alias-label-danger,#d93a3a);font-size:12px;font-weight:700;line-height:1;font-variant-numeric:tabular-nums}',
      '.dsn-todos-icon{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;flex:none;line-height:1}',
      '.dsn-run{display:inline-flex;align-items:center;gap:4px;height:18px;padding:0 3px;color:var(--dsw-alias-label-tertiary,#9aa0a6);font-size:11px;line-height:1;font-variant-numeric:tabular-nums}',
      '.dsn-run-wait{color:var(--dsw-alias-state-warn-primary,#f0a626)}',
      '.dsn-run .dsn-sd{display:block;width:14px;height:14px}',
      '.dsn-dot-run{position:absolute;top:3px;left:3px;width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-label-tertiary,#9aa0a6)}',
      '.dsn-run-spin{display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;margin-right:6px;flex:none;color:var(--dsw-alias-label-tertiary,#9aa0a6)}',
      '.dsn-run-spin .dsn-sd{display:block;width:14px;height:14px}',
      '.dsn-wait-dot{position:relative;display:inline-block;width:10px;height:10px;margin-right:6px;flex:none;color:var(--dsw-alias-state-warn-primary,#f0a626)}',
      '.dsn-wait-dot::after{content:"";position:absolute;inset:20%;border-radius:50%;background:currentColor}',
      '.dsn-sd-motion{transform-origin:center;animation:dsn-sd-spin 1.5s linear infinite}',
      '.dsn-sd-track,.dsn-sd-arc{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}',
      '.dsn-sd-track{opacity:.25}',
      '.dsn-sd-arc{stroke-dasharray:12 150;animation:dsn-sd-dash 1.5s ease-in-out infinite}',
      '@keyframes dsn-sd-spin{to{transform:rotate(360deg)}}',
      '@keyframes dsn-sd-dash{0%{stroke-dasharray:12 150;stroke-dashoffset:0}50%{stroke-dasharray:24 150;stroke-dashoffset:-6}100%{stroke-dasharray:12 150;stroke-dashoffset:0}}',
      '.dsn-menu-icon{display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;flex:none;line-height:1}',
      '.dsn-todos-icon .dsn-icon{display:block;width:16px;height:16px}',
      '.dsn-menu-icon .dsn-icon{display:block;width:14px;height:14px}',
      '.dsn-dot-pin{position:absolute;bottom:3px;right:3px;width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-label-secondary,#9aa0a6)}',
      '.dsn-done-block{margin:2px 2px 6px;padding:2px 2px 4px;border-radius:8px;background:rgba(217,58,58,.07)}',
      '.dsn-section-done{color:var(--dsw-alias-label-danger,#d93a3a)}',
      '.dsn-dot{position:absolute;top:3px;right:3px;width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-label-danger,#d93a3a)}',
      '.dsn-popover{position:absolute;left:0;bottom:calc(100% + 8px);z-index:60;min-width:210px;max-width:300px;max-height:320px;overflow:auto;padding:6px;border-radius:var(--dsw-radius-md,10px);background:var(--dsw-alias-bg-overlay,var(--dsw-specific-sidebar-fill,#fff));border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.22));box-shadow:0 10px 28px rgba(0,0,0,.18);color:var(--dsw-alias-label-primary,#111);font-size:12px}',
      '.dsn-popover-rail{left:calc(100% + 8px);bottom:0}',
      '.dsn-head{padding:4px 8px 6px;font-weight:600;color:var(--dsw-alias-label-secondary,#6b7280)}',
      '.dsn-group{padding:6px 8px 2px;color:var(--dsw-alias-label-secondary,#6b7280);font-size:11px;letter-spacing:.02em;text-transform:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.dsn-item{display:block;width:100%;padding:6px 8px;border:none;border-radius:var(--dsw-radius-sm,6px);background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}',
      '.dsn-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14))}',
      '.dsn-item-title{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.dsn-row{display:flex;align-items:center;gap:2px}',
      '.dsn-row .dsn-item{flex:1 1 auto;width:auto;min-width:0}',
      '.dsn-item-sub{display:block;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--dsw-alias-label-secondary,#6b7280)}',
      '.dsn-pin{flex:none;display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;padding:0;border:none;border-radius:var(--dsw-radius-sm,6px);background:transparent;color:var(--dsw-alias-label-secondary,#6b7280);font:inherit;line-height:1;cursor:pointer}',
      '.dsn-pin:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14));color:var(--dsw-alias-label-primary,#111)}',
      '.dsn-pin:focus-visible{outline:2px solid var(--dsw-alias-label-accent,#247bbf);outline-offset:1px}',
      '.dsn-pin[aria-pressed="true"]{color:var(--dsw-alias-label-accent,#247bbf)}',
      '.dsn-section{padding:8px 8px 2px;font-size:11px;font-weight:600;letter-spacing:.02em;color:var(--dsw-alias-label-secondary,#6b7280)}',
      '.dsn-empty{padding:2px 8px 6px;font-size:11px;color:var(--dsw-alias-label-secondary,#6b7280);opacity:.85}',
      '.dsn-button-idle{color:var(--dsw-alias-label-secondary,#6b7280)}',
      '.dsn-label{font-weight:500;color:inherit}',
      '.dsn-reveal{outline:2px solid rgba(59,108,240,.55);outline-offset:-2px;border-radius:8px;transition:outline-color .3s}',
      '.dsn-menu-item{display:flex;align-items:center;gap:6px;width:100%;padding:6px 10px 6px 8px;border:none;border-radius:var(--dsw-radius-sm,6px);background:transparent;color:inherit;font:inherit;font-size:13px;line-height:1.2;text-align:left;cursor:pointer}',
      '.dsn-menu-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14))}',
      '.dsn-menu-item:focus-visible{outline:2px solid var(--dsw-alias-label-accent,#247bbf);outline-offset:1px}',
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

    /**
     * The star is drawn with the app's regular 1px line-icon weight and round joins,
     * in a 16-unit box so the glyph sits next to the built-in pin/rename/archive icons
     * without looking heavier. Switch the variant constant to try another shape.
     */
    const TODO_ICON_VARIANT = 'star'; // 'star' | 'checklist' | 'bookmark'

    const STAR_PATH = 'M8 1.2 9.5 5.5 14.1 5.6 10.5 8.4 11.8 12.8 8 10.2 4.2 12.8 5.5 8.4 1.9 5.6 6.5 5.5Z';
    const BOOKMARK_PATH = 'M4.6 2.6h6.8a.8.8 0 0 1 .8.8v9.4l-4.2-2.8-4.2 2.8V3.4a.8.8 0 0 1 .8-.8Z';

    /** Star glyph shared by the badge, the row menu, and the popover pin. */
    function TaskIcon(props) {
      const filled = props !== undefined && props.filled === true;
      const size = props !== undefined && typeof props.size === 'number' ? props.size : 16;
      const shape = (() => {
        if (TODO_ICON_VARIANT === 'star') {
          return filled
            ? h('path', { key: 'star', fill: 'currentColor', d: STAR_PATH })
            : h('path', {
                key: 'star',
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: 1,
                strokeLinejoin: 'round',
                d: STAR_PATH,
              });
        }
        if (TODO_ICON_VARIANT === 'bookmark') {
          return filled
            ? h('path', { key: 'bookmark', fill: 'currentColor', d: BOOKMARK_PATH })
            : h('path', {
                key: 'bookmark',
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: 1,
                strokeLinejoin: 'round',
                d: BOOKMARK_PATH,
              });
        }
        return [
          h('rect', {
            key: 'box',
            x: 2.4,
            y: 2.4,
            width: 11.2,
            height: 11.2,
            rx: 3.2,
            fill: filled ? 'currentColor' : 'none',
            fillOpacity: filled ? 0.14 : 0,
            stroke: 'currentColor',
            strokeWidth: 1,
          }),
          h('path', {
            key: 'check',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 1,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            d: 'M5.2 8.2 7.1 10.1 10.9 5.9',
          }),
        ];
      })();
      return h(
        'svg',
        {
          className: 'dsn-icon',
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          'aria-hidden': 'true',
          focusable: 'false',
        },
        shape,
      );
    }

    /**
     * The app's own running spinner (StateDot "ongoing"): a quiet full track
     * behind a rotating breathing arc, copied with renamed classes so the panel
     * matches the sidebar's native running indicator.
     */
    function RunningDot(props) {
      const size = props !== undefined && typeof props.size === 'number' ? props.size : 14;
      return h(
        'svg',
        {
          className: 'dsn-icon dsn-sd',
          viewBox: '0 0 24 24',
          width: size,
          height: size,
          'aria-hidden': 'true',
          focusable: 'false',
        },
        h(
          'g',
          { className: 'dsn-sd-motion' },
          h('circle', { className: 'dsn-sd-track', cx: 12, cy: 12, r: 9.5 }),
          h('circle', { className: 'dsn-sd-arc', cx: 12, cy: 12, r: 9.5 }),
        ),
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
     * Read the persisted todo map: sessionId -> { at, title, project }.
     *
     * A blocked, missing, or corrupted store yields an empty map. Todos are a
     * convenience, never a reason for the badge to fail.
     */
    function readTodos() {
      try {
        if (typeof localStorage === 'undefined') return new Map();
        const raw = localStorage.getItem(TODO_KEY);
        if (raw === null || raw === '') return new Map();
        const parsed = JSON.parse(raw);
        if (parsed === null || typeof parsed !== 'object') return new Map();
        const map = new Map();
        for (const [sessionId, entry] of Object.entries(parsed)) {
          if (entry === null || typeof entry !== 'object') continue;
          map.set(sessionId, {
            at: typeof entry.at === 'number' ? entry.at : Date.now(),
            title: typeof entry.title === 'string' ? entry.title : '',
            project: typeof entry.project === 'string' ? entry.project : '',
          });
        }
        return map;
      } catch (error) {
        console.warn('[session-notify] todo store unreadable:', error);
        return new Map();
      }
    }

    /** Persist the todo map; a full quota or blocked storage is logged and ignored. */
    function writeTodos(map) {
      try {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(TODO_KEY, JSON.stringify(Object.fromEntries(map)));
      } catch (error) {
        console.warn('[session-notify] todo store unwritable:', error);
      }
    }

    /** Find a sidebar row by its data-row-key; a malformed selector yields null. */
    function findRow(key) {
      if (typeof document === 'undefined') return null;
      try {
        return document.querySelector('[data-row-key="' + key + '"]');
      } catch (error) {
        return null;
      }
    }

    /** Scroll a sidebar row into view and flash it, then drop the marker again. */
    function flashRow(element) {
      if (element === null || element === undefined) return;
      try {
        element.scrollIntoView({ block: 'center', behavior: 'smooth' });
        element.classList.add(REVEAL_CLASS);
      } catch (error) {
        console.warn('[session-notify] reveal failed:', error);
        return;
      }
      window.setTimeout(() => {
        try {
          element.classList.remove(REVEAL_CLASS);
        } catch (error) {
          /* the sidebar may have re-rendered the row away */
        }
      }, REVEAL_FLASH_MS);
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
    function createTracker(ctx, statusRef) {
      const running = new Map();
      const unread = new Map();
      const todos = readTodos();
      const listeners = new Set();
      let snapshot = { total: 0, groups: [], todos: [], running: [] };
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

      /** Project title used as a todo subtitle; ungrouped when nothing owns it. */
      const projectLabelOf = (sessionId, index) => {
        const workspace = (index ?? workspaceIndex()).get(sessionId);
        if (workspace === undefined) return t()('group.ungrouped');
        return workspace.title || workspace.path || '';
      };

      /**
       * Reveal the sidebar row of a Session after opening it.
       *
       * `openSession` is asynchronous, so the row is probed once per frame for a
       * few frames. A manually collapsed project never renders its Session rows,
       * so its project row is revealed instead; a Session outside every project
       * is skipped silently, and nothing ever throws at the caller.
       */
      const revealSession = (sessionId) => {
        if (typeof sessionId !== 'string' || typeof window === 'undefined') return;

        const fallback = () => {
          const workspace = workspaceIndex().get(sessionId);
          if (workspace === undefined) return;
          flashRow(findRow('workspace:' + workspace.workspaceId));
        };

        let attempt = 0;
        const probe = () => {
          attempt += 1;
          const row = findRow('session:' + sessionId);
          if (row !== null) {
            flashRow(row);
            return;
          }
          if (attempt >= REVEAL_ATTEMPTS) {
            fallback();
            return;
          }
          window.setTimeout(probe, REVEAL_INTERVAL);
        };

        if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(probe);
        else probe();
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

      /**
       * Snapshot of the todos, newest first.
       *
       * A Session that vanished from a ready catalog is dropped for good; while
       * the catalog is still loading the stored title and project are used, so a
       * page reload cannot wipe the list before the Sessions arrive.
       */
      const rebuildTodos = (list, index) => {
        const ready = list.phase === 'ready';
        let dropped = false;
        const items = [];
        for (const [sessionId, entry] of [...todos]) {
          const row = list.byId?.[sessionId];
          if (row === undefined && ready) {
            todos.delete(sessionId);
            dropped = true;
            continue;
          }
          items.push({
            id: sessionId,
            at: entry.at,
            title: row === undefined ? entry.title || t()('untitled') : labelOf(row),
            project: projectLabelOf(sessionId, index) || entry.project,
          });
        }
        if (dropped) writeTodos(todos);
        return items.sort((left, right) => right.at - left.at);
      };

      /**
       * Active sessions: still running, or stopped while the Agent waits for the
       * user's answer (the sidebar's yellow state). Waiting rows sort first.
       */
      const rebuildActive = (list, index) => {
        const raw = statusRef !== undefined ? statusRef.current : undefined;
        // The snapshot is a Map per the types; tolerate plain-object shapes too.
        const statusMap = raw instanceof Map
          ? raw
          : (raw !== null && typeof raw === 'object'
            ? new Map(Object.entries(raw))
            : undefined);
        const items = [];
        for (const sessionId of list.ids ?? []) {
          const row = list.byId?.[sessionId];
          if (row === undefined || row.blank === true) continue;
          if (!isTrackable(list, sessionId, row)) continue;
          const status = statusMap !== undefined ? statusMap.get(sessionId) : undefined;
          const waiting = status !== undefined && status.pendingInteraction !== undefined;
          const isRunning = row.running === true;
          if (!isRunning && !waiting) continue;
          items.push({
            id: sessionId,
            title: labelOf(row),
            project: projectLabelOf(sessionId, index) || '',
            at: typeof row.updatedAt === 'number' ? row.updatedAt : 0,
            waiting,
          });
        }
        return items.sort((left, right) => (right.waiting === true ? 1 : 0) - (left.waiting === true ? 1 : 0) || right.at - left.at);
      };

      /**
       * Toggle the todo mark of a Session and persist it.
       *
       * Called from the popover pin; the rebuilt snapshot re-renders the row and
       * the badge, so the component keeps no todo state of its own.
       */
      const toggleTodo = (sessionId) => {
        if (typeof sessionId !== 'string') return;
        if (todos.delete(sessionId)) {
          writeTodos(todos);
          rebuild();
          return;
        }
        todos.set(sessionId, {
          at: Date.now(),
          title: labelOf(listSnapshot().byId?.[sessionId]),
          project: projectLabelOf(sessionId),
        });
        writeTodos(todos);
        rebuild();
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
        const todoItems = rebuildTodos(list, index);
        const activeItems = rebuildActive(list, index);
        const next = {
          total: ordered.reduce((sum, group) => sum + group.items.length, 0),
          groups: ordered,
          todos: todoItems,
          running: activeItems,
        };
        const nextSignature = JSON.stringify([
          ordered.map((group) => [group.key, group.title, group.items.map((item) => item.id)]),
          todoItems.map((item) => [item.id, item.at, item.title, item.project]),
          activeItems.map((item) => [item.id, item.title, item.project, item.waiting === true]),
        ]);
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
        revealSession,
        toggleTodo,
      };
    }

    /** Defensive outer component: a missing injected hook must not blank the slot. */
    function NotifyBadge(props) {
      if (typeof props.useSessionNotify !== 'function') return null;
      return h(NotifyBadgeView, props);
    }

    /**
     * One row of the Session "..." menu: star or unstar that Session.
     *
     * The slot shares the menu's open-state hook, so the row closes the menu the
     * same way the built-in pin/rename rows do before it toggles the mark.
     */
    function TodoMenuItem(props) {
      const { sessionId, toggleTodo, useSessionNotify, useMenuOpenState, t } = props;
      const state = typeof useSessionNotify === 'function' ? useSessionNotify((snapshot) => snapshot) : undefined;
      const pinned = (state?.todos ?? []).some((item) => item.id === sessionId);
      const menu = typeof useMenuOpenState === 'function' ? useMenuOpenState() : undefined;
      const closeMenu = () => {
        if (menu === undefined) return;
        try {
          menu[1](false);
        } catch (error) {
          /* the menu may already be unmounted */
        }
      };
      const label = t(pinned ? 'todo.remove' : 'todo.add');
      return h(
        'button',
        {
          type: 'button',
          role: 'menuitem',
          className: 'dsn-menu-item',
          'aria-label': label,
          'aria-pressed': pinned ? 'true' : 'false',
          title: label,
          onClick: (event) => {
            event.stopPropagation();
            closeMenu();
            if (typeof toggleTodo === 'function') toggleTodo(sessionId);
          },
        },
        h('span', { className: 'dsn-menu-icon' }, h(TaskIcon, { filled: pinned, size: 14 })),
        h('span', { className: 'dsn-menu-label' }, label),
      );
    }

    /**
     * One popover row: opens the Session, plus a pin that toggles its todo mark.
     * The pin stops propagation so marking a row never opens it.
     */
    function NotifyRow({ item, subtitle, pinned, liveKind, t, onOpen, onToggle }) {
      const pinLabel = pinned ? t('todo.remove') : t('todo.add');
      return h(
        'div',
        { className: 'dsn-row' },
        h(
          'button',
          {
            type: 'button',
            className: 'dsn-item',
            title: item.title,
            onClick: () => onOpen(item.id),
          },
          h(
            'span',
            { className: 'dsn-item-title' },
            liveKind === 'spin'
              ? h('span', { className: 'dsn-run-spin' }, h(RunningDot, { size: 14 }))
              : null,
            liveKind === 'wait' ? h('span', { className: 'dsn-wait-dot', 'aria-hidden': 'true' }) : null,
            item.title,
          ),
          subtitle === undefined || subtitle === '' ? null : h('span', { className: 'dsn-item-sub' }, subtitle),
        ),
        h(
          'button',
          {
            type: 'button',
            className: 'dsn-pin',
            'aria-label': t('todo.aria', { action: pinLabel, title: item.title }),
            'aria-pressed': pinned ? 'true' : 'false',
            title: pinLabel,
            onClick: (event) => {
              event.stopPropagation();
              onToggle(item.id);
            },
          },
          h(TaskIcon, { filled: pinned, size: 16 }),
        ),
      );
    }

    /**
     * Footer control: todos plus the per-project list of finished Sessions.
     *
     * The badge counts unread completions; with none left it shows the todo count
     * and an outlined look, so "new completion" and "just a todo" stay distinct.
     */
    function NotifyBadgeView({ wide, t, openSession, revealSession, toggleTodo, useSessionNotify }) {
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

      const state = snapshot === undefined || snapshot === null ? {} : snapshot;
      const total = state.total ?? 0;
      const todos = state.todos ?? [];
      const running = state.running ?? [];

      const groups = state.groups ?? [];
      const todoCount = todos.length;
      const runningCount = running.length;
      const idle = total === 0 && todoCount === 0 && runningCount === 0;
      const pendingOnly = total === 0;
      const labelParts = [];
      if (total > 0) labelParts.push(t('badge.count', { n: total }));
      if (runningCount > 0) labelParts.push(t('badge.running', { n: runningCount }));
      if (todoCount > 0) labelParts.push(t('badge.todo', { n: todoCount }));
      const label = labelParts.length > 0 ? labelParts.join('，') : t('badge.idle');
      const todoIds = new Set(todos.map((item) => item.id));

      /** Close the popover, open the Session, then reveal its sidebar row. */
      const openAt = (sessionId) => {
        setOpen(false);
        openSession(sessionId);
        if (typeof revealSession === 'function') revealSession(sessionId);
      };

      const toggleAt = (sessionId) => {
        if (typeof toggleTodo === 'function') toggleTodo(sessionId);
      };

      const children = [
        h(
          'button',
          {
            key: 'toggle',
            type: 'button',
            className: idle ? 'dsn-button dsn-button-idle' : 'dsn-button',
            'aria-label': label,
            'aria-haspopup': 'dialog',
            'aria-expanded': open ? 'true' : 'false',
            title: label,
            onClick: () => setOpen((value) => !value),
          },
          h(BellIcon, { key: 'icon' }),
          wide && idle ? h('span', { key: 'label', className: 'dsn-label' }, t('tabs.todo')) : null,
          wide && total > 0
            ? h('span', { key: 'count', className: 'dsn-unread' }, String(total))
            : null,
          wide && todoCount > 0
            ? h(
                'span',
                { key: 'todos', className: 'dsn-todos', title: t('badge.todo', { n: todoCount }) },
                h('span', { key: 'star', className: 'dsn-todos-icon' }, h(TaskIcon, { filled: true, size: 16 })),
                String(todoCount),
              )
            : null,
          wide && runningCount > 0
            ? h(
                'span',
                {
                  key: 'run',
                  className: running.some((item) => item.waiting === true) ? 'dsn-run dsn-run-wait' : 'dsn-run',
                  title: running.some((item) => item.waiting === true)
                    ? t('badge.waiting', { n: runningCount })
                    : t('badge.running', { n: runningCount }),
                },
                h(RunningDot, { key: 'run-dot', size: 14 }),
                String(runningCount),
              )
            : null,
          !wide && total > 0
            ? h('span', { key: 'dot', className: 'dsn-dot', 'aria-hidden': 'true' })
            : null,
          !wide && runningCount > 0
            ? h('span', { key: 'dot-run', className: 'dsn-dot-run', 'aria-hidden': 'true' })
            : null,
          !wide && todoCount > 0
            ? h('span', { key: 'dot-pin', className: 'dsn-dot-pin', 'aria-hidden': 'true' })
            : null,
        ),
      ];

      if (open) {
        const rows = [
          h(
            'div',
            { key: 'head', className: 'dsn-head' },
            t('summary', { todo: todos.length, done: total, run: running.length }),
          ),
        ];

        // Unread completions are the urgent half, so they come first in a tinted
        // block; the todo list below stays plain because it is not time-critical.
        if (total > 0) {
          const doneRows = [h('div', { key: 'tabs.done', className: 'dsn-section dsn-section-done' }, t('tabs.done'))];
          for (const group of groups) {
            doneRows.push(h('div', { key: 'group:' + group.key, className: 'dsn-group' }, group.title));
            for (const item of group.items) {
              doneRows.push(
                h(NotifyRow, {
                  key: 'done:' + item.id,
                  item,
                  pinned: todoIds.has(item.id),
                  t,
                  onOpen: openAt,
                  onToggle: toggleAt,
                }),
              );
            }
          }
          rows.push(h('div', { key: 'done-block', className: 'dsn-done-block' }, doneRows));
        }

        // Running sessions come next: still alive, each row carries a breathing dot.
        if (running.length > 0) {
          rows.push(h('div', { key: 'tabs.running', className: 'dsn-section' }, t('tabs.running')));
          for (const item of running) {
            rows.push(
              h(NotifyRow, {
                key: 'run:' + item.id,
                item,
                subtitle: item.project,
                pinned: todoIds.has(item.id),
                liveKind: item.waiting === true ? 'wait' : 'spin',
                t,
                onOpen: openAt,
                onToggle: toggleAt,
              }),
            );
          }
        }

        rows.push(h('div', { key: 'tabs.todo', className: 'dsn-section' }, t('tabs.todo')));
        if (todos.length === 0) {
          rows.push(h('div', { key: 'todo.empty', className: 'dsn-empty' }, t('todo.empty')));
        }
        for (const item of todos) {
          rows.push(
            h(NotifyRow, {
              key: 'todo:' + item.id,
              item,
              subtitle: item.project,
              pinned: true,
              t,
              onOpen: openAt,
              onToggle: toggleAt,
            }),
          );
        }

        children.push(
          h(
            'div',
            {
              key: 'popover',
              className: wide ? 'dsn-popover' : 'dsn-popover dsn-popover-rail',
              role: 'dialog',
              'aria-label': t('badge.label'),
            },
            rows,
          ),
        );
      }

      return h('div', { ref: root, className: 'dsn-root' }, children);
    }

    return {
      inject: ['slots', 'locale', 'sessions', 'workspaces', 'remote', 'uiSession'],
      apply(ctx) {
        ctx.effect(() => installStyles(), '@local/dsh-session-notify: styles');
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), '@local/dsh-session-notify: dictionaries');

        const sessions = ctx.get('sessions');
        const statusRef = { current: undefined };
        const tracker = createTracker(ctx, statusRef);
        const uiSession = ctx.get('uiSession');

        ctx.effect(() => {
          const stops = [];
          const remote = ctx.get('remote');
          if (sessions !== undefined) stops.push(sessions.list.subscribe(tracker.reconcile));
          const workspaces = ctx.get('workspaces');
          if (workspaces !== undefined) stops.push(workspaces.list.subscribe(tracker.reconcile));
          if (uiSession !== undefined && uiSession.sessionStatus !== undefined) {
            // Live running / pending-interaction facts: the same source the
            // sidebar's own status dots consume. The subscribe callback is an
            // invalidation notice — re-read the snapshot inside it.
            stops.push(uiSession.sessionStatus.subscribe(() => {
              statusRef.current = uiSession.sessionStatus.getSnapshot();
              tracker.reconcile();
            }));
            statusRef.current = uiSession.sessionStatus.getSnapshot();
          }
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
                revealSession: tracker.revealSession,
                toggleTodo: tracker.toggleTodo,
              }),
            },
            NotifyBadge,
          ),
        );

        ctx.slots.inject('sidebar.workspaces.session.menu.item', () =>
          ctx.slots.register(
            {
              name: 'sidebar.workspaces.session.menu.item',
              id: 'session-notify-todo',
              order: 150,
              locale: NS,
              inject: () => ({
                hooks: { sessionNotify: tracker.store },
                toggleTodo: tracker.toggleTodo,
              }),
            },
            TodoMenuItem,
          ),
        );
      },
    };
  },
});
