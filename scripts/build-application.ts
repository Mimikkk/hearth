import { Command, EnumType } from "jsr:@cliffy/command@1.0.0-rc.7";
import { resolve } from "jsr:@std/path";
import { type ApplicationName, config } from "../configurations/library/libraries.config.ts";

const projectRoot = Deno.cwd();
const runCommand = async (
  command: string,
  args: string[],
  location: string = "",
) => {
  const cmd = new Deno.Command(command, {
    args,
    cwd: resolve(projectRoot, location),
  });

  const status = await cmd.spawn().status;

  if (!status.success) {
    throw new Error(
      `Command '${command}' failed with exit code ${status.code}`,
    );
  }
};

await new Command()
  .name("build")
  .description("Build an application")
  .type(
    "application-name",
    new EnumType(Object.keys(config.applications) as ApplicationName[]),
  )
  .option(
    "-n, --name <name:application-name>",
    "Name of the application to build",
    {
      required: true,
    },
  )
  .action(async (options) => {
    const path = config.applications[options.name];

    await runCommand("deno", ["task", "build"], path);
  })
  .parse(Deno.args);
