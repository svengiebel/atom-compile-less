# REQUIRES

less = require "less"
fs   = require "fs"
path = require "path"
# loophole fix
# thanks to yhsiang http://discuss.atom.io/t/atom-content-security-policy-error/4425/5
{Function} = require "loophole"

# HELPER FUNCTIONS

getFileContents = (filePath, callback) ->
  content = ''
  fs.readFile filePath, 'utf-8', read = (err, data) ->
    throw err  if err
    callback data

# MAIN FUNCTIONS

compileFile = (filepath) ->
  outputCompressed = atom.config.get('atom-compile-less.compressCss')

  # COMPILE LESS TO CSS
  getFileContents filepath, (content) ->
    throw err if !content
    parser = new less.Parser({ paths: [path.dirname filepath] })
    parser.parse(content, (err, parsedContent) =>
      throw err if err

      outputCss = parsedContent.toCSS({ compress: outputCompressed })
      cssFilePath = filepath.replace(".less", ".css")

      # SAVE COMPILED FILE
      fs.writeFile( cssFilePath, outputCss, (err) ->
        console.log "FAILED TO COMPILE LESS: " + cssFilePath, err if err
        console.log "LESS FILE COMPILED TO: " + cssFilePath

        )

      )

atomCompileLess = ->

  currentEditor = atom.workspace.getActiveEditor()

  if currentEditor

    # SET COMPILE VARS
    currentFilePath  = currentEditor.getPath()

    if currentFilePath.substr(-4) == "less"

      # SET CONFIG VARS
      projectPath      = atom.project.getPath()
      projectMainLess  = atom.project.getPath() + atom.config.get('atom-compile-less.mainLessFile')

      includeMainFile  = atom.config.get('atom-compile-less.compileMainFile')

      # COMPILE FILE
      compileFile currentFilePath
      compileFile projectMainLess if includeMainFile

      #loophole fix
      global.Function = Function


# MODULE EXPORT

module.exports =

  configDefaults:
    mainLessFile:     "/main.less",
    compileMainFile:  true,
    compressCss:      true

  activate: (state) =>
    atom.workspaceView.command "core:save", => atomCompileLess()

  deactivate: ->

  serialize: ->
