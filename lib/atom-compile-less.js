var Function, atomCompileLess, compileFile, fs, getFileContents, less, path;

less = require("less");

fs = require("fs");

path = require("path");

Function = require("loophole").Function;

getFileContents = function(filePath, callback) {
  var content, read;
  content = '';
  return fs.readFile(filePath, 'utf-8', read = function(err, data) {
    if (err) {
      throw err;
    }
    return callback(data);
  });
};

compileFile = function(filepath) {
  var outputCompressed, showSuccessMessage;
  outputCompressed = atom.config.get('atom-compile-less.compressCss');
  showSuccessMessage = atom.config.get('atom-compile-less.showSuccessMessage');
  return getFileContents(filepath, function(content) {
    var parser;
    if (!content) {
      throw err;
    }
    parser = new less.Parser({
      paths: [path.dirname(filepath)]
    });
    return parser.parse(content, (function(_this) {
      return function(err, parsedContent) {
        var cssFilePath, outputCss;
        if (err) {
          throw err;
        }
        outputCss = parsedContent.toCSS({
          compress: outputCompressed
        });
        cssFilePath = filepath.replace(".less", ".css");
        return fs.writeFile(cssFilePath, outputCss, function(err) {
          var fileName, message;
          if (showSuccessMessage) {
            fileName = cssFilePath.split('/');
            fileName = fileName[fileName.length - 1];
            message = 'File <strong>' + fileName + '</strong> compiled! Yeih!';
            return atom.notifications.addSuccess(message);
          }
        });
      };
    })(this));
  });
};

atomCompileLess = function() {
  var currentEditor, currentFilePath, includeMainFile, projectMainLess, projectPath;
  currentEditor = atom.workspace.getActiveTextEditor();
  if (currentEditor) {
    currentFilePath = currentEditor.getPath();
    if (currentFilePath.substr(-4) === "less") {
      projectPath = atom.project.getPath();
      projectMainLess = atom.project.getPath() + atom.config.get('atom-compile-less.mainLessFile');
      includeMainFile = atom.config.get('atom-compile-less.compileMainFile');
      compileFile(currentFilePath);
      if (includeMainFile) {
        compileFile(projectMainLess);
      }
      return global.Function = Function;
    }
  }
};

module.exports = {
  configDefaults: {
    mainLessFile: "/main.less",
    compileMainFile: true,
    compressCss: true,
    showSuccessMessage: true
  },
  activate: (function(_this) {
    return function(state) {
      return atom.workspace.observeTextEditors(function(editor) {
        return editor.onDidSave((function(_this) {
          return function() {
            return atomCompileLess();
          };
        })(this));
      });
    };
  })(this),
  deactivate: function() {},
  serialize: function() {}
};
