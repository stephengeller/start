import { Command, flags } from "@oclif/command"
import cli from "cli-ux"
import * as path from "path"
import * as fs from "fs"
import * as spawn from "cross-spawn"

class Start extends Command {
  static description = "Start your repository!"

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({ char: "v" }),
    help: flags.help({ char: "h" }),
    // flag with no value (-f, --force)
    force: flags.boolean({ char: "f" }),
  }

  static args = [{ name: "directory", required: false }]

  async run() {
    const { args, flags } = this.parse(Start)
    const dir = path.join(process.cwd(), args.directory ?? "")

    const subdirs = ["scripts", "script", "dev/script", "dev/scripts"]
    const scriptNames = ["start", "dev-start"]
    const scriptExtensions = ["sh"]
    const scripts: string[] = scriptNames.concat(
      ...scriptNames.map(name => scriptExtensions.map(ext => `${name}.${ext}`))
    )

    const viableFiles: string[] = []
    subdirs.map(subdir => {
      const subdirPath = path.join(dir, subdir)
      try {
        fs.readdirSync(subdirPath).map(file => {
          if (scripts.includes(file)) {
            viableFiles.push(path.join(subdir, file))
          }
        })
      } catch (error) {}
    })

    let choice

    if (viableFiles.length > 1) {
      this.log(JSON.stringify(viableFiles, null, 2))
      choice = await cli.prompt(`We have ${viableFiles.length} available scripts,
please type out the script you'd like to use`)
      while (!viableFiles.includes(choice)) {
        choice = await cli.prompt(
          `${choice} is not in list, please choose another`
        )
      }
    } else if (viableFiles.length === 0) {
      this.error("No files found.")
    } else {
      choice = viableFiles[0]
    }

    this.log(dir, choice)

    const choiceWithPath = path.join(dir, choice)

    this.log(`Running script: ${choiceWithPath}\n`)
    process.chdir(path.dirname(choiceWithPath))
    const spawnedProcess = spawn(choiceWithPath, [], { stdio: "inherit" })
    spawnedProcess.on("exit", code => this.log(`\nDone with exit code ${code}`))
    process.chdir(__dirname)
  }
}

export = Start
