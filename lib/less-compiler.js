'use babel';

import ModalPanelView from './modal-panel-view';

const path = require( 'path' );
const fs = require( 'fs' );
less = require("less");
const mkdir = require( '../node_modules/node-fs/lib/fs.js' );

class LessCompiler {

  constructor( state, less_input_path ) {

    this.loadConfigSettings();

    if ( ! less_input_path.endsWith( this.settings.less_file_extension ) ) {
      this.valid = false;
      let error_message = this.less_input_path + " is not a .less file.";
      atom.notifications.addError( error_message, {
        dismissable: true
      } );
    }
    else {
      this.valid = true;
      this.initInputPath( less_input_path );
      this.initOutputPath();
      this.initSourcemap();
      this.initModalView( state );
    }
  }

  loadConfigSettings() {
    this.settings = {
      less_file_extension:           'lessFileExtension',
      css_file_extension:            'cssFileExtension',
      sourcemap_file_extension:      'sourcemapFileExtension',
      display_time:                  'successDisplayTime',
      should_compress:               'shouldCompressCSS',
      should_notify_success:         'shouldNotifySuccess',
      should_use_system_root:        'shouldInterpretRootAsSystemRoot',
      css_output_directory_path:     'outputPath',
      should_create_sourcemap:       'shouldCreateSourcemap',
      should_inline_sourcemap:       'shouldInlineSourcemap'
    }
    let settings = Object.keys(this.settings);
    for ( let this_setting of settings ) {
      let this_atom_config_key = 'atom-compile-less.'
                               + this.settings[ this_setting ];
      this.settings[ this_setting ] = atom.config.get( this_atom_config_key );
    }
  }

  initInputPath( less_input_path ) {
    this.less_input_path = less_input_path;
    this.input_directory = path.dirname( this.less_input_path );
    this.input_filename = path.basename( this.less_input_path );
  }

  initOutputPath() {

    this.output_filename = this.input_filename.replace(
                             this.settings.less_file_extension,
                             this.settings.css_file_extension
                           );

    if ( this.settings.css_output_directory_path.startsWith('/') )
      this.initRootRelativeOutputPath();
    else
      this.initFileRelativeOutputPath();

    this.css_output_path = path.join(
      this.css_output_directory_path,
      this.output_filename
    );
  }

  initRootRelativeOutputPath() {
    if ( this.settings.should_use_system_root )
      // If we should use system root and our path starts with '/'
      // then we can simply use the provided path.
      this.css_output_directory_path = this.settings.css_output_directory_path;
    else {
      let project_root_path = this.projectRootPathForCurrentEditor();
      this.css_output_directory_path = path.join(
        project_root_path,
        this.settings.css_output_directory_path
      );
    }
  }

  initFileRelativeOutputPath() {
    this.css_output_directory_path = path.join(
      this.input_directory,
      this.settings.css_output_directory_path
    );
  }

  initModalView( state ) {
    this.modal_panel_view = new ModalPanelView(
                              state.ModalPanelViewState,
                              this.less_input_path,
                              this.css_output_path
                            );

    this.modal_panel = atom.workspace.addModalPanel({
      item:    this.modal_panel_view.getElement(),
      visible: false
    });
  }

  // Find the folder included in project that is root for this editor.
  // Ex: open /path/to/source_directory in project,
  //     editing source_directory/nested/path/to/some_class.js
  //     We want /path/to/source_directory.
  projectRootPathForCurrentEditor() {
    let current_path = atom.workspace.getActiveTextEditor().getPath();
    let project_directories = atom.project.getPaths();
    let project_root_path = null;
    project_directories.forEach( this_path => {
      if ( current_path.startsWith( this_path ) )
        project_root_path = this_path;
    });

    return project_root_path;
  }

  initSourcemap() {
    this.sourcemap_output_path = this.css_output_path
                               + this.settings.sourcemap_file_extension;
  }

  destroy() {
    this.modalPanel.destroy();
    this.ModalPanelView.destroy();
  }

  compile() {
    delete this.output;
    return this.valid
         ? fs.readFile(
             this.less_input_path,
             'utf-8',
             ( error, less_content ) => { this.parse( error, less_content ) }
           )
         : false;
  }

  parse( error, less_input ) {

    if ( error )
      atom.notifications.addError(
        error,
        {
          dismissable: true
        }
      );

    else {
      let options = {
        relativeUrls: true,
        filename:     this.less_input_path
      };
      if ( this.settings.should_create_sourcemap )
        options["sourceMap"] = this.settings.should_inline_sourcemap
                          ? { sourceMapFileInline: true }
                          : {};

      let self = this;
      less.render( less_input, options )
          .then(   (output) => { self.renderDidFinish(output) } )
          .catch(  (error) => { self.notify(error) } );
    }

  }

  renderDidFinish( output ) {
    /*
       output.css = string of css
       output.map = string of sourcemap
       output.imports = array of string filenames of the imports referenced
    */
    this.output = output;

    this.outputFile();
  }

  outputFile() {
    mkdir.mkdir( this.css_output_directory_path, 0744, true, ( error ) => {
      if ( error )
        this.notify( error );
      else
        this.writeToDestination();
    });
  }

  writeToDestination () {
    fs.writeFile(
       this.css_output_path,
       this.output.css,
       ( error ) => { this.notify( error ) }
     );

    if ( this.settings.should_create_sourcemap && ! this.settings.should_inline_sourcemap )
      fs.writeFile(
         this.sourcemap_output_path,
         this.output.map,
         ( error ) => { this.notify( error ) }
       );
  }

  notify( error ) {

    if ( error )
      atom.notifications.addError(
        error,
        {
          dismissable: true
        }
      );

    else if ( this.settings.should_notify_success ) {

      this.modal_panel.show();

      let modal_panel = this.modal_panel;
      setTimeout( function() { modal_panel.hide(); }, this.settings.display_time );
    }

  }

}

export default LessCompiler;
