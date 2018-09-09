'use babel';

import ModalPanelView from './modal-panel-view';

const path = require( 'path' );
const fs = require( 'fs' );
less = require("less");

class LessCompiler {

  constructor( state, less_input_path ) {

    this.less_file_extension = atom.config.get( 'atom-compile-less.lessFileExtension' );
    this.css_file_extension = atom.config.get( 'atom-compile-less.cssFileExtension' );
    this.sourcemap_file_extension = atom.config.get( 'atom-compile-less.sourcemapFileExtension' );
    this.display_time = atom.config.get( 'atom-compile-less.successDisplayTime' );
    this.should_compress = atom.config.get( 'atom-compile-less.shouldCompressCSS' );
    this.should_notify_success = atom.config.get( 'atom-compile-less.shouldNotifySuccess' );
    this.should_create_sourcemap = atom.config.get( 'atom-compile-less.shouldCreateSourcemap' );
    this.should_inline_sourcemap = atom.config.get( 'atom-compile-less.shouldInlineSourcemap' );


    this.less_input_path = less_input_path;
    this.directory = path.dirname( this.less_input_path );
    this.input_filename = path.basename( this.less_input_path );

    this.css_output_path = this.less_input_path.replace(this.less_file_extension, this.css_file_extension);
    this.sourcemap_output_path = this.css_output_path + this.sourcemap_file_extension;

    if ( this.less_input_path == this.css_output_path ) {
      this.valid = false;
      let error_message = this.less_input_path + " is not a .less file.";
      atom.notifications.addError( error_message, {
        dismissable: true
      } );
    }
    else {
      this.valid = true;
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
             ( error, less_content ) => this.parse( error, less_content )
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
      if ( this.should_create_sourcemap )
        options["sourceMap"] = this.should_inline_sourcemap
                          ? { sourceMapFileInline: true }
                          : {};

      less.render( less_input, options ).then( ( output ) => {
        /*
           output.css = string of css
           output.map = string of sourcemap
           output.imports = array of string filenames of the imports referenced
        */
        this.output = output;

        fs.writeFile(
           this.css_output_path,
           output.css,
           ( error ) => this.notify( error )
         );

        if ( this.should_create_sourcemap && ! this.should_inline_sourcemap )
          fs.writeFile(
             this.sourcemap_output_path,
             output.map,
             ( error ) => this.notify( error )
           );
      } ).catch( ( error ) => {
        atom.notifications.addError(
          error.message,
          {
            dismissable: true
          }
        );
      });
    }

  }

  notify( error ) {

    if ( error )
      atom.notifications.addError(
        error,
        {
          dismissable: true
        }
      );

    else if ( this.should_notify_success ) {

      this.modal_panel.show();

      let modal_panel = this.modal_panel;
      setTimeout( function() { modal_panel.hide(); }, this.display_time );
    }

  }

}

export default LessCompiler;
