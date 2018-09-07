'use babel';

import LessCompiler from './less-compiler.js';

import { CompositeDisposable } from 'atom';

export default {

  subscriptions: null,
  self: this,

  config: {
    shouldCompressCSS: {
      title: 'Compress CSS Output',
      type: 'boolean',
      default: true
    },
    shouldNotifySuccess: {
      title: 'Display Success Notification',
      type: 'boolean',
      default: true
    },
    lessFileExtension: {
      title: 'Less Input File Extension',
      type: 'string',
      default: '.less'
    },
    cssFileExtension: {
      title: 'CSS Output File Extension',
      type: 'string',
      default: '.css'
    },
    shouldCreateSourcemap: {
      title: 'Create Sourcemap',
      type: 'boolean',
      default: true
    },
    shouldInlineSourcemap: {
      title: 'Inline Sourcemap',
      type: 'boolean',
      default: true
    },
    sourcemapFileExtension: {
      title: 'Source Map File Extension',
      description: 'For out-of-line maps.',
      type: 'string',
      default: '.less.sourcemap'
    },
    successDisplayTime: {
      title: 'Time to Display Success Panel',
      description: 'in ms',
      type: 'integer',
      default: 500,
      minimum: 1
    }
  },

  activate( state ) {

    input_path = atom.workspace.getActiveTextEditor().getPath();
    self.compiler = new LessCompiler( state, input_path );

    self.subscription = atom.commands.add( 'atom-workspace', {
      'atom-compile-less:compile': this.compile
    } );

    self.subscriptions = new CompositeDisposable();
    self.subscriptions.add( self.subscription );
  },

  deactivate() {
    self.subscriptions.dispose();
    self.compiler.destroy();
  },

  serialize() {
  },

  compile() {
    let current_editor = atom.workspace.getActiveTextEditor();
    current_editor.save();
    current_editor.onDidSave( () => self.compiler.compile() );
  }

};
