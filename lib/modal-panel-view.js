'use babel';

const path = require( 'path' );

export default class ModalPanelView {

  constructor( serialized_state, input_path, output_path ) {

    this.container = document.createElement('div');
    this.container.classList.add('atom-compile-less');

    const message = document.createElement('div');

    success_h = document.createElement('h1');
    success_h.textContent = 'Success';
    success_h.id = 'success';
    this.container.appendChild( success_h );

    no_output_h = document.createElement('h1');
    no_output_h.textContent = 'No Output';
    no_output_h.id = 'no_output';
    this.container.appendChild( no_output_h );

    filename_h = document.createElement('h2');
    filename_h.textContent = path.basename( output_path );
    filename_h.id = 'file';
    this.container.appendChild( filename_h );

    dirname_h = document.createElement('h3');
    dirname_h.textContent = path.dirname( output_path );
    dirname_h.id = 'directory';
    this.container.appendChild( dirname_h );
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.container.remove();
  }

  getElement() {
    return this.container;
  }

  setSuccess() {
    this.container.classList.remove('no_output');
    this.container.classList.add('success');
  }

  setNoOutput() {
    this.container.classList.remove('success');
    this.container.classList.add('no_output');
  }

}
