import { Extension, InputRule } from "@tiptap/core";

const taskMarkerInputRegex = /^\s*(\[([ xX])\])\s?$/;

function isInsideBulletList(state: Parameters<InputRule["handler"]>[0]["state"]): boolean {
  const { $from } = state.selection;

  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.name === "bulletList") {
      return true;
    }
  }

  return false;
}

export const TaskListInputRule = Extension.create({
  name: "taskListMarkdownInputRule",

  addInputRules() {
    return [
      new InputRule({
        find: taskMarkerInputRegex,
        handler: ({ state, range, match, chain }) => {
          if (!isInsideBulletList(state)) {
            return null;
          }

          const checked = (match[2] ?? "").toLowerCase() === "x";
          const command = chain().deleteRange(range).toggleTaskList();

          if (checked) {
            command.updateAttributes("taskItem", { checked: true });
          }

          command.run();
        },
      }),
    ];
  },
});
