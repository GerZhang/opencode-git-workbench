import {
  Command,
  MenuItem,
  Panel,
  Style,
  type PanelTab,
  type Plugin,
} from "@opencode/plugin/gui"
import { GitPanel } from "./GitPanel.tsx"
import { definition } from "./definition.ts"
import { styles } from "./styles.ts"

export const setup: Plugin.Setup<typeof definition> = (ctx) => {
  ctx.add(Style, styles)

  const tab: PanelTab = {
    id: "git",
    get title() {
      return ctx.t("panel.title")
    },
    pinned: true,
    closable: false,
  }

  ctx.add(Panel, {
    id: "git",
    region: "side",
    mobile: {
      get title() {
        return ctx.t("panel.title")
      },
      order: 40,
      kind: "menu",
      icon: "branch",
    },
    list: () => [tab],
    render: (props) => <GitPanel session={props.session} />,
  })

  ctx.add(Command, (): Command => ({
    id: "open",
    title: ctx.t("command.open"),
    description: ctx.t("panel.title"),
    group: ctx.t("panel.title"),
    section: "session",
    enabled: !!ctx.sessions.current(),
    run: () => {
      const session = ctx.sessions.current()
      if (session) ctx.layout.open(`${ctx.id}:git`, session)
    },
  }))

  ctx.add(MenuItem, (): MenuItem => {
    const session = ctx.sessions.current()

    return {
      menu: "session.panel",
      id: "git",
      title: ctx.t("menu.title"),
      icon: "branch",
      order: 20,
      opened: !!session && ctx.layout.state(`${ctx.id}:git`, session) !== "closed",
      run: () => {
        const current = ctx.sessions.current()
        if (current) ctx.layout.open(`${ctx.id}:git`, current)
      },
    }
  })
}
